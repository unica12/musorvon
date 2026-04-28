# Claude Code — Security Audit МусорВон PWA

You are a senior security engineer. Perform a full security audit of the МусорВон PWA project and fix all found vulnerabilities. This is a real app that will handle user data and payments.

---

## Step 1 — Scan all source files

```bash
find src -type f -name "*.tsx" -o -name "*.ts" | sort
cat .env.local
```

---

## Step 2 — Check each security area

### 🔴 CRITICAL

**2.1 Exposed secrets**
- Check that `.env.local` is in `.gitignore`
- Check that NO secrets appear in `src/` files (hardcoded API keys, passwords, service role keys)
- The Supabase `service_role` key must NEVER be in any `VITE_` prefixed variable — it would be exposed to the browser
- Admin PIN must not be the only protection for sensitive operations

```bash
grep -r "service_role" src/
grep -r "secret" src/
grep -rn "SUPABASE_SERVICE_ROLE" src/
```

If service_role key is found in src/ — this is a critical vulnerability. Remove it immediately.

**2.2 Supabase RLS (Row Level Security)**
Check that RLS is enabled on all tables and policies are correct:

```sql
-- Run in Supabase SQL Editor to check RLS status
select schemaname, tablename, rowsecurity 
from pg_tables 
where schemaname = 'public';
```

Required policies:
- `apartments`: user can only read/write their own rows (`auth.uid() = user_id`)
- `orders`: user can only read/write their own rows (`auth.uid() = user_id`)
- `push_subscriptions`: user can only read/write their own rows

If `alter table orders disable row level security` was run earlier — re-enable it:

```sql
alter table orders enable row level security;

-- Drop overly permissive policies
drop policy if exists "Admin can read all orders" on orders;
drop policy if exists "Admin can update all orders" on orders;

-- User policies
create policy "Users read own orders" on orders
  for select using (auth.uid() = user_id);

create policy "Users insert own orders" on orders
  for insert with check (auth.uid() = user_id);

create policy "Users update own orders" on orders
  for update using (auth.uid() = user_id);
```

For admin panel — use Supabase service role key in Edge Function, NOT in browser code.

**2.3 Admin panel security**
Current PIN-only protection is weak. Improve it:
- Move admin data fetching to a Supabase Edge Function that requires a secret header
- Or: add rate limiting to PIN attempts (max 5 wrong attempts → 15 min lockout)
- Store lockout in localStorage with timestamp

Implement lockout in AdminPage.tsx:
```typescript
const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 min

// On wrong PIN:
const attempts = parseInt(localStorage.getItem('admin_attempts') || '0') + 1
localStorage.setItem('admin_attempts', attempts.toString())
if (attempts >= MAX_ATTEMPTS) {
  localStorage.setItem('admin_lockout', Date.now().toString())
  toast.error('Слишком много попыток. Попробуйте через 15 минут.')
}

// On page load — check lockout:
const lockout = localStorage.getItem('admin_lockout')
if (lockout && Date.now() - parseInt(lockout) < LOCKOUT_DURATION) {
  // show lockout screen
}
```

---

### 🟡 IMPORTANT

**2.4 Input validation**
In RegisterAddressPage.tsx — validate all fields before saving:
```typescript
// Building, entrance — only numbers or letters, max 10 chars
const isValidField = (val: string) => /^[a-zA-Zа-яА-Я0-9\s]{1,10}$/.test(val.trim())

// Floor — must be number between 1 and 100
const isValidFloor = (val: string) => {
  const n = parseInt(val)
  return !isNaN(n) && n >= 1 && n <= 100
}

// Apartment — 1-6 chars
const isValidApartment = (val: string) => /^[0-9]{1,6}[а-яА-Я]?$/.test(val.trim())
```

**2.5 Email validation**
In RegisterPage.tsx — validate email format before sending magic link:
```typescript
const isValidEmail = (email: string) => 
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
```

**2.6 localStorage sensitive data**
`musorvon_pending_address` in localStorage is fine — it contains no sensitive data.
But make sure it's always cleared after use:
- In AuthCallbackPage.tsx — call `localStorage.removeItem('musorvon_pending_address')` after successful insert (not just on success, but also on error/timeout)

**2.7 Error messages**
Never expose internal error details to users. In all catch blocks:
```typescript
// BAD — exposes internal info:
toast.error(error.message)

// GOOD — generic message for user, log internally:
console.error('[ComponentName] error:', error)
toast.error('Что-то пошло не так. Попробуйте снова.')
```

Exception: auth errors can show specific messages like "Неверный код" or "Ссылка устарела".

**2.8 XSS protection**
Check that no user input is rendered as raw HTML:
```bash
grep -rn "dangerouslySetInnerHTML" src/
grep -rn "innerHTML" src/
```

If found — remove or sanitize with DOMPurify.

**2.9 Supabase anon key scope**
The `VITE_SUPABASE_ANON_KEY` is public and that's fine — it's designed to be.
But make sure Supabase RLS policies protect the data, not the key itself.

---

### 🟢 GOOD PRACTICE

**2.10 HTTPS only**
Add to `vite.config.ts`:
```typescript
server: {
  https: false // ok for dev
}
```
Vercel will handle HTTPS in production automatically.

**2.11 Content Security Policy**
Add to `index.html` `<head>`:
```html
<meta http-equiv="Content-Security-Policy" 
  content="default-src 'self'; 
           script-src 'self' 'unsafe-inline'; 
           connect-src 'self' https://*.supabase.co wss://*.supabase.co;
           img-src 'self' data:;
           style-src 'self' 'unsafe-inline';">
```

**2.12 Sensitive data in URL**
Check that no sensitive data is passed in URL params:
```bash
grep -rn "useSearchParams\|URLSearchParams\|window.location.search" src/
```

**2.13 Auth token storage**
Supabase stores auth tokens in localStorage by default — this is standard and acceptable for PWA.
No action needed.

---

## Step 3 — Fix all found issues

For each issue found:
1. Print the vulnerability name and severity
2. Show the affected file and line
3. Apply the fix

---

## Step 4 — Generate security report

After fixing, print a report:

```
## Security Audit Report — МусорВон

### 🔴 Critical (fixed)
- [ ] list of critical issues fixed

### 🟡 Important (fixed)  
- [ ] list of important issues fixed

### 🟢 Good practice (applied)
- [ ] list of improvements applied

### ⚠️ Remaining risks (require manual action)
- RLS policies — verify in Supabase dashboard
- Admin PIN — consider replacing with proper auth before scaling
- SMTP — use your own domain for production emails

### ✅ Already secure
- list of things that were already correct
```

---

## Step 5 — Final check

```bash
npx tsc --noEmit
```

Zero TypeScript errors required.
