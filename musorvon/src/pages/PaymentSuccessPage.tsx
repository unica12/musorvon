import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'

type Status = 'polling' | 'succeeded' | 'cancelled' | 'timeout'

let _pollStarted = false

const MAX_POLLS = 3
const POLL_INTERVAL = 3000

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
  const pollCount = useRef(0)
  const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => { _pollStarted = false }
  }, [])

  useEffect(() => {
    if (!orderId) {
      navigate('/home')
      return
    }

    console.log('[Payment] useEffect fired, _pollStarted:', _pollStarted, 'orderId:', orderId)

    if (_pollStarted) return
    _pollStarted = true

    pollCount.current = 0

    const checkPayment = async () => {
      try {
        console.log('[Payment] Calling check-payment, orderId:', orderId, 'pollCount:', pollCount.current)
        const response = await supabase.functions.invoke('check-payment', {
          body: { orderId },
        })
        console.log('[Payment] check-payment response:', response.data, response.error)

        const data = response.data as { status?: string } | null

        if (data?.status === 'succeeded') {
          setStatus('succeeded')
          setTimeout(() => navigate('/home'), 3000)
          return
        }

        if (data?.status === 'canceled') {
          setStatus('cancelled')
          return
        }

        // pending or unknown — keep polling
        pollCount.current++
        if (pollCount.current >= MAX_POLLS) {
          setStatus('timeout')
          return
        }

        timeoutId.current = setTimeout(checkPayment, POLL_INTERVAL)
      } catch {
        setStatus('timeout')
      }
    }

    void checkPayment()

    return () => {
      if (timeoutId.current) clearTimeout(timeoutId.current)
    }
  }, [orderId, navigate])

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
            <h1 className="text-2xl font-bold text-[#1A1F1A]">Заявка принята!</h1>
            <p className="text-sm text-[#7F8A80] mt-2">Курьер заберёт мусор за 15–30 минут.</p>
            <p className="text-sm text-[#7F8A80]">Оставьте пакет за дверью квартиры.</p>
            <p className="text-xs text-[#7F8A80] mt-3">Переход на главную через 3 секунды…</p>
          </div>
        </div>
        <Button fullWidth size="lg" onClick={() => navigate('/home')}>
          На главную
        </Button>
      </div>
    )
  }

  // ── Cancelled ────────────────────────────────────────────────────────────
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
          <Button fullWidth size="lg" onClick={() => navigate('/home')}>
            На главную
          </Button>
          <Button fullWidth size="lg" variant="secondary" onClick={() => navigate('/payment')}>
            Попробовать снова
          </Button>
        </div>
      </div>
    )
  }

  // ── Timeout ──────────────────────────────────────────────────────────────
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
            <h1 className="text-2xl font-bold text-[#1A1F1A]">Оплата не завершена</h1>
            <p className="text-sm text-[#7F8A80] mt-2">Если деньги списались — обратитесь в поддержку.</p>
          </div>
        </div>
        <div className="w-full flex flex-col gap-3">
          <Button fullWidth size="lg" onClick={() => navigate('/home')}>
            На главную
          </Button>
          <Button fullWidth size="lg" variant="secondary" onClick={() => navigate('/payment')}>
            Попробовать снова
          </Button>
        </div>
      </div>
    )
  }

  // ── Polling ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-[#F7FAF6] px-6">
      <div className="w-16 h-16 rounded-2xl bg-[#33A65A] flex items-center justify-center animate-pulse">
        <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
          <path d="M16 20h32l-4 28H20L16 20z" fill="white" fillOpacity="0.9" />
          <path d="M12 20h40M24 20v-4a4 4 0 018 0v4" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="mt-4 text-base font-semibold text-[#1A1F1A]">Проверяем оплату...</p>
      <p className="mt-1 text-sm text-[#7F8A80]">Это займёт несколько секунд</p>
      <button
        onClick={() => navigate('/home')}
        className="mt-8 w-full py-4 bg-[#33A65A] text-white rounded-2xl font-bold text-lg"
      >
        На главную
      </button>
      <button
        onClick={() => navigate('/payment')}
        className="mt-3 text-sm text-gray-400 underline"
      >
        Попробовать снова
      </button>
    </div>
  )
}
