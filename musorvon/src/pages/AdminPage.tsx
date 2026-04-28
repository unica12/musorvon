// ВАЖНО — SQL для Supabase (выполнить в SQL Editor перед использованием):
//
// alter table apartments add column if not exists email text;
// alter table orders disable row level security;
// create index if not exists orders_status_idx on orders(status);
// create index if not exists orders_created_at_idx on orders(created_at desc);

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'

const ADMIN_PIN = '1234'
const SESSION_KEY = 'musorvon_admin_unlocked'
const REFRESH_INTERVAL_MS = 30_000
const MAX_PIN_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes
const ATTEMPTS_KEY = 'admin_pin_attempts'
const LOCKOUT_KEY = 'admin_pin_lockout'

type AdminOrder = {
  id: string
  status: string
  amount: number
  created_at: string
  user_id: string
  apartments: {
    building: string
    entrance: string
    floor: number
    apartment_number: string
    email: string | null
  } | null
}

type TabFilter = 'paid' | 'in_progress' | 'completed' | 'all'

const TABS: { key: TabFilter; label: string }[] = [
  { key: 'paid', label: 'Новые' },
  { key: 'in_progress', label: 'В работе' },
  { key: 'completed', label: 'Выполненные' },
  { key: 'all', label: 'Все' },
]

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  paid:        { label: '💳 Оплачено',  bg: '#DBEAFE', color: '#1D4ED8' },
  in_progress: { label: '🚶 В работе',  bg: '#FEF9C3', color: '#92400E' },
  completed:   { label: '✅ Выполнено', bg: '#DCFCE7', color: '#166534' },
  cancelled:   { label: '❌ Отменено',  bg: '#F3F4F6', color: '#6B7280' },
  pending:     { label: '⏳ Ожидание',  bg: '#F3F4F6', color: '#6B7280' },
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

// ─── PIN Screen ────────────────────────────────────────────────────────────────

function getLockoutRemaining(): number {
  const lockout = localStorage.getItem(LOCKOUT_KEY)
  if (!lockout) return 0
  const remaining = LOCKOUT_DURATION_MS - (Date.now() - parseInt(lockout))
  return remaining > 0 ? remaining : 0
}

