import { useEffect, useState } from 'react'
import { BottomNav } from '../components/layout/BottomNav'
import { StatusBar } from '../components/layout/StatusBar'
import { OrderCard } from '../components/order/OrderCard'
import { useOrders } from '../hooks/useOrders'
import { useAppStore } from '../store/useAppStore'

function OrdersSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-3xl border border-[#E0EBE1] p-5 animate-pulse"
        >
          <div className="flex justify-between">
            <div className="flex flex-col gap-2">
              <div className="h-4 w-28 bg-[#E0EBE1] rounded-full" />
              <div className="h-3 w-20 bg-[#E0EBE1] rounded-full" />
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="h-4 w-14 bg-[#E0EBE1] rounded-full" />
              <div className="h-5 w-20 bg-[#E0EBE1] rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function HistoryPage() {
  const { orders } = useAppStore()
  const { fetchOrders, subscribeToOrder } = useOrders()
  const [ordersLoading, setOrdersLoading] = useState(true)

  useEffect(() => {
    setOrdersLoading(true)
    void fetchOrders().finally(() => setOrdersLoading(false))
  }, [fetchOrders])

  // Subscribe to realtime updates for in-progress orders
  useEffect(() => {
    const activeOrders = orders.filter(
      (o) => o.status !== 'completed' && o.status !== 'cancelled',
    )
    const unsubs = activeOrders.map((o) => subscribeToOrder(o.id))
    return () => unsubs.forEach((unsub) => unsub())
  }, [orders, subscribeToOrder])

  return (
    <div className="flex flex-col min-h-dvh bg-[#F7FAF6] pb-[calc(4rem+env(safe-area-inset-bottom))]">
      <StatusBar title="История заказов" />

      <div className="flex-1 px-5 py-4">
        {ordersLoading ? (
          <OrdersSkeleton />
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <span className="text-6xl">📋</span>
            <p className="text-[#7F8A80] text-center">
              У вас пока нет заказов.
              <br />
              Вызовите первую уборку!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
