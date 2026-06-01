import { useState } from 'react'
import { Button } from './ui/Button'

interface ConsentModalProps {
  onAccept: () => void
}

export function ConsentModal({ onAccept }: ConsentModalProps) {
  const [checked, setChecked] = useState(false)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md flex flex-col gap-4">
        <h2 className="text-lg font-bold text-[#1A1F1A]">
          Согласие на обработку персональных данных
        </h2>
        <div className="text-sm text-[#7F8A80] flex flex-col gap-2 max-h-48 overflow-y-auto">
          <p>Оператор: Земсков Андрей Васильевич, ИНН 773272369185</p>
          <p>Я даю согласие на обработку следующих персональных данных:</p>
          <ul className="list-disc pl-4 flex flex-col gap-1">
            <li>Адрес электронной почты</li>
            <li>Адрес квартиры (корпус, подъезд, этаж, номер)</li>
            <li>Имя пользователя</li>
            <li>Данные о заказах</li>
          </ul>
          <p>Цель: оказание услуги по выносу мусора.</p>
          <p>Срок хранения: до удаления аккаунта.</p>
          <p>
            Я понимаю, что вправе в любой момент отозвать согласие,
            направив запрос на andreyzemsckoff@yandex.ru
          </p>
        </div>
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="consent-check"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-1 w-5 h-5 accent-green-600 flex-shrink-0"
          />
          <label htmlFor="consent-check" className="text-sm text-[#1A1F1A]">
            Я ознакомился(-ась) с условиями и даю согласие на обработку
            моих персональных данных
          </label>
        </div>
        <Button fullWidth size="lg" disabled={!checked} onClick={onAccept}>
          Подтвердить
        </Button>
      </div>
    </div>
  )
}
