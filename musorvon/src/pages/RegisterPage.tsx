import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { StatusBar } from '../components/layout/StatusBar'
import { supabase } from '../lib/supabase'
import { useAppStore } from '../store/useAppStore'
import { PENDING_ADDRESS_KEY } from './RegisterAddressPage'
import type { PendingAddress } from './RegisterAddressPage'

type Step = 'email' | 'code'

const OPERATION_TIMEOUT_MS = 10_000

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`[${label}] timed out after ${ms}ms`)), ms),
  )
  return Promise.race([promise, timeout])
}

export function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (otp.length === 6 && !loading) void handleVerifyOtp()
  }, [otp]) // eslint-disable-line react-hooks/exhaustive-deps

  async function sendOtp() {
    const { error } = await withTimeout(
      supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      }),
      OPERATION_TIMEOUT_MS,
      'signInWithOtp',
    )
    if (error) throw error
  }

  function isValidEmail(val: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())
  }

  async function handleSendOtp() {
    if (!isValidEmail(email)) {
      toast.error('Введите корректный email')
      return
    }
    setLoading(true)
    try {
      await sendOtp()
      setResendCooldown(60)
      setStep('code')
    } catch (err) {
      console.error('[RegisterPage] handleSendOtp error:', err)
      toast.error('Не удалось отправить код. Попробуйте снова.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return
    setLoading(true)
    try {
      await sendOtp()
      setResendCooldown(60)
      toast.success('Код отправлен повторно!')
    } catch (err) {
      console.error('[RegisterPage] handleResend error:', err)
      toast.error('Не удалось отправить код. Попробуйте снова.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp() {
    if (loading) return
    setLoading(true)
    try {
      const { data, error } = await withTimeout(
        supabase.auth.verifyOtp({ email, token: otp, type: 'email' }),
        OPERATION_TIMEOUT_MS,
        'verifyOtp',
      )

      if (error) {
        const msg = error.message.toLowerCase()
        if (msg.includes('expired')) {
          toast.error('Код устарел. Запросите новый.')
        } else if (msg.includes('invalid') || msg.includes('incorrect')) {
          toast.error('Неверный код. Попробуйте ещё раз.')
        } else {
          toast.error('Ошибка. Попробуйте снова.')
        }
        setOtp('')
        return
      }

      const session = data.session
      if (!session) throw new Error('No session after verifyOtp')

      // Set user immediately so route guards pass on navigation
      useAppStore.getState().setUser(session.user)

      const pendingStr = localStorage.getItem(PENDING_ADDRESS_KEY)

      if (!pendingStr) {
        // Returning user — find their apartment
        const { data: apartment } = await supabase
          .from('apartments')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (apartment) {
          useAppStore.getState().setApartment(apartment)
          navigate('/home', { replace: true })
        } else {
          toast.error('Заполните адрес для продолжения')
          navigate('/register/address', { replace: true })
        }
        return
      }

      const pending: PendingAddress = JSON.parse(pendingStr)

      // Check for an existing apartment before inserting (guards against duplicate test rows)
      const { data: existingApartment } = await supabase
        .from('apartments')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existingApartment) {
        useAppStore.getState().setApartment(existingApartment)
        localStorage.removeItem(PENDING_ADDRESS_KEY)
        navigate('/home', { replace: true })
        return
      }

      // New user — save name to metadata and insert apartment
      if (pending.name) {
        await supabase.auth.updateUser({ data: { full_name: pending.name } })
      }

      const { data: apartmentData, error: insertError } = await supabase
        .from('apartments')
        .insert({
          user_id: session.user.id,
          building: pending.building,
          entrance: pending.entrance,
          floor: parseInt(pending.floor),
          apartment_number: pending.apartment_number,
          email: session.user.email ?? null,
        })
        .select()
        .single()

      if (insertError) throw insertError

      useAppStore.getState().setApartment(apartmentData)
      localStorage.removeItem(PENDING_ADDRESS_KEY)
      localStorage.setItem('musorvon_registered', 'true')
      navigate('/home', { replace: true })
    } catch (err) {
      console.error('[RegisterPage] handleVerifyOtp error:', err)
      toast.error('Ошибка. Попробуйте снова.')
      setOtp('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-dvh bg-[#F7FAF6]">
      <StatusBar
        title={step === 'email' ? 'Ваш email' : 'Введите код'}
        onBack={
          step === 'email'
            ? () => navigate('/register/address')
            : () => { setStep('email'); setOtp('') }
        }
      />

      <div className="flex-1 flex flex-col px-5 py-6 gap-6">
        {step === 'email' && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[#1A1F1A]">Ваш email</h2>
              <p className="text-sm text-[#7F8A80] mt-1">
                Отправим код подтверждения на вашу почту
              </p>
            </div>
            <Input
              label="Email"
              placeholder="your@email.com"
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleSendOtp() }}
            />
            <Button fullWidth size="lg" loading={loading} onClick={handleSendOtp}>
              Получить код
            </Button>
          </div>
        )}

        {step === 'code' && (
          <div className="flex flex-col gap-6 items-center text-center pt-4">
            <div className="w-20 h-20 rounded-full bg-[#E8F5EC] flex items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  stroke="#33A65A"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1A1F1A]">Код отправлен</h2>
              <p className="text-sm text-[#7F8A80] mt-2">
                на <span className="font-medium text-[#1A1F1A]">{email}</span>
              </p>
            </div>
            <div className="w-full flex flex-col gap-3">
              <Input
                label="Код из письма"
                placeholder="000000"
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
              <Button fullWidth size="lg" loading={loading} onClick={handleVerifyOtp}>
                Войти
              </Button>
            </div>
            <button
              className="text-sm py-2 disabled:text-[#B0BAB1]"
              style={{ color: resendCooldown > 0 ? undefined : '#33A65A' }}
              onClick={handleResend}
              disabled={loading || resendCooldown > 0}
            >
              {resendCooldown > 0
                ? `Отправить повторно через ${resendCooldown} с`
                : 'Отправить повторно'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
