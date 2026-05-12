import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import type { Order } from '../types'

type Status = 'polling' | 'succeeded' | 'cancelled' | 'timeout' | 'user_cancelled'

const MAX_POLLS = 3
const POLL_INTERVAL_MS = 3000

function XIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const orderId = searchParams.get('orderId')
  const [status, setStatus] = useState<Status>('polling')
  const [order, setOrder] = useState<Order | null>(null)
  const stopped = useRef(false)

  useEffect(() => {
    if (!orderId) {
      setStatus('timeout')
      return
    }

    stopped.current = false
    const id = orderId
    let attempts = 0
    let timeoutId: ReturnType<typeof setTimeout>

    async function poll() {
      if (stopped.current) return

      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single()

      if (stopped.current) return

      if (data?.payment_status === 'succeeded') {
        setOrder(data as Order)
        setStatus('succeeded')
        setTimeout(() => navigate('/home', { replace: true }), 3000)
        return
      }

      if (data?.payment_status === 'cancelled' || data?.status === 'cancelled') {
        setStatus('cancelled')
        return
      }

      // Still pending
      attempts++
      if (attempts < MAX_POLLS) {
        timeoutId = setTimeout(() => void poll(), POLL_INTERVAL_MS)
      } else {
        setStatus('timeout')
      }
    }

    void poll()
    return () => {
      stopped.current = true
      clearTimeout(timeoutId)
    }
  }, [orderId, navigate])

  function handleUserCancel() {
    stopped.current = true
    setStatus('user_cancelled')
  }

  // ── Success ──────────────────────────────────────────────────────────────
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
            <p className="text-xs text-[#7F8A80] mt-3">Переход на главную через 3 секунды…</p>
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

  // ── Cancelled by YooKassa (webhook confirmed) ────────────────────────────
  if (status === 'cancelled') {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh bg-[#F7FAF6] px-6 gap-8">
        <div className="flex flex-col items-center gap-5">
          <div className="w-24 h-24 rounded-full bg-[#FEE2E2] flex items-center justify-center text-[#EF4444]">
            <XIcon />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#1A1F1A]">Оплата отменена</h1>
            <p className="text-sm text-[#7F8A80] mt-2">Средства не списаны.</p>
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

  // ── Timed out: 3 polls, still pending ───────────────────────────────────
  if (status === 'timeout') {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh bg-[#F7FAF6] px-6 gap-8">
        <div className="flex flex-col items-center gap-5">
          <div className="w-24 h-24 rounded-full bg-[#FEF9C3] flex items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CA8A04" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#1A1F1A]">Похоже, оплата не была завершена</h1>
            <p className="text-sm text-[#7F8A80] mt-2">Если деньги списались — обратитесь в поддержку.</p>
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

  // ── User clicked "Отменить" ──────────────────────────────────────────────
  if (status === 'user_cancelled') {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh bg-[#F7FAF6] px-6 gap-8">
        <div className="flex flex-col items-center gap-5">
          <div className="w-24 h-24 rounded-full bg-[#FEE2E2] flex items-center justify-center text-[#EF4444]">
            <XIcon />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#1A1F1A]">Заказ отменён</h1>
            <p className="text-sm text-[#7F8A80] mt-2">Средства не списаны.</p>
          </div>
        </div>
        <Button fullWidth size="lg" onClick={() => navigate('/home', { replace: true })}>
          На главную
        </Button>
      </div>
    )
  }

  // ── Polling ──────────────────────────────────────────────────────────────
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
      <Button variant="secondary" onClick={handleUserCancel}>
        Отменить
      </Button>
    </div>
  )
}
