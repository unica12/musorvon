import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { StatusBar } from '../components/layout/StatusBar'
import { supabase } from '../lib/supabase'

type Step = 'email' | 'sent'

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
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  async function sendLink() {
    const { error } = await withTimeout(
      supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: 'https://statuesque-choux-de7f07.netlify.app/auth/callback',
          shouldCreateUser: true,
        },
      }),
      OPERATION_TIMEOUT_MS,
      'signInWithOtp',
    )
    if (error) throw error
  }

  function isValidEmail(val: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()) }

  async function handleSendLink() {
    if (!isValidEmail(email)) {
      toast.error('Введите корректный email')
      return
    }
    setLoading(true)
    try {
      await sendLink()
      setResendCooldown(60)
      setStep('sent')
    } catch (err) {
      console.error('[RegisterPage] handleSendLink error:', err)
      toast.error('Не удалось отправить письмо. Попробуйте снова.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return
    setLoading(true)
    try {
      await sendLink()
      setResendCooldown(60)
      toast.success('Письмо отправлено повторно!')
    } catch (err) {
      console.error('[RegisterPage] handleResend error:', err)
      toast.error('Не удалось отправить письмо. Попробуйте снова.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-dvh bg-[#F7FAF6]">
      <StatusBar
        title={step === 'email' ? 'Ваш email' : 'Проверьте почту'}
        onBack={step === 'email' ? () => navigate('/register/address') : () => setStep('email')}
      />

      <div className="flex-1 flex flex-col px-5 py-6 gap-6">
        {step === 'email' && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[#1A1F1A]">Ваш email</h2>
              <p className="text-sm text-[#7F8A80] mt-1">
                Отправим ссылку для входа на вашу почту
              </p>
            </div>
            <Input
              label="Email"
              placeholder="your@email.com"
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleSendLink() }}
            />
            <Button fullWidth size="lg" loading={loading} onClick={handleSendLink}>
              Получить ссылку для входа
            </Button>
          </div>
        )}

        {step === 'sent' && (
          <div className="flex flex-col gap-6 items-center text-center pt-8">
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
              <h2 className="text-2xl font-bold text-[#1A1F1A]">Письмо отправлено</h2>
              <p className="text-sm text-[#7F8A80] mt-2">
                на <span className="font-medium text-[#1A1F1A]">{email}</span>
              </p>
            </div>
            <p className="text-sm text-[#7F8A80] leading-relaxed px-4">
              Откройте письмо и нажмите на кнопку «Войти» — вас автоматически перенаправит в приложение
            </p>
            <p className="text-xs text-[#7F8A80]">Письмо придёт в течение 1 минуты</p>
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
