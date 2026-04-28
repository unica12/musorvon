export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'courier_assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export type PaymentStatus = 'pending' | 'succeeded' | 'cancelled'

export interface Apartment {
  id: string
  building: string
  entrance: string
  floor: number
  apartment_number: string
  user_id: string
  email?: string | null
  created_at: string
}

export interface Order {
  id: string
  apartment_id: string
  user_id: string
  status: OrderStatus
  amount: number
  payment_id: string | null
  payment_status: PaymentStatus
  created_at: string
  updated_at: string
  apartments?: Apartment
}

export interface PushSubscriptionRecord {
  id: string
  user_id: string
  subscription: PushSubscriptionJSON
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      apartments: {
        Row: {
          id: string
          building: string
          entrance: string
          floor: number
          apartment_number: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          building: string
          entrance: string
          floor: number
          apartment_number: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          building?: string
          entrance?: string
          floor?: number
          apartment_number?: string
          user_id?: string
          created_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          apartment_id: string
          user_id: string
          status: string
          amount: number
          payment_id: string | null
          payment_status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          apartment_id: string
          user_id: string
          status: string
          amount: number
          payment_id?: string | null
          payment_status: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          apartment_id?: string
          user_id?: string
          status?: string
          amount?: number
          payment_id?: string | null
          payment_status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          subscription: PushSubscriptionJSON
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subscription: PushSubscriptionJSON
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subscription?: PushSubscriptionJSON
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
