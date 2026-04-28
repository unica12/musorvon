# Claude Code Prompt — МусорВон PWA



---

You are a senior fullstack engineer. Build a production-ready PWA called "МусорВон" — a trash pickup on-demand service for a residential complex (1800 apartments).

## Tech Stack
- React 18 + TypeScript + Vite
- vite-plugin-pwa (Workbox, manifest, service worker)
- Tailwind CSS
- Zustand (global state)
- React Router v6
- Supabase (auth, database, realtime)
- ЮКасса (Yookassa) payment widget
- Web Push Notifications

## Color Palette (strict)
- Primary green: `#33A65A`
- Dark green: `#1A6B38`
- Light green bg: `#E6F4EA`
- Extra light green: `#F2FAF4`
- Background: `#F7FAF6`
- Ink: `#1A1F1A`
- Muted text: `#7F8A80`
- Border: `#E0EBE1`
- White: `#FFFFFF`

---

## Database Schema (Supabase)

### Table: `apartments`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | primary key |
| building | text | корпус |
| entrance | text | подъезд |
| floor | integer | этаж |
| apartment_number | text | номер квартиры |
| user_id | uuid | references auth.users |
| created_at | timestamptz | |

### Table: `orders`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | primary key |
| apartment_id | uuid | references apartments |
| user_id | uuid | references auth.users |
| status | text | enum: `pending`, `paid`, `courier_assigned`, `in_progress`, `completed`, `cancelled` |
| amount | integer | в копейках (10000 = 100 ₽) |
| payment_id | text | yookassa payment id |
| payment_status | text | enum: `pending`, `succeeded`, `cancelled` |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### Table: `push_subscriptions`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | primary key |
| user_id | uuid | references auth.users |
| subscription | jsonb | Web Push subscription object |
| created_at | timestamptz | |

---

## App Structure

```
src/
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── Badge.tsx
│   ├── layout/
│   │   ├── BottomNav.tsx
│   │   └── StatusBar.tsx
│   └── order/
│       └── OrderCard.tsx
├── pages/
│   ├── OnboardingPage.tsx
│   ├── RegisterPage.tsx
│   ├── HomePage.tsx
│   ├── PaymentPage.tsx
│   ├── SuccessPage.tsx
│   ├── HistoryPage.tsx
│   └── ProfilePage.tsx
├── store/
│   └── useAppStore.ts
├── lib/
│   ├── supabase.ts
│   ├── yookassa.ts
│   └── push.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useOrders.ts
│   └── usePush.ts
└── types/
    └── index.ts
```

---

## User Flow

### 1. ONBOARDING (только первый запуск)
- Splash screen с логотипом и тэглайном
- Кнопка "Начать" → `RegisterPage`

### 2. REGISTER
- Поля: Корпус, Подъезд, Этаж, Квартира
- Номер телефона → OTP через Supabase Auth
- Сохранить квартиру в БД → редирект на Home
- Записать в `localStorage` флаг завершённой регистрации

### 3. HOME (главный экран при повторных открытиях)
- Приветствие: "Привет, [имя]"
- Отображение адреса квартиры
- Зелёный статус-дот "Сервис работает"
- Большая hero-карточка с иконкой мусора
- Большая зелёная кнопка **"Вызвать уборку — 100 ₽"**
- Подпись: "Курьер приедет за 15–30 минут"
- Bottom nav: Главная / История / Профиль

### 4. PAYMENT PAGE
- Карточка-саммари заказа
- Список что входит
- Кнопка "Оплатить 100 ₽"
- Открывает виджет ЮКассы (embedded или redirect)
- При успехе → `SuccessPage`

### 5. SUCCESS PAGE
- Анимированная зелёная галочка
- "Заявка принята!"
- Таймер: "15–30 минут"
- Карточка деталей заказа
- Кнопка "На главную"

### 6. HISTORY PAGE
- Список прошлых заказов со статус-бейджами
- Цвета: pending=жёлтый, completed=зелёный, cancelled=серый

### 7. PROFILE PAGE
- Отображение данных квартиры
- Кнопка редактирования адреса
- Выход из аккаунта

---

## PWA Manifest (vite-plugin-pwa)

```js
{
  name: "МусорВон",
  short_name: "МусорВон",
  theme_color: "#33A65A",
  background_color: "#F7FAF6",
  display: "standalone",
  orientation: "portrait",
  icons: [
    { src: "icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "icon-512.png", sizes: "512x512", type: "image/png" },
    { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
  ]
}
```

Добавить логику промпта "Add to Home Screen" при первом посещении.

---

## Service Worker
- Кэширование app shell
- Stale-while-revalidate для API-ответов
- Offline fallback страница

---

## Payment Integration (Supabase Edge Functions)

### `create-payment`
- Создаёт платёж в ЮКассе через REST API
- Возвращает `payment_url` / `confirmation_token`

### `payment-webhook`
- Верифицирует подпись ЮКассы
- Обновляет `payment_status` в БД
- Отправляет push-уведомление пользователю

---

## Push Notifications
- Запрашивать разрешение после первого успешного заказа
- Сохранять subscription в `push_subscriptions`
- Уведомлять при: оплата подтверждена, курьер назначен, заказ выполнен

---

## Realtime
- Подписка на изменения статуса заказа на `SuccessPage` и `HistoryPage`
- Мгновенное обновление UI при смене статуса курьером

---

## Mobile-First Design Rules
- Все экраны: `max-width: 390px`, центрирование на десктопе
- Touch targets: минимум 44px по высоте
- Никакого горизонтального скролла
- Safe area insets: `env(safe-area-inset-*)`
- Корректный `meta viewport` для iOS
- Плавные переходы между страницами

---

## Environment Variables (`.env.local`)

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_YOOKASSA_SHOP_ID=
VITE_YOOKASSA_RETURN_URL=
SUPABASE_SERVICE_ROLE_KEY=
YOOKASSA_SECRET_KEY=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
```

---

## Code Quality Rules
- TypeScript strict mode, никаких `any`
- Все Supabase-запросы типизированы через generated types
- Error boundaries на всех страницах
- Loading skeletons для async-контента
- Toast-уведомления для ошибок через `react-hot-toast`
- Все строки интерфейса на русском языке

---

## Build Order (MVP)
1. Scaffolding: `npm create vite@latest musorvon -- --template react-ts`
2. Установка зависимостей
3. Supabase client + types
4. Auth flow (Phone OTP)
5. RegisterPage
6. HomePage с CTA
7. PaymentPage + заглушка ЮКассы (console.log)
8. SuccessPage
9. HistoryPage
10. ProfilePage
11. PWA manifest + service worker
12. Supabase Edge Functions для оплаты
13. Push-уведомления

---

Start by scaffolding the project:

```bash
npm create vite@latest musorvon -- --template react-ts
cd musorvon
npm install
```

Then install all dependencies and build the complete application following this specification.
