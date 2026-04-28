# Claude Code — Панель оператора (дворника) /admin

Build a simple operator admin panel at `/admin` route for the МусорВон PWA.

## What is this

A separate page for the janitor/courier (дворник) to:
- See all incoming orders
- Change order status
- No complex auth — just a simple PIN code to access

---

## Step 1 — Supabase: add admin flag to orders

Run this SQL in Supabase SQL Editor:

```sql
-- Allow admin to read and update all orders (bypass RLS)
create policy "Admin can read all orders" on orders
  for select using (true);

create policy "Admin can update all orders" on orders
  for update using (true);
```

Also add an index for faster queries:
```sql
create index orders_status_idx on orders(status);
create index orders_created_at_idx on orders(created_at desc);
```

---

## Step 2 — Create AdminPage.tsx

File: `src/pages/AdminPage.tsx`

### PIN protection
- Hardcode PIN: `1234` (stored as constant, easy to change later)
- On first visit to `/admin` show a PIN input screen
- Store PIN session in `sessionStorage` (clears when browser tab closes)
- Wrong PIN → shake animation + toast "Неверный PIN"

### PIN screen UI
```
┌─────────────────────┐
│       🔐             │
│   Панель оператора   │
│                      │
│  [  _  _  _  _  ]   │
│                      │
│    [  Войти  ]       │
└─────────────────────┘
```

### Main admin UI (after PIN)

Header:
- Title: "Заявки"
- Subtitle: "МусорВон · Панель оператора"
- Logout button (clears sessionStorage, back to PIN)
- Auto-refresh every 30 seconds

Tabs / filter pills:
- "Новые" (status: paid) — shown first, highlighted
- "В работе" (status: in_progress)  
- "Выполненные" (status: completed)
- "Все"

Order card (for each order):
```
┌──────────────────────────────────┐
│ 🏠 Корп.1 · Подъезд 3 · Эт.7 · Кв.148  │
│ Иван · ivan@mail.ru              │
│ 14:32 · 100 ₽                   │
│                                  │
│ [В работе ▾]  [✓ Выполнено]     │
└──────────────────────────────────┘
```

Status badge colors:
- `paid` → синий "💳 Оплачено" (новая заявка, ждёт курьера)
- `in_progress` → жёлтый "🚶 В работе"
- `completed` → зелёный "✅ Выполнено"
- `cancelled` → серый "❌ Отменено"

Actions on each card:
- Dropdown or buttons to change status
- "В работе" button → updates status to `in_progress`
- "Выполнено" button → updates status to `completed`
- Confirm dialog before marking as completed: "Отметить заявку как выполненную?"

### Realtime updates
Subscribe to Supabase Realtime on `orders` table:
```typescript
supabase
  .channel('admin-orders')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'orders' 
  }, () => {
    fetchOrders() // refresh list
  })
  .subscribe()
```

Show a green dot "● Live" in header when realtime is connected.

### Empty state
If no orders in selected tab:
```
🎉 Нет заявок
Новые заявки появятся здесь автоматически
```

---

## Step 3 — Fetch order data with apartment info

Query orders with apartment join:

```typescript
const { data } = await supabase
  .from('orders')
  .select(`
    *,
    apartments (
      building,
      entrance,
      floor,
      apartment_number
    )
  `)
  .order('created_at', { ascending: false })
```

Also fetch user email via `auth.users` — use Supabase service role or store email in apartments table.

**Easiest solution**: when user registers, save their email in the `apartments` table too.
Add `email` column to apartments:

```sql
alter table apartments add column email text;
```

Update RegisterAddressPage or AuthCallbackPage to save `session.user.email` into apartments.email on insert.

---

## Step 4 — Add route in App.tsx

```typescript
import AdminPage from './pages/AdminPage'

// Add to router — NO auth guard, PIN protected internally
<Route path="/admin" element={<AdminPage />} />
```

Admin route must be completely public (no Supabase auth required) — the PIN is the only protection.

---

## Step 5 — Design

Use the same color palette as the rest of the app:
- Background: #F7FAF6
- Green: #33A65A
- Cards: white with border #E0EBE1
- Mobile-first, max-width 390px centered

The admin panel should work on mobile (dворник uses phone).

---

## Step 6 — Update Supabase RLS

The admin reads ALL orders, not just their own.
Current RLS policy only allows users to see their own orders.

Option A (simple): disable RLS on orders for now
```sql
alter table orders disable row level security;
```

Option B (proper): use a separate Supabase anon key with service role in admin
For MVP use Option A.

---

## Step 7 — After building, verify:

- [ ] `/admin` shows PIN screen
- [ ] Wrong PIN shows error
- [ ] Correct PIN (1234) shows orders list
- [ ] Orders load from Supabase with apartment address
- [ ] Status change updates in Supabase immediately
- [ ] Realtime: placing a new order from user app → appears in admin without refresh
- [ ] Tabs filter correctly
- [ ] Mobile layout looks clean
- [ ] `npx tsc --noEmit` → zero errors

---

## Notes

- PIN can be changed later to per-operator auth
- For now one shared PIN is enough for MVP (1 janitor)
- Don't add /admin link anywhere in the user app — operator accesses it directly by URL
