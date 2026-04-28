import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { StatusBar } from '../components/layout/StatusBar'
import { BottomNav } from '../components/layout/BottomNav'
import { useAppStore } from '../store/useAppStore'
import { supabase } from '../lib/supabase'

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, apartment, setApartment } = useAppStore()

  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    building: apartment?.building ?? '',
    entrance: apartment?.entrance ?? '',
    floor: String(apartment?.floor ?? ''),
    apartment_number: apartment?.apartment_number ?? '',
  })

  // Fetch apartment if not in store (e.g. after page refresh on profile)
  useEffect(() => {
    if (apartment || !user) return
    supabase
      .from('apartments')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) { console.error('[ProfilePage] fetch apartment error:', error); return }
        if (data) {
          setApartment(data)
          setForm({
            building: data.building,
            entrance: data.entrance,
            floor: String(data.floor),
            apartment_number: data.apartment_number,
          })
        }
      })
  }, [user, apartment, setApartment])

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!apartment) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('apartments')
        .update({
          building: form.building,
          entrance: form.entrance,
          floor: parseInt(form.floor),
          apartment_number: form.apartment_number,
        })
        .eq('id', apartment.id)
        .select()
        .single()

      if (error) throw error
      setApartment(data)
      setEditing(false)
      toast.success('Адрес обновлён')
    } catch {
      toast.error('Не удалось сохранить изменения')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    useAppStore.getState().reset()
    localStorage.removeItem('musorvon_registered')
    localStorage.removeItem('musorvon_pending_address')
    navigate('/register/address', { replace: true })
  }

  const displayIdentity = user?.email ?? user?.phone?.replace(/(\+7)(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5') ?? ''

  return (
    <div className="flex flex-col min-h-dvh bg-[#F7FAF6] pb-[calc(4rem+env(safe-area-inset-bottom))]">
      <StatusBar title="Профиль" />

      <div className="flex-1 px-5 py-4 flex flex-col gap-4">
        {/* Avatar + Phone */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#E6F4EA] flex items-center justify-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#33A65A"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-[#1A1F1A]">{displayIdentity}</p>
            <p className="text-sm text-[#7F8A80]">Жилец комплекса</p>
          </div>
        </div>

        {/* Address Card */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-[#1A1F1A]">Адрес</p>
            {!editing && (
              <button
                className="text-sm text-[#33A65A] font-medium"
                onClick={() => setEditing(true)}
              >
                Изменить
              </button>
            )}
          </div>

          {editing ? (
            <div className="flex flex-col gap-3">
              <Input
                label="Корпус"
                value={form.building}
                onChange={(e) => updateForm('building', e.target.value)}
              />
              <Input
                label="Подъезд"
                value={form.entrance}
                onChange={(e) => updateForm('entrance', e.target.value)}
              />
              <Input
                label="Этаж"
                type="number"
                inputMode="numeric"
                value={form.floor}
                onChange={(e) => updateForm('floor', e.target.value)}
              />
              <Input
                label="Номер квартиры"
                value={form.apartment_number}
                onChange={(e) => updateForm('apartment_number', e.target.value)}
              />
              <div className="flex gap-2 pt-1">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setEditing(false)}
                >
                  Отмена
                </Button>
                <Button fullWidth loading={loading} onClick={handleSave}>
                  Сохранить
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {apartment ? (
                <>
                  <Row label="Корпус" value={apartment.building} />
                  <Row label="Подъезд" value={apartment.entrance} />
                  <Row label="Этаж" value={String(apartment.floor)} />
                  <Row label="Квартира" value={apartment.apartment_number} />
                </>
              ) : (
                <p className="text-sm text-[#7F8A80]">Адрес не указан</p>
              )}
            </div>
          )}
        </Card>

        <div className="flex-1" />

        {/* Sign Out */}
        <Button variant="danger" fullWidth onClick={handleSignOut}>
          Выйти из аккаунта
        </Button>
      </div>

      <BottomNav />
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-sm text-[#7F8A80]">{label}</span>
      <span className="text-sm font-medium text-[#1A1F1A]">{value}</span>
    </div>
  )
}
