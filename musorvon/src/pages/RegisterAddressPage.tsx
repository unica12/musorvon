import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { StatusBar } from '../components/layout/StatusBar'

export interface PendingAddress {
  building: string
  entrance: string
  floor: string
  apartment_number: string
  name: string
}

export const PENDING_ADDRESS_KEY = 'musorvon_pending_address'

export function RegisterAddressPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<PendingAddress>({
    building: '',
    entrance: '',
    floor: '',
    apartment_number: '',
    name: '',
  })

  function updateForm(field: keyof PendingAddress, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function isValidField(val: string) { return /^[a-zA-Zа-яА-ЯёЁ0-9\s]{1,10}$/.test(val.trim()) }
  function isValidFloor(val: string) { const n = parseInt(val); return !isNaN(n) && n >= 1 && n <= 100 }
  function isValidApartment(val: string) { return /^[0-9]{1,6}[а-яА-ЯёЁ]?$/.test(val.trim()) }
  function isValidName(val: string) { return val.trim().length >= 1 && val.trim().length <= 50 }

  function handleNext() {
    const { building, entrance, floor, apartment_number, name } = form
    if (!isValidName(name)) { toast.error('Введите ваше имя'); return }
    if (!isValidField(building)) { toast.error('Корпус: только буквы и цифры, до 10 символов'); return }
    if (!isValidField(entrance)) { toast.error('Подъезд: только цифры, до 10 символов'); return }
    if (!isValidFloor(floor)) { toast.error('Этаж: число от 1 до 100'); return }
    if (!isValidApartment(apartment_number)) { toast.error('Квартира: от 1 до 6 цифр'); return }
    localStorage.setItem(PENDING_ADDRESS_KEY, JSON.stringify(form))
    navigate('/register/email')
  }

  return (
    <div className="flex flex-col min-h-dvh bg-[#F7FAF6]">
      <StatusBar title="Ваш адрес" onBack={() => navigate('/')} />

      <div className="flex-1 flex flex-col px-5 py-6 gap-6">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#1A1F1A]">Где вы живёте?</h2>
            <p className="text-sm text-[#7F8A80] mt-1">Укажите адрес для вызова курьера</p>
          </div>
          <Input
            label="Ваше имя"
            placeholder="Например: Иван"
            value={form.name}
            onChange={(e) => updateForm('name', e.target.value)}
          />
          <Input
            label="Корпус"
            placeholder="Например: 1А"
            value={form.building}
            onChange={(e) => updateForm('building', e.target.value)}
          />
          <Input
            label="Подъезд"
            placeholder="Например: 3"
            value={form.entrance}
            onChange={(e) => updateForm('entrance', e.target.value)}
          />
          <Input
            label="Этаж"
            placeholder="Например: 7"
            type="number"
            inputMode="numeric"
            value={form.floor}
            onChange={(e) => updateForm('floor', e.target.value)}
          />
          <Input
            label="Номер квартиры"
            placeholder="Например: 142"
            value={form.apartment_number}
            onChange={(e) => updateForm('apartment_number', e.target.value)}
          />
          <Button fullWidth size="lg" onClick={handleNext}>
            Продолжить
          </Button>
          <button
            className="w-full text-center text-sm text-[#7F8A80] py-1 hover:text-[#33A65A] transition-colors"
            onClick={() => navigate('/register/email')}
          >
            Уже есть аккаунт? Войти →
          </button>
        </div>
      </div>
    </div>
  )
}
