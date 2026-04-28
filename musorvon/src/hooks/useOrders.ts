import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAppStore } from '../store/useAppStore'
import type { Order } from '../types'

export function useOrders() {
  const { user, orders, setOrders, setCurrentOrder, updateOrderStatus } =
    useAppStore()

  // Depend on user.id (primitive) not the full user object to avoid
  // spurious re-renders when Supabase re-issues the same user on token refresh.
  const userId = user?.id

  const fetchOrders = useCallback(async () => {
    const { user: currentUser } = useAppStore.getState()
    if (!currentUser) return

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, apartments(*)')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data as Order[])
    } catch (err) {
      console.error('[useOrders] fetchOrders error:', err)
    }
  }, [userId, setOrders]) // eslint-disable-line react-hooks/exhaustive-deps

  const createOrder = useCallback(async (): Promise<Order> => {
    const { user: currentUser, apartment: currentApartment } = useAppStore.getState()
    if (!currentUser || !currentApartment) throw new Error('Нет данных пользователя')

    const { data, error } = await supabase
      .from('orders')
      .insert({
        user_id: currentUser.id,
        apartment_id: currentApartment.id,
        status: 'pending',
        amount: 10000,
        payment_status: 'pending',
        payment_id: null,
      })
      .select()
      .single()

    if (error) throw error

    const order = data as Order
    setCurrentOrder(order)
    return order
  }, [setCurrentOrder])

  const subscribeToOrder = useCallback(
    (orderId: string) => {
      const channel = supabase
        .channel(`order-${orderId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${orderId}`,
          },
          (payload) => {
            updateOrderStatus(orderId, payload.new as Partial<Order>)
          },
        )
        .subscribe()

      return () => {
        void supabase.removeChannel(channel)
      }
    },
    [updateOrderStatus],
  )

  return { orders, fetchOrders, createOrder, subscribeToOrder }
}