function PinScreen({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState('')
  const [shake, setShake] = useState(false)
  const [lockoutMs, setLockoutMs] = useState(() => getLockoutRemaining())

  // Count down the lockout timer every second
  useEffect(() => {
    if (lockoutMs <= 0) return
    const t = setInterval(() => {
      const remaining = getLockoutRemaining()
      setLockoutMs(remaining)
      if (remaining <= 0) localStorage.removeItem(LOCKOUT_KEY)
    }, 1000)
    return () => clearInterval(t)
  }, [lockoutMs])

  function handleSubmit() {
    if (lockoutMs > 0) return

    if (pin === ADMIN_PIN) {
      localStorage.removeItem(ATTEMPTS_KEY)
      localStorage.removeItem(LOCKOUT_KEY)
      sessionStorage.setItem(SESSION_KEY, '1')
      onUnlock()
    } else {
      const attempts = parseInt(localStorage.getItem(ATTEMPTS_KEY) ?? '0') + 1
      localStorage.setItem(ATTEMPTS_KEY, String(attempts))

      if (attempts >= MAX_PIN_ATTEMPTS) {
        localStorage.setItem(LOCKOUT_KEY, String(Date.now()))
        setLockoutMs(LOCKOUT_DURATION_MS)
        toast.error('Слишком много попыток. Попробуйте через 15 минут.')
      } else {
        toast.error(`Неверный PIN (осталось попыток: ${MAX_PIN_ATTEMPTS - attempts})`)
      }

      setShake(true)
      setTimeout(() => setShake(false), 500)
      setPin('')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-dvh bg-[#F7FAF6] px-6">
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-10px)}40%{transform:translateX(10px)}60%{transform:translateX(-8px)}80%{transform:translateX(8px)}}`}</style>
      <div className="w-full max-w-[320px] flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-[#E6F4EA] flex items-center justify-center text-3xl">
          🔐
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-[#1A1F1A]">Панель оператора</h1>
          <p className="text-sm text-[#7F8A80] mt-1">МусорВон</p>
        </div>

        {lockoutMs > 0 ? (
          <div className="w-full text-center bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-sm font-semibold text-red-600">Доступ заблокирован</p>
            <p className="text-xs text-red-500 mt-1">
              Попробуйте через {Math.ceil(lockoutMs / 60_000)} мин.
            </p>
          </div>
        ) : (
        <div
          className="w-full flex flex-col gap-3"
          style={shake ? { animation: 'shake 0.5s ease-in-out' } : {}}
        >
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
            className="h-14 w-full px-4 rounded-2xl border border-[#E0EBE1] bg-white text-[#1A1F1A] text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-[#33A65A]"
            autoFocus
          />
          <button
            onClick={handleSubmit}
            disabled={pin.length < 4}
            className="h-14 w-full rounded-2xl bg-[#33A65A] text-white font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-[#1A6B38] active:scale-95"
          >
            Войти
          </button>
        </div>
        )}
      </div>
    </div>
  )
}

// ─── Order Card ────────────────────────────────────────────────────────────────

function OrderCard({
  order,
  onStatusChange,
}: {
  order: AdminOrder
  onStatusChange: (id: string, status: string) => Promise<void>
}) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  const apt = order.apartments
  const badge = STATUS_BADGE[order.status] ?? STATUS_BADGE.pending

  async function doUpdate(status: string) {
    setLoading(true)
    try {
      await onStatusChange(order.id, status)
    } finally {
      setLoading(false)
      setConfirming(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-[#E0EBE1] p-4 flex flex-col gap-3">
      {/* Address + email */}
      <div>
        {apt ? (
          <p className="text-sm font-semibold text-[#1A1F1A]">
            🏠 Корп.{apt.building} · Подъезд {apt.entrance} · Эт.{apt.floor} · Кв.{apt.apartment_number}
          </p>
        ) : (
          <p className="text-sm text-[#7F8A80]">Адрес не указан</p>
        )}
        {apt?.email && (
          <p className="text-xs text-[#7F8A80] mt-0.5">{apt.email}</p>
        )}
      </div>

      {/* Time + amount + status */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-[#7F8A80]">{formatDate(order.created_at)} · {formatTime(order.created_at)}</span>
        <span className="text-xs font-medium text-[#1A1F1A]">{order.amount} ₽</span>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ background: badge.bg, color: badge.color }}
        >
          {badge.label}
        </span>
      </div>

      {/* Actions */}
      {order.status === 'paid' && !confirming && (
        <button
          onClick={() => doUpdate('in_progress')}
          disabled={loading}
          className="h-10 w-full rounded-xl bg-[#FEF9C3] text-[#92400E] text-sm font-semibold hover:bg-yellow-200 transition-colors disabled:opacity-50"
        >
          {loading ? 'Обновляем...' : '🚶 Взять в работу'}
        </button>
      )}

      {order.status === 'in_progress' && !confirming && (
        <button
          onClick={() => setConfirming(true)}
          disabled={loading}
          className="h-10 w-full rounded-xl bg-[#DCFCE7] text-[#166534] text-sm font-semibold hover:bg-green-200 transition-colors disabled:opacity-50"
        >
          ✓ Отметить выполненным
        </button>
      )}

      {confirming && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-center text-[#1A1F1A] font-medium">
            Отметить заявку как выполненную?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirming(false)}
              className="flex-1 h-10 rounded-xl border border-[#E0EBE1] text-sm text-[#7F8A80] hover:bg-gray-50"
            >
              Нет
            </button>
            <button
              onClick={() => doUpdate('completed')}
              disabled={loading}
              className="flex-1 h-10 rounded-xl bg-[#33A65A] text-white text-sm font-semibold hover:bg-[#1A6B38] disabled:opacity-50"
            >
              {loading ? '...' : 'Да, выполнено'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Admin Dashboard ────────────────────────────────────────────────────────────

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [activeTab, setActiveTab] = useState<TabFilter>('paid')
  const [realtimeLive, setRealtimeLive] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)

  const fetchOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`*, apartments (building, entrance, floor, apartment_number, email)`)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders((data as AdminOrder[]) ?? [])
    } catch (err) {
      console.error('[AdminPage] fetchOrders error:', err)
      toast.error('Ошибка загрузки заявок')
    } finally {
      setFetchLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchOrders()

    const interval = setInterval(() => { void fetchOrders() }, REFRESH_INTERVAL_MS)

    // fetchOrders is stable (useCallback with no deps that change), safe to close over
    const channel = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        void fetchOrders()
      })
      .subscribe((status) => {
        setRealtimeLive(status === 'SUBSCRIBED')
      })

    return () => {
      clearInterval(interval)
      void supabase.removeChannel(channel)
    }
  }, [fetchOrders])

  async function handleStatusChange(orderId: string, status: string) {
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)

    if (error) {
      toast.error('Ошибка обновления статуса')
      throw error
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
    )
    toast.success('Статус обновлён')
  }

  const filtered = activeTab === 'all'
    ? orders
    : orders.filter((o) => o.status === activeTab)

  const newCount = orders.filter((o) => o.status === 'paid').length

  return (
    <div className="flex flex-col min-h-dvh bg-[#F7FAF6]">
      {/* Header */}
      <div className="bg-white border-b border-[#E0EBE1] px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[#1A1F1A]">Заявки</h1>
              {newCount > 0 && (
                <span className="text-xs font-semibold bg-[#33A65A] text-white px-1.5 py-0.5 rounded-full">
                  {newCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${realtimeLive ? 'bg-[#33A65A]' : 'bg-gray-400'}`}
              />
              <span className="text-xs text-[#7F8A80]">
                {realtimeLive ? 'Live' : 'Соединение...'} · МусорВон
              </span>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="text-sm text-[#7F8A80] hover:text-red-500 transition-colors py-1 px-2"
          >
            Выйти
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-0.5 scrollbar-hide">
          {TABS.map((tab) => {
            const count = tab.key === 'all' ? orders.length : orders.filter((o) => o.status === tab.key).length
            const active = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-shrink-0 h-8 px-3 rounded-full text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-[#33A65A] text-white'
                    : 'bg-[#E6F4EA] text-[#1A6B38] hover:bg-[#D0EDD8]'
                }`}
              >
                {tab.label} {count > 0 && `(${count})`}
              </button>
            )
          })}
        </div>
      </div>

      {/* Orders list */}
      <div className="flex-1 px-4 py-4 flex flex-col gap-3 max-w-[390px] mx-auto w-full">
        {fetchLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#33A65A] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <span className="text-4xl">🎉</span>
            <p className="font-semibold text-[#1A1F1A]">Нет заявок</p>
            <p className="text-sm text-[#7F8A80]">Новые заявки появятся здесь автоматически</p>
          </div>
        ) : (
          filtered.map((order) => (
            <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
          ))
        )}
      </div>
    </div>
  )
}

// ─── Root ───────────────────────────────────────────────────────────────────────

export function AdminPage() {
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === '1',
  )

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY)
    setUnlocked(false)
  }

  if (!unlocked) {
    return <PinScreen onUnlock={() => setUnlocked(true)} />
  }

  return <AdminDashboard onLogout={handleLogout} />
}
