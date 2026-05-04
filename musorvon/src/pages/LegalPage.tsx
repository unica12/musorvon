import { useNavigate } from 'react-router-dom'

export function LegalPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col min-h-dvh bg-[#F7FAF6]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 bg-white border-b border-[#E0EBE1]">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-[#F7FAF6] flex items-center justify-center"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1F1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-[#1A1F1A]">Публичная оферта и реквизиты</h1>
      </div>

      <div className="flex-1 px-5 py-6 flex flex-col gap-6 max-w-lg mx-auto w-full">

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-bold text-[#1A1F1A]">МусорВон — Публичная оферта</h2>
        </section>

        <Section title="1. ОБЩИЕ ПОЛОЖЕНИЯ">
          Настоящая публичная оферта является официальным предложением самозанятого Земскова Андрея Васильевича (ИНН: 773272369185) о заключении договора на оказание услуг по выносу мусора.
        </Section>

        <Section title="2. ПРЕДМЕТ ДОГОВОРА">
          Исполнитель оказывает услугу по выносу бытового мусора из квартиры Заказчика до мусорного контейнера на территории жилого комплекса.
        </Section>

        <Section title="3. СТОИМОСТЬ И ПОРЯДОК ОПЛАТЫ">
          Стоимость разового выноса мусора составляет 100 рублей. Оплата производится онлайн через сервис ЮКасса до начала оказания услуги.
        </Section>

        <Section title="4. УСЛОВИЯ ОКАЗАНИЯ УСЛУГИ">
          <ul className="flex flex-col gap-1.5 list-none">
            <li>4.1. Заказчик оставляет пакет с мусором за дверью квартиры.</li>
            <li>4.2. Исполнитель забирает мусор в течение 15–30 минут после подтверждения оплаты.</li>
            <li>4.3. Объём мусора — не более 70 литров (один стандартный пакет).</li>
            <li>4.4. Услуга оказывается на территории жилого комплекса по адресу: ЖК «Настоящее», г. Москва, ул. Винитская, 8.</li>
          </ul>
        </Section>

        <Section title="5. ОТВЕТСТВЕННОСТЬ">
          Исполнитель не несёт ответственности за содержимое пакета с мусором. Заказчик гарантирует, что мусор упакован надлежащим образом и не содержит опасных веществ.
        </Section>

        <Section title="6. ОТМЕНА ЗАКАЗА">
          Заказ может быть отменён до момента, когда исполнитель приступил к его выполнению. В случае отмены оплаченного заказа средства возвращаются в течение 5–10 рабочих дней.
        </Section>

        <Section title="7. ПЕРСОНАЛЬНЫЕ ДАННЫЕ">
          Персональные данные пользователей (email, адрес квартиры) используются исключительно для оказания услуги и не передаются третьим лицам.
        </Section>

        <Section title="8. РЕКВИЗИТЫ ИСПОЛНИТЕЛЯ">
          <div className="flex flex-col gap-1">
            <Row label="Самозанятый" value="Земсков Андрей Васильевич" />
            <Row label="ИНН" value="773272369185" />
            <Row label="Email" value="andreyzemsckoff@yandex.ru" />
            <Row label="Телефон" value="+7 968 450 35 11" />
          </div>
        </Section>

        <p className="text-xs text-[#7F8A80] pb-[env(safe-area-inset-bottom)]">
          Принятие условий настоящей оферты происходит в момент оформления и оплаты заказа через приложение МусорВон.
        </p>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-bold text-[#1A1F1A] uppercase tracking-wide">{title}</h3>
      <div className="text-sm text-[#3D4A3E] leading-relaxed">{children}</div>
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-[#7F8A80] shrink-0 w-28">{label}:</span>
      <span className="text-[#1A1F1A] font-medium">{value}</span>
    </div>
  )
}
