# Feature: promo week + payment packages

## Context
МусорВон — PWA сервис вызова уборки мусора. Стек: React 18 + TypeScript + Vite + Supabase + ЮКасса.
Supabase migrations уже применены (новые колонки и таблица packages готовы).

## Business logic
- Новая квартира получает 5 бесплатных выносов (1 руб каждый) — промо
- Промо привязано к `apartment_id`, НЕ к аккаунту (защита от мультиаккаунтов)
- На UI пишем "Первая неделя бесплатно" + подпись "до 5 выносов"
- После 5 промо-выносов → только платные пакеты
- Минимальный интервал между заказами: 3 часа (антиспам)

## Packages
```typescript
const PACKAGES = {
  '1':  { orders: 1,  amount: 100, label: '1 вынос',   saving: null },
  '5':  { orders: 5,  amount: 400, label: '5 выносов',  saving: 'экономия 20%' },
  '10': { orders: 10, amount: 700, label: '10 выносов', saving: 'экономия 30%' },
}
```

## DB schema (already migrated)

### apartments (existing + new columns)
- id, user_id, building, entrance, floor, apartment_number, created_at, email
- promo_orders_used: int4 (default 0) ← NEW
- promo_started_at: timestamptz ← NEW

### orders (existing + new columns)
- id, user_id, apartment_id, status, amount, payment_id, payment_status, created_at, updated_at
- is_promo: boolean (default false) ← NEW
- package_id: uuid (FK → packages.id, nullable) ← NEW

### packages (new table)
- id: uuid PK
- apartment_id: uuid FK → apartments.id
- total_orders: int4
- used_orders: int4 (default 0)
- amount_paid: int4
- created_at: timestamptz

## Changes required

### 1. `supabase/functions/create-payment/index.ts`

Request body now includes:
```typescript
{
  apartmentId: string,
  packageType: '1' | '5' | '10' | null // null = use existing package balance
}
```

Logic before creating YooKassa payment:

```typescript
// 1. Get apartment with promo status
const { data: apartment } = await admin
  .from('apartments')
  .select('*')
  .eq('id', apartmentId)
  .single()

if (!apartment) return json({ error: 'Apartment not found' }, 404)

// 2. Check 3-hour cooldown
const { data: recentOrder } = await admin
  .from('orders')
  .select('created_at')
  .eq('apartment_id', apartmentId)
  .in('status', ['pending', 'paid', 'in_progress'])
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle()

if (recentOrder) {
  const diffMs = Date.now() - new Date(recentOrder.created_at).getTime()
  const threeHours = 3 * 60 * 60 * 1000
  if (diffMs < threeHours) {
    const remainingMs = threeHours - diffMs
    const remainingHours = Math.floor(remainingMs / 3600000)
    const remainingMins = Math.floor((remainingMs % 3600000) / 60000)
    return json({
      error: 'cooldown',
      message: `Следующий вынос доступен через ${remainingHours} ч ${remainingMins} мин`
    }, 400)
  }
}

// 3. Determine amount and type
const PROMO_LIMIT = 5
const isPromo = apartment.promo_orders_used < PROMO_LIMIT

let amount: number
let packageId: string | null = null

if (isPromo) {
  amount = 1
} else if (packageType) {
  // Buying new package
  const PACKAGES = { '1': 100, '5': 400, '10': 700 }
  amount = PACKAGES[packageType]
  if (!amount) return json({ error: 'Invalid package type' }, 400)
} else {
  // Using existing package balance
  const { data: activePackage } = await admin
    .from('packages')
    .select('*')
    .eq('apartment_id', apartmentId)
    .filter('used_orders', 'lt', 'total_orders') // has balance
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!activePackage) return json({ error: 'No active package' }, 400)
  packageId = activePackage.id
  amount = 0 // already paid, no charge needed — handle as instant success
}
```

When creating YooKassa payment — pass `is_promo` and `package_id` in order metadata so webhook can use them.

When inserting order into DB:
```typescript
await admin.from('orders').insert({
  user_id: userId,
  apartment_id: apartmentId,
  status: 'pending',
  amount,
  is_promo: isPromo,
  package_id: packageId,
})
```

