# Admin panel improvements + feedback button

## 1. Sound + vibration on new order in AdminPage

In `src/pages/AdminPage.tsx`, when a new order arrives via Realtime subscription,
play a notification sound and vibrate the device.

Add this function:
```typescript
function notifyNewOrder() {
  // Vibration (mobile)
  if ('vibrate' in navigator) {
    navigator.vibrate([200, 100, 200])
  }

  // Sound — use Web Audio API, no external files needed
  const ctx = new AudioContext()
  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  oscillator.frequency.setValueAtTime(880, ctx.currentTime)
  oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.1)
  gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)

  oscillator.start(ctx.currentTime)
  oscillator.stop(ctx.currentTime + 0.5)
}
```

Call `notifyNewOrder()` inside the Realtime subscription handler when
event type is `INSERT` (new order arrived).

Also show a toast notification:
```typescript
toast('🆕 Новый заказ!', { duration: 5000, icon: '🔔' })
```

## 2. Cancel order button in AdminPage

In `src/pages/AdminPage.tsx`, add a cancel button to each order card.

- Show cancel button on orders with status `paid` or `in_progress`
- Button label: "Отменить"
- Style: small, red/outlined, destructive look
- Ask for confirmation before cancelling:
  ```
  "Отменить заказ кв. {apartment_number}?"
  ```
- On confirm: update order status to `cancelled` in Supabase
- Order disappears from active list after cancellation

```typescript
const handleCancel = async (orderId: string, apartmentNumber: string) => {
  const confirmed = window.confirm(`Отменить заказ кв. ${apartmentNumber}?`)
  if (!confirmed) return

  await supabase
    .from('orders')
    .update({ 
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
}
```

## 3. "Написать нам" button in ProfilePage

In `src/pages/ProfilePage.tsx`, add a support contact button.

Add below the main profile info, before the logout button:

```tsx
<a
  href="https://t.me/ТВОЙ_ТГ_НИК"
  target="_blank"
  rel="noopener noreferrer"
  className="flex items-center justify-center gap-2 w-full py-4 bg-white border border-[#E0EBE1] rounded-2xl text-[#1A1F1A] font-medium text-base"
>
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#2AABEE">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.48 14.49 5.52 13.6c-.658-.205-.67-.658.136-.975l10.857-4.187c.548-.198 1.026.12.85.81h-.8z"/>
  </svg>
  Написать нам в Telegram
</a>
```

Replace `ТВОЙ_ТГ_НИК` with the actual Telegram username.

Also add support email below:
```tsx
<a
  href="mailto:noreply@musor-von.ru"
  className="text-center text-sm text-[#7F8A80] underline"
>
  andreyzemsckoff@yandex.ru
</a>
```

## After all changes
Run `./deploy.sh`
