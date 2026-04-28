import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import type { Apartment, Order } from '../types'

interface AppState {
  user: User | null
  apartment: Apartment | null
  orders: Order[]
  currentOrder: Order | null
  isLoading: boolean

  setUser: (user: User | null) => void
  setApartment: (apartment: Apartment | null) => void
  setOrders: (orders: Order[]) => void
  setCurrentOrder: (order: Order | null) => void
  updateOrderStatus: (orderId: string, updates: Partial<Order>) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  apartment: null,
  orders: [],
  currentOrder: null,
  isLoading: false,

  setUser: (user) => set({ user }),
  setApartment: (apartment) => set({ apartment }),
  setOrders: (orders) => set({ orders }),
  setCurrentOrder: (order) => set({ currentOrder: order }),
  updateOrderStatus: (orderId, updates) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, ...updates } : o,
      ),
      currentOrder:
        state.currentOrder?.id === orderId
          ? { ...state.currentOrder, ...updates }
          : state.currentOrder,
    })),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () =>
    set({
      user: null,
      apartment: null,
      orders: [],
      currentOrder: null,
      isLoading: false,
    }),
}))
