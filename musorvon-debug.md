# Claude Code — Debug & Self-Test Prompt


---

You are a senior QA engineer and fullstack developer. Your job is to fully audit, test, and fix the МусорВон PWA project in the current directory.

## Step 1 — Check the environment

Run these commands and analyze the output:

```bash
# Check node and npm versions
node -v && npm -v

# Check all dependencies are installed
npm install

# Check for TypeScript errors
npx tsc --noEmit

# Check .env.local exists and has required keys
cat .env.local
```

Fix any dependency or TypeScript errors before proceeding.

## Step 2 — Start the dev server

```bash
npm run dev &
sleep 5
```

Confirm the server is running on http://localhost:5173

## Step 3 — Audit every source file

Read and analyze ALL files in src/ directory:

```bash
find src -type f -name "*.tsx" -o -name "*.ts" | sort
```

For each file check:
- No infinite loops in useEffect (missing dependency array [])
- No unhandled promise rejections
- No missing error boundaries
- Loading states always have an exit condition (never stuck forever)
- All Supabase calls wrapped in try/catch

## Step 4 — Fix the known critical bugs

### Bug 1: useAuth infinite loop
In `src/hooks/useAuth.ts`, ensure getSession is called ONCE with useEffect(() => { ... }, [])
Replace any polling or repeated calls with a single onAuthStateChange listener:

```typescript
useEffect(() => {
  // Get initial session ONCE
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session)
    setUser(session?.user ?? null)
    setLoading(false)
  })

  // Listen for changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }
  )

  return () => subscription.unsubscribe()
}, []) // <-- empty array, runs ONCE
```

### Bug 2: React StrictMode
In `src/main.tsx`, remove StrictMode wrapper — it causes Supabase auth lock issues:

```typescript
// REMOVE THIS:
// <React.StrictMode><App /></React.StrictMode>

// USE THIS:
ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
```

### Bug 3: Loading state stuck forever
In every page component, make sure loading spinner has a timeout fallback:

```typescript
// Add this to any page with loading state
useEffect(() => {
  const timeout = setTimeout(() => {
    if (loading) {
      setLoading(false)
      toast.error('Превышено время ожидания. Попробуйте снова.')
    }
  }, 10000)
  return () => clearTimeout(timeout)
}, [loading])
```

## Step 5 — Test every user flow

Manually verify each route works by checking the component logic:

### Flow 1: First open → Onboarding
- [ ] OnboardingPage renders correctly
- [ ] "Начать" button navigates to /register
- [ ] localStorage flag checked correctly

### Flow 2: Registration
- [ ] All 4 address fields render (Корпус, Подъезд, Этаж, Квартира)
- [ ] Email/phone input renders
- [ ] Submit button triggers auth call
- [ ] Loading state shows during auth
- [ ] Error shown if auth fails (not infinite spinner)
- [ ] On success → navigates to /home

### Flow 3: Home screen
- [ ] User greeting shows correctly
- [ ] Apartment address displayed
- [ ] "Вызвать уборку — 100 ₽" button works
- [ ] Clicking button navigates to /payment
- [ ] Bottom nav works (Home/History/Profile)

### Flow 4: Payment (mock)
- [ ] Order summary shows correctly
- [ ] "Оплатить 100 ₽" button shows loading for 2 seconds
- [ ] After mock delay → creates order in Supabase with status 'paid'
- [ ] Redirects to /success

### Flow 5: Success page
- [ ] Checkmark animation plays
- [ ] Order details show correctly
- [ ] "На главную" returns to /home

### Flow 6: History page
- [ ] Past orders fetched from Supabase
- [ ] Status badges colored correctly
- [ ] Empty state shown if no orders

### Flow 7: Profile page
- [ ] Apartment info displayed
- [ ] Sign out works and redirects to /onboarding or /register

## Step 6 — Fix all found issues

After auditing, fix every issue found. For each fix:
1. State what the bug is
2. Show the fix
3. Apply it to the file

## Step 7 — Final check

```bash
npx tsc --noEmit
```

There should be zero TypeScript errors.

Report a summary of:
- ✅ What works
- 🔧 What was fixed
- ⚠️ What still needs attention (e.g. real ЮКасса integration, VAPID keys)
