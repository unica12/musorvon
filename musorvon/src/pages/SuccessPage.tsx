import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { useAppStore } from '../store/useAppStore'
import { useOrders } from '../hooks/useOrders'
import { usePush } from '../hooks/usePush'
import { supabase } from '../lib/supabase'
import type { Order } from '../types'

export function SuccessPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('order_id')

  const { currentOrder } = useAppStore()
  const { subscribeToOrder } = useOrders()
  const { requestPushPermission } = usePush()

  const [order, setOrder] = useState<Order | null>(currentOrder)
  const [showCheck, setShowCheck] = useState(false)

  useEffect(() => {
    // Animate checkmark on mount
    const t = setTimeout(() => setShowCheck(true), 300)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    // Request push after successful order
    void requestPushPermission()
  }, [requestPushPermission])

  useEffect(() => {
    if (!orderId) return

    // Load order if not in store
    if (!order || order.id !== orderId) {
      supabase
        .from('orders')
        .select('*, apartments(*)')
        .eq('id', orderId)
        .single()
        .then(({ data }) => {
          if (data) setOrder(data as Order)
        })
    }

    // Subscribe to realtime updates
    const unsub = subscribeToOrder(orderId)
    return unsub
  }, [orderId, subscribeToOrder, order])

  // Sync order state from store
  useEffect(() => {
    if (currentOrder && orderId && currentOrder.id === orderId) {
      setOrder(currentOrder)
    }
  }, [currentOrder, orderId])

  return (
    <div className="flex flex-col min-h-dvh bg-[#F7FAF6] px-5 py-8 pt-[calc(env(safe-area-inset-top)+2rem)]">
      <div className="flex flex-col items-center gap-6">
        {/* Animated Checkmark */}
        <div
          className={`w-28 h-28 rounded-full bg-[#33A65A] flex items-center justify-center transition-all duration-500 ${
            showCheck ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
          } shadow-xl shadow-green-200`}
        >
          <svg
            width="56"
            height="56"
            viewBox="0 0 56 56"
            fill="none"
            className={`transition-all duration-700 delay-300 ${
              showCheck ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <path
              d="M12 28l12 12 20-20"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-[dash_0.5s_ease-in-out_0.5s_forwards]"
            />
          </svg>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#1A1F1A]">Заявка принята!</h1>
          <p className="text-[#7F8A80] mt-2">
            Курьер уже едет к вам
          </p>
        </div>

        {/* Timer card */}
        <Card className="w-full bg-[#E6F4EA] border-[#D0EDD8]">
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl">⏱️</span>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#1A6B38]">15–30 минут</p>
              <p className="text-sm text-[#33A65A]">ожидаемое время прибытия</p>
            </div>
          </div>
        </Card>

        {/* Order details */}
        {order && (
          <Card className="w-full">
            <p className="text-sm font-semibold text-[#1A1F1A] mb-3">
              Детали заказа
            </p>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#7F8A80]">Номер заказа</span>
                <span className="text-sm font-mono text-[#1A1F1A]">
                  #{order.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#7F8A80]">Стоимость</span>
                <span className="text-sm font-semibold text-[#1A1F1A]">
                  {order.amount / 100} ₽
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#7F8A80]">Статус</span>
                <Badge status={order.status} />
              </div>
            </div>
          </Card>
        )}
      </div>

      <div className="flex-1" />

      <Button
        fullWidth
        size="lg"
        onClick={() => navigate('/home', { replace: true })}
        className="mb-[env(safe-area-inset-bottom)]"
      >
        На главную
      </Button>
    </div>
  )
}