### 2. `supabase/functions/payment-webhook/index.ts`

After payment `succeeded`:

```typescript
const order = await admin.from('orders').select('*').eq('payment_id', paymentId).single()

if (order.is_promo) {
  // Increment promo counter
  await admin.from('apartments')
    .update({ 
      promo_orders_used: apartment.promo_orders_used + 1,
      promo_started_at: apartment.promo_started_at ?? new Date().toISOString()
    })
    .eq('id', order.apartment_id)
} else if (order.package_id) {
  // Increment used_orders on existing package
  await admin.from('packages')
    .update({ used_orders: supabase.rpc('increment', { x: 1 }) })
    .eq('id', order.package_id)
} else {
  // New package purchase — create package record
  const PACKAGE_ORDERS = { 100: 1, 400: 5, 700: 10 }
  const totalOrders = PACKAGE_ORDERS[order.amount] ?? 1
  await admin.from('packages').insert({
    apartment_id: order.apartment_id,
    total_orders: totalOrders,
    used_orders: 1, // this order counts as first use
    amount_paid: order.amount,
  })
}
```

### 3. `src/pages/PaymentPage.tsx`

Replace current single button with full payment UI:

**State needed:**
```typescript
const [selectedPackage, setSelectedPackage] = useState<'1' | '5' | '10' | null>(null)
const [cooldownMessage, setCooldownMessage] = useState<string | null>(null)
```

**Fetch on mount:**
- apartment data (for `promo_orders_used`)
- active package balance (packages where used_orders < total_orders)

**UI structure:**

```
// If promo available (promo_orders_used < 5):
┌─────────────────────────────────────────┐
│ 🎉 Первая неделя бесплатно              │
│    до 5 выносов                         │
│                                         │
│ Осталось бесплатных: X из 5             │
│                                         │
│ [Вызвать бесплатно (1 ₽)]              │
└─────────────────────────────────────────┘

// Divider: "или выберите пакет"

// Package selector (3 cards):
┌────────────┐  ┌────────────┐  ┌────────────┐
│  1 вынос   │  │ 5 выносов  │  │ 10 выносов │
│   100 ₽    │  │   400 ₽    │  │   700 ₽    │
│            │  │  −20%      │  │  −30%      │
└────────────┘  └────────────┘  └────────────┘

// If active package balance exists:
┌─────────────────────────────────────────┐
│ 📦 У вас X выносов в пакете             │
│ [Использовать пакет]                    │
└─────────────────────────────────────────┘

// Cooldown message (if applicable):
⏳ Следующий вынос доступен через 2 ч 15 мин
```

**On pay button click:**
```typescript
const handlePay = async () => {
  const response = await supabase.functions.invoke('create-payment', {
    body: {
      apartmentId: apartment.id,
      packageType: isPromo ? null : selectedPackage,
    }
  })
  
  if (response.data?.error === 'cooldown') {
    setCooldownMessage(response.data.message)
    return
  }
  
  if (response.data?.confirmationUrl) {
    window.location.href = response.data.confirmationUrl
  }
}
```

### 4. `src/pages/HomePage.tsx`

Add package balance indicator below main CTA button:

```typescript
// Fetch active package on mount
const { data: activePackage } = await supabase
  .from('packages')
  .select('*')
  .eq('apartment_id', apartment.id)
  .filter('used_orders', 'lt', 'total_orders')
  .order('created_at', { ascending: true })
  .limit(1)
  .maybeSingle()

// Show if has balance:
// "📦 Осталось X выносов из пакета"
```

### 5. `src/types/index.ts`

Add new types:
```typescript
export interface Package {
  id: string
  apartment_id: string
  total_orders: number
  used_orders: number
  amount_paid: number
  created_at: string
}
```

Update `Order` type:
```typescript
export interface Order {
  // existing fields...
  is_promo: boolean
  package_id: string | null
}
```

## After all changes
Run `./deploy.sh`

## Important
- SQL migrations must be applied in Supabase BEFORE deploying
- Test promo flow: register new account → should see promo banner → pay 1 RUB
- Test cooldown: make order → try again immediately → should see cooldown message
- Test package: exhaust promo → buy 5-pack → make orders from package balance
