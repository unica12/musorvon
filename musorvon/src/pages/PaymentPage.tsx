import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { StatusBar } from '../components/layout/StatusBar'
import { createPayment } from '../lib/yookassa'
import { supabase } from '../lib/supabase'

const INCLUDED = [
  'Забор пакетов от вашей двери',
  'До 3 пакетов (до 15 кг)',
  'Доставка к мусоропроводу или контейнеру',
  'Уведомление о выполнении',
]

export function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Pre-load order details (non-critical)
    if (!orderId) return
    void supabase.from('orders').select('*').eq('id', orderId).single()
  }, [orderId])

  async function handlePay() {
    if (!orderId) return
    setLoading(true)
    try {
      // TODO: replace with real ЮКасса integration
      const { payment_id } = await createPayment(orderId)

      // Mark order as paid in Supabase
      const { error } = await supabase
        .from('orders')
        .update({
          payment_id,
          status: 'paid',
          payment_status: 'succeeded',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)

      if (error) throw error

      navigate(`/success?order_id=${orderId}`, { replace: true })
    } catch (err) {
      console.error(err)
      toast.error('Ошибка создания платежа. Попробуйте снова.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-dvh bg-[#F7FAF6]">
      <StatusBar
        title="Оформление заказа"
        onBack={() => navigate('/home')}
      />

      <div className="flex-1 flex flex-col px-5 py-4 gap-4">
        {/* Order summary */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E6F4EA] flex items-center justify-center">
                <span className="text-2xl">🗑️</span>
              </div>
              <div>
                <p className="font-semibold text-[#1A1F1A]">Вынос мусора</p>
                <p className="text-sm text-[#7F8A80]">Один вызов</p>
              </div>
            </div>
            <span className="text-xl font-bold text-[#1A1F1A]">100 ₽</span>
          </div>
        </Card>

        {/* What's included */}
        <Card>
          <p className="text-sm font-semibold text-[#1A1F1A] mb-3">
            Что входит:
          </p>
          <div className="flex flex-col gap-2.5">
            {INCLUDED.map((item) => (
              <div key={item} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#E6F4EA] flex items-center justify-center shrink-0 mt-0.5">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#33A65A"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-sm text-[#1A1F1A]">{item}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Timing */}
        <Card className="bg-[#E6F4EA] border-[#D0EDD8]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⏱️</span>
            <div>
              <p className="text-sm font-semibold text-[#1A6B38]">
                Время ожидания
              </p>
              <p className="text-sm text-[#1A6B38]">15–30 минут после оплаты</p>
            </div>
          </div>
        </Card>

        <div className="flex-1" />

        {/* Total & Pay button */}
        <div className="flex flex-col gap-3 pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-center justify-between px-1">
            <span className="text-base text-[#7F8A80]">Итого</span>
            <span className="text-2xl font-bold text-[#1A1F1A]">100 ₽</span>
          </div>

          <Button fullWidth size="lg" loading={loading} onClick={handlePay}>
            Оплатить 100 ₽
          </Button>

          <p className="text-center text-xs text-[#7F8A80]">
            Безопасная оплата через ЮКассу
          </p>
        </div>
      </div>
    </div>
  )
}
