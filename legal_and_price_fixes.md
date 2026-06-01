# Fixes: price, legal pages, consent

## 1. Change price from 100 RUB to 10 RUB (test period)

### `supabase/functions/create-payment/index.ts`
Change:
```typescript
const PACKAGE_AMOUNTS: Record<string, number> = { '1': 100, '5': 400, '10': 700 }
```
To:
```typescript
const PACKAGE_AMOUNTS: Record<string, number> = { '1': 10, '5': 400, '10': 700 }
```

### `src/pages/PaymentPage.tsx`
Change PACKAGES object:
```typescript
const PACKAGES = {
  '1': { orders: 1, amount: 10, label: '1 вынос', saving: null },
  // rest unchanged
}
```

Update button text to show 10 RUB instead of 100 RUB everywhere on this page.

Deploy edge function after:
```bash
npx supabase functions deploy create-payment --project-ref xsdukqgrgqaazuwsiwiw
```


## 2. Update privacy policy date

In `src/pages/PrivacyPage.tsx`, find:
```
Последнее обновление: май 2025 г.
```
Replace with:
```
Последнее обновление: май 2026 г.
```

## 3. Add separate consent to personal data processing

### Step 1 — Add consent table in Supabase
Run this SQL in Supabase Dashboard → SQL Editor:
```sql
create table if not exists consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  consent_text text not null,
  consented_at timestamptz default now(),
  ip_address text
);

alter table consents enable row level security;

create policy "Users can insert own consent"
  on consents for insert
  with check (user_id = auth.uid());

create policy "Users can view own consent"
  on consents for select
  using (user_id = auth.uid());
```

### Step 2 — Create consent modal component
Create `src/components/ConsentModal.tsx`:

```tsx
import { useState } from 'react'
import { Button } from './ui/Button'

interface ConsentModalProps {
  onAccept: () => void
}

export function ConsentModal({ onAccept }: ConsentModalProps) {
  const [checked, setChecked] = useState(false)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md flex flex-col gap-4">
        <h2 className="text-lg font-bold text-[#1A1F1A]">
          Согласие на обработку персональных данных
        </h2>
        <div className="text-sm text-[#7F8A80] flex flex-col gap-2 max-h-48 overflow-y-auto">
          <p>Оператор: Земсков Андрей Васильевич, ИНН 773272369185</p>
          <p>Я даю согласие на обработку следующих персональных данных:</p>
          <ul className="list-disc pl-4 flex flex-col gap-1">
            <li>Адрес электронной почты</li>
            <li>Адрес квартиры (корпус, подъезд, этаж, номер)</li>
            <li>Имя пользователя</li>
            <li>Данные о заказах</li>
          </ul>
          <p>Цель: оказание услуги по выносу мусора.</p>
          <p>Срок хранения: до удаления аккаунта.</p>
          <p>
            Я понимаю, что вправе в любой момент отозвать согласие,
            направив запрос на andreyzemsckoff@yandex.ru
          </p>
        </div>
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="consent-check"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-1 w-5 h-5 accent-green-600 flex-shrink-0"
          />
          <label htmlFor="consent-check" className="text-sm text-[#1A1F1A]">
            Я ознакомился(-ась) с условиями и даю согласие на обработку
            моих персональных данных
          </label>
        </div>
        <Button fullWidth size="lg" disabled={!checked} onClick={onAccept}>
          Подтвердить
        </Button>
      </div>
    </div>
  )
}
```

### Step 3 — Show consent modal after registration
In `src/pages/RegisterPage.tsx` (OTP verification step),
after successful sign in (user is created), before navigating to /home:

1. Check if user already has consent in `consents` table
2. If no consent — show `ConsentModal`
3. On accept — save to `consents` table then navigate

```typescript
// After successful OTP verification:
const { data: existingConsent } = await supabase
  .from('consents')
  .select('id')
  .eq('user_id', user.id)
  .maybeSingle()

if (!existingConsent) {
  setShowConsentModal(true)
  return // wait for consent
}

// In handleConsentAccept:
const handleConsentAccept = async () => {
  await supabase.from('consents').insert({
    user_id: user.id,
    consent_text: 'Согласие на обработку персональных данных v1.0 — май 2026',
  })
  setShowConsentModal(false)
  navigate('/home')
}
```

## After all changes
Run `./deploy.sh`
