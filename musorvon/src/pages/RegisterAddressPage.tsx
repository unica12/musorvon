import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const [consentGiven, setConsentGiven] = useState(false)
  const [consentError, setConsentError] = useState(false)
  const [form, setForm] = useState<PendingAddress>({
    building: '',
    entrance: '',
    floor: '',
    apartment_number: '',
    name: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof PendingAddress, string>>>({})

  function updateForm(field: keyof PendingAddress, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof PendingAddress, string>> = {}

    if (!form.name.trim()) newErrors.name = 'Введите ваше имя'

    const building = parseInt(form.building)
    if (isNaN(building) || building < 1 || building > 4)
      newErrors.building = 'Выберите корпус от 1 до 4'

    const entrance = parseInt(form.entrance)
    if (isNaN(entrance) || entrance < 1 || entrance > 10)
      newErrors.entrance = 'Подъезд от 1 до 10'

    const floor = parseInt(form.floor)
    if (isNaN(floor) || floor < 1 || floor > 28)
      newErrors.floor = 'Этаж от 1 до 28'

    if (!form.apartment_number.trim())
      newErrors.apartment_number = 'Введите номер квартиры'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleNext() {
    if (!validate()) return
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

          {/* 1. Имя */}
          <Input
            label="Ваше имя"
            placeholder="Например: Иван"
            value={form.name}
            error={errors.name}
            onChange={(e) => updateForm('name', e.target.value)}
          />

          {/* 2. Корпус */}
          <Input
            label="Корпус"
            placeholder="Например: 2"
            type="number"
            inputMode="numeric"
            min={1}
            max={4}
            value={form.building}
            error={errors.building}
            onChange={(e) => updateForm('building', e.target.value)}
          />

          {/* 3. Подъезд */}
          <Input
            label="Подъезд"
            placeholder="Например: 3"
            type="number"
            inputMode="numeric"
            min={1}
            max={10}
            value={form.entrance}
            error={errors.entrance}
            onChange={(e) => updateForm('entrance', e.target.value)}
          />

          {/* 4. Этаж */}
          <Input
            label="Этаж"
            placeholder="Например: 7"
            type="number"
            inputMode="numeric"
            min={1}
            max={28}
            value={form.floor}
            error={errors.floor}
            onChange={(e) => updateForm('floor', e.target.value)}
          />

          {/* 5. Номер квартиры */}
          <Input
            label="Номер квартиры"
            placeholder="Например: 142"
            value={form.apartment_number}
            error={errors.apartment_number}
            onChange={(e) => updateForm('apartment_number', e.target.value)}
          />

          {/* 6. Чекбокс согласия */}
          <button
            type="button"
            onClick={() => { setConsentGiven((v) => !v); setConsentError(false) }}
            className="flex items-start gap-3 text-left w-full"
          >
            <span
              className={[
                'mt-0.5 w-6 h-6 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-colors',
                consentGiven
                  ? 'bg-[#33A65A] border-[#33A65A]'
                  : 'bg-white border-[#B0C4B4]',
              ].join(' ')}
            >
              {consentGiven && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M2.5 7L5.5 10L11.5 4"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            <span className="text-sm text-gray-500 leading-relaxed">
              Я соглашаюсь с{' '}
              <a
                href="/privacy"
                target="_blank"
                className="text-green-600 underline"
                onClick={(e) => e.stopPropagation()}
              >
                Политикой конфиденциальности
              </a>
              {' '}и{' '}
              <a
                href="/legal"
                target="_blank"
                className="text-green-600 underline"
                onClick={(e) => e.stopPropagation()}
              >
                Публичной офертой
              </a>
              , и даю согласие на обработку персональных данных
            </span>
          </button>
          {consentError && (
            <p className="text-xs text-red-500 mt-1">Необходимо принять условия для продолжения</p>
          )}

          {/* 7. Кнопка — div-обёртка ловит тап когда кнопка disabled */}
          <div onClick={() => { if (!consentGiven) setConsentError(true) }}>
            <Button
              fullWidth
              size="lg"
              disabled={!consentGiven}
              onClick={handleNext}
            >
              Продолжить
            </Button>
          </div>

          {/* 8. Войти */}
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
