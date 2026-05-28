# МусорВон — Project Context

## What is this
PWA сервис вызова уборки мусора для ЖК на 1800 квартир.
100 руб за вынос. 3 первых выноса бесплатно (1 руб).

## Stack
- Frontend: React 18 + TypeScript + Vite + Tailwind + vite-plugin-pwa
- Backend: Supabase (PostgreSQL + Auth + Edge Functions + Realtime)
- Payments: ЮКасса (redirect flow)
- Deploy: Beget хостинг через FTP (./deploy.sh)
- Domain: musor-von.ru

## Key commands
```bash
./deploy.sh                          # build + deploy to Beget
npx supabase functions deploy <name> --project-ref xsdukqgrgqaazuwsiwiw  # deploy edge function
```

## Project structure
```
src/
  pages/          # Route pages
  components/     # UI components
  hooks/          # useAuth, useOrders
  store/          # useAppStore (Zustand)
  lib/            # supabase client
  types/          # TypeScript types
supabase/
  functions/
    create-payment/    # Creates YooKassa payment
    payment-webhook/   # Handles YooKassa webhooks
    check-payment/     # Polls payment status
```

## Supabase
- Project ref: xsdukqgrgqaazuwsiwiw
- Region: eu-west-2 (London)
- Edge functions deploy: `npx supabase functions deploy <name> --project-ref xsdukqgrgqaazuwsiwiw`

## Database tables
- `apartments` — user addresses (building, entrance, floor, apartment_number, promo_orders_used)
- `orders` — orders (status, amount, payment_id, payment_status, is_promo, package_id)
- `packages` — paid packages (total_orders, used_orders, amount_paid)
- `push_subscriptions` — web push subscriptions

## Business logic
- Promo: first 3 orders = 1 RUB each (tracked via apartments.promo_orders_used)
- After promo: 100 RUB per order
- Cooldown: 10 min between orders (auto-cancel pending orders older than 10 min)
- Working hours: 9:00–19:00 Moscow time
- ЖК: 4 корпуса (1-4), до 10 подъездов, 28 этажей, улица Виницкая

## Auth
- OTP via email (6 digits)
- Magic link disabled
- Custom SMTP: Beget (smtp.beget.com:465)

## Routes
- `/` — onboarding
- `/register/address` — step 1 registration
- `/register/email` — step 2 registration
- `/home` — main screen
- `/payment` — payment page
- `/payment/success` — post-payment screen
- `/history` — order history
- `/profile` — user profile
- `/admin` — admin panel (PIN 1234)
- `/legal` — public offer
- `/privacy` — privacy policy

## Known issues / decisions
- Service worker: module-level `_pollStarted` guard in PaymentSuccessPage to prevent infinite polling
- FTP_PATH in deploy.sh is `/` (Beget FTP user root = public_html)
- payment-webhook deployed with --no-verify-jwt (YooKassa doesn't send auth headers)
- Amount stored in RUB (not kopecks) in orders.amount
- promo_orders_used incremented by payment-webhook on payment.succeeded event
