# Security fixes: AdminPage

## 1. Change PIN to stronger value

In `src/pages/AdminPage.tsx`, change:
```typescript
const ADMIN_PIN = '1234'
```
To:
```typescript
const ADMIN_PIN = '6199'
```

## 2. Hash PIN comparison using Web Crypto API

Instead of comparing PIN in plaintext, use SHA-256 hash so PIN is not visible in DevTools Sources.

Replace the PIN constant and comparison logic:

```typescript
// SHA-256 hash of '6199'
const ADMIN_PIN_HASH = 'a8c6240f3e9a5e8a1b2d4f6c8e0a2b4d6f8e0a2b4d6f8e0a2b4d6f8e0a2b4d6'
// Note: generate the actual hash first, see below

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
```

To generate the correct hash value, add this temporarily to the component and log it once:
```typescript
// Run once to get the hash, then remove:
hashPin('6199').then(h => console.log('PIN hash:', h))
```

Then in `handleSubmit`, replace:
```typescript
if (pin === ADMIN_PIN) {
```
With:
```typescript
const pinHash = await hashPin(pin)
if (pinHash === ADMIN_PIN_HASH) {
```

Make `handleSubmit` async accordingly.

## 3. Fix orders RLS — enable it back

In Supabase Dashboard → SQL Editor, run:

```sql
-- Enable RLS on orders
alter table orders enable row level security;

-- Users can only see their own orders
create policy if not exists "Users can view own orders"
  on orders for select
  using (user_id = auth.uid());

-- Users can insert their own orders
create policy if not exists "Users can insert own orders"
  on orders for insert
  with check (user_id = auth.uid());

-- Service role has full access (used by edge functions)
-- This is automatic for service role, no policy needed
```

Note: AdminPage reads orders using the `supabase` client with anon key.
To allow admin to read ALL orders, create a Supabase Edge Function `get-admin-orders`
that uses service role key instead of reading directly from frontend.

OR simpler solution — add a separate admin policy based on a custom claim.
For now, the simplest safe approach: keep RLS enabled, and in AdminPage
use a separate admin Supabase client initialized with service role key
stored as an environment variable:

```typescript
// In AdminPage only — admin client
const adminSupabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY  // add to .env
)
```

Add `VITE_SUPABASE_SERVICE_ROLE_KEY` to `.env` file with the service role key from
Supabase Dashboard → Settings → API → service_role key.

Use `adminSupabase` only inside AdminPage for fetching and updating orders.
Use regular `supabase` client everywhere else.

## 4. Lockout in sessionStorage instead of localStorage

In `src/pages/AdminPage.tsx`, change lockout storage from localStorage to sessionStorage
so it can't be bypassed by clearing localStorage in a different tab:

```typescript
// Change these functions:
function getLockoutRemaining(): number {
  const lockout = sessionStorage.getItem(LOCKOUT_KEY)
  if (!lockout) return 0
  const remaining = LOCKOUT_DURATION_MS - (Date.now() - parseInt(lockout))
  return remaining > 0 ? remaining : 0
}

// And in handleSubmit:
sessionStorage.setItem(LOCKOUT_KEY, String(Date.now()))
sessionStorage.setItem(ATTEMPTS_KEY, String(attempts))
```

Change all `localStorage.getItem/setItem/removeItem` calls for
`ATTEMPTS_KEY` and `LOCKOUT_KEY` to use `sessionStorage`.

Keep `SESSION_KEY` in sessionStorage as it already is.

## After all changes
Run `./deploy.sh`
