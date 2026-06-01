import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { StatusBar } from '../components/layout/StatusBar'
import { supabase } from '../lib/supabase'
import { useAppStore } from '../store/useAppStore'

const PROMO_LIMIT = 3

export function PaymentPage() {
  const navigate = useNavigate()
  const { apartment } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [cooldownMessage, setCooldownMessage] = useState<string | null>(null)

  const promoUsed = apartment?.promo_orders_used ?? 0
  const isPromoAvailable = promoUsed < PROMO_LIMIT
  const promoLeft = PROMO_LIMIT - promoUsed

  const handlePay = async () => {
    if (!apartment) return
    setLoading(true)
    setCooldownMessage(null)
    try {
      const packageType = isPromoAvailable ? null : '1'

      const response = await supabase.functions.invoke('create-payment', {
        body: { apartmentId: apartment.id, packageType },
      })

      if (response.data?.error === 'cooldown' || response.data?.error === 'outside_hours') {
        setCooldownMessage(response.data.message as string)
        setLoading(false)
        return
      }

      if (response.error) {
        throw new Error(
          (response.data?.detail as string) ||
          (response.data?.error as string) ||
          response.error.message,
        )
      }
      if (!response.data?.confirmationUrl) throw new Error('No confirmation URL')

      window.location.href = response.data.confirmationUrl as string
    } catch (err) {
      console.error('[PaymentPage]', err)
      toast.error('Ошибка при создании платежа. Попробуйте снова.')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-dvh bg-[#F7FAF6]">
      <StatusBar title="Вызов уборки" onBack={() => navigate('/home')} />

      <div className="flex-1 flex flex-col px-5 py-4 gap-4">

        {isPromoAvailable ? (
          <Card className="bg-[#E6F4EA] border-[#D0EDD8]">
            <div className="flex flex-col gap-3">
              <p className="font-bold text-[#1A1F1A] text-lg">🎉 3 выноса бесплатно</p>
              <p className="text-sm text-[#1A6B38]">
                Осталось бесплатных:{' '}
                <span className="font-bold">{promoLeft} из {PROMO_LIMIT}</span>
              </p>
              <Button
                fullWidth
                size="lg"
                loading={loading}
                onClick={() => void handlePay()}
              >
                Вызвать бесплатно (1 ₽)
              </Button>
            </div>
          </Card>
        ) : (
          <Button
            fullWidth
            size="lg"
            loading={loading}
            onClick={() => void handlePay()}
          >
            Вызвать уборку — 10 ₽
          </Button>
        )}

        {cooldownMessage && (
          <div className="flex items-center gap-2 bg-[#FEF9C3] border border-[#FDE68A] rounded-2xl px-4 py-3">
            <span className="shrink-0">⏳</span>
            <p className="text-sm text-[#92400E]">{cooldownMessage}</p>
          </div>
        )}

        <div className="flex-1" />

        <div className="flex flex-col gap-1 pb-[env(safe-area-inset-bottom)]">
          <p className="text-center text-xs text-[#7F8A80]">
            Работаем с 9:00 до 19:00 по московскому времени
          </p>
          <p className="text-center text-xs text-[#7F8A80]">
            Безопасная оплата через ЮКассу
          </p>
          <p className="text-center text-xs text-[#7F8A80]">
            Нажимая «Оплатить», вы соглашаетесь с{' '}
            <a href="/legal" target="_blank" className="underline text-[#33A65A]">
              публичной офертой
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
