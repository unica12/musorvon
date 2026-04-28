import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { BottomNav } from '../components/layout/BottomNav'
import { useAppStore } from '../store/useAppStore'
import { useOrders } from '../hooks/useOrders'

export function HomePage() {
  const navigate = useNavigate()
  const { apartment } = useAppStore()
  const { createOrder } = useOrders()
  const [loading, setLoading] = useState(false)

  async function handleCallPickup() {
    setLoading(true)
    try {
      const order = await createOrder()
      navigate(`/payment/${order.id}`)
    } catch {
      toast.error('Не удалось создать заказ. Попробуйте снова.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-dvh bg-[#F7FAF6] pb-[calc(4rem+env(safe-area-inset-bottom))]">
      {/* Header */}
      <div className="px-5 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#7F8A80]">Добро пожаловать</p>
            <h1 className="text-2xl font-bold text-[#1A1F1A]">
              Привет! 👋
            </h1>
          </div>
          <div className="flex items-center gap-2 bg-[#E6F4EA] px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-[#33A65A] animate-pulse" />
            <span className="text-xs font-medium text-[#1A6B38]">Работаем</span>
          </div>
        </div>

        {apartment && (
          <div className="mt-4 flex items-center gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#7F8A80"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="text-sm text-[#7F8A80]">
              Корп. {apartment.building}, подъезд {apartment.entrance},{' '}
              эт. {apartment.floor}, кв. {apartment.apartment_number}
            </span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="px-5 flex flex-col gap-4">
        {/* Hero Card */}
        <Card padding="lg">
          <div className="flex flex-col items-center gap-5 py-2">
            {/* Trash icon */}
            <div className="w-24 h-24 rounded-3xl bg-[#E6F4EA] flex items-center justify-center">
              <svg
                width="52"
                height="52"
                viewBox="0 0 64 64"
                fill="none"
              >
                <path
                  d="M16 20h32l-4 28H20L16 20z"
                  fill="#33A65A"
                  fillOpacity="0.9"
                />
                <path
                  d="M12 20h40M24 20v-4a4 4 0 018 0v4"
                  stroke="#1A6B38"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M26 28v12M32 28v12M38 28v12"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div className="text-center">
              <p className="text-gray-900 font-bold text-xl">Вызвать уборку</p>
              <p className="text-gray-600 text-sm mt-1">Курьер заберёт мусор за 15–30 минут</p>
              <div className="inline-flex items-center mt-2 px-3 py-1 rounded-full bg-[#E6F4EA]">
                <span className="text-sm font-semibold" style={{ color: '#1A6B38' }}>100 ₽ за вынос</span>
              </div>
            </div>

            <Button
              size="lg"
              fullWidth
              loading={loading}
              onClick={handleCallPickup}
            >
              Вызвать уборку
            </Button>
          </div>
        </Card>

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card padding="sm">
            <div className="flex flex-col gap-1.5">
              <span className="text-2xl">🚀</span>
              <p className="text-sm font-semibold text-[#1A1F1A]">Быстро</p>
              <p className="text-xs text-[#7F8A80]">15–30 минут</p>
            </div>
          </Card>
          <Card padding="sm">
            <div className="flex flex-col gap-1.5">
              <span className="text-2xl">🔒</span>
              <p className="text-sm font-semibold text-[#1A1F1A]">Безопасно</p>
              <p className="text-xs text-[#7F8A80]">Проверенные курьеры</p>
            </div>
          </Card>
          <Card padding="sm">
            <div className="flex flex-col gap-1.5">
              <span className="text-2xl">💳</span>
              <p className="text-sm font-semibold text-[#1A1F1A]">Онлайн</p>
              <p className="text-xs text-[#7F8A80]">Оплата картой</p>
            </div>
          </Card>
          <Card padding="sm">
            <div className="flex flex-col gap-1.5">
              <span className="text-2xl">📍</span>
              <p className="text-sm font-semibold text-[#1A1F1A]">Трекинг</p>
              <p className="text-xs text-[#7F8A80]">Статус в реальном времени</p>
            </div>
          </Card>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
