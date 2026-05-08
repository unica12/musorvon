import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import type { Order } from '../types'

type Status = 'polling' | 'succeeded' | 'cancelled'

const MAX_ATTEMPTS = 10
const POLL_INTERVAL_MS = 3000

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const orderId = searchParams.get('orderId')
  const [status, setStatus] = useState<Status>('polling')
  const [order, setOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (!orderId) return
    const id = orderId

    let attempts = 0
    let timeoutId: ReturnType<typeof setTimeout>

    async function poll() {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single()

      if (data?.payment_status === 'succeeded') {
        setOrder(data as Order)
        setStatus('succeeded')
        return
      }
      if (data?.payment_status === 'cancelled' || data?.status === 'cancelled') {
        setStatus('cancelled')
        return
      }

      attempts++
      if (attempts < MAX_ATTEMPTS) {
        timeoutId = setTimeout(() => void poll(), POLL_INTERVAL_MS)
      }
    }

    void poll()
    return () => clearTimeout(timeoutId)
  }, [orderId])

  if (status === 'succeeded') {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh bg-[#F7FAF6] px-6 gap-8">
        <div className="flex flex-col items-center gap-5">
          <div className="w-24 h-24 rounded-full bg-[#E6F4EA] flex items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#33A65A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#1A1F1A]">Оплата прошла!</h1>
            <p className="text-sm text-[#7F8A80] mt-2">Курьер заберёт мусор за 15–30 минут.</p>
            <p className="text-sm text-[#7F8A80]">Оставьте пакет за дверью квартиры.</p>
          </div>
          {order && (
            <div className="w-full bg-white rounded-2xl border border-[#E0EBE1] px-5 py-4 flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#7F8A80]">Заказ</span>
                <span className="font-medium text-[#1A1F1A]">#{order.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#7F8A80]">Сумма</span>
                <span className="font-medium text-[#1A1F1A]">100 ₽</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#7F8A80]">Статус</span>
                <span className="font-semibold text-[#33A65A]">Оплачен</span>
              </div>
            </div>
          )}
        </div>
        <Button fullWidth size="lg" onClick={() => navigate('/home', { replace: true })}>
          На главную
        </Button>
      </div>
    )
  }

  if (status === 'cancelled') {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh bg-[#F7FAF6] px-6 gap-8">
        <div className="flex flex-col items-center gap-5">
          <div className="w-24 h-24 rounded-full bg-[#FEE2E2] flex items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#1A1F1A]">Оплата отменена</h1>
            <p className="text-sm text-[#7F8A80] mt-2">Средства не списаны. Попробуйте снова.</p>
          </div>
        </div>
        <div className="w-full flex flex-col gap-3">
          <Button fullWidth size="lg" onClick={() => navigate('/payment')}>
            Попробовать снова
          </Button>
          <Button fullWidth size="lg" variant="secondary" onClick={() => navigate('/home', { replace: true })}>
            На главную
          </Button>
        </div>
      </div>
    )
  }

  // polling
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-[#F7FAF6] px-6 gap-6">
      <div className="w-16 h-16 rounded-2xl bg-[#33A65A] flex items-center justify-center animate-pulse">
        <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
          <path d="M16 20h32l-4 28H20L16 20z" fill="white" fillOpacity="0.9" />
          <path d="M12 20h40M24 20v-4a4 4 0 018 0v4" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-[#1A1F1A]">Проверяем оплату...</p>
        <p className="text-sm text-[#7F8A80] mt-1">Это займёт несколько секунд</p>
      </div>
    </div>
  )
}
