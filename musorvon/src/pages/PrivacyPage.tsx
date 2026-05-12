import { useNavigate } from 'react-router-dom'

export function PrivacyPage() {
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
        <h1 className="text-base font-semibold text-[#1A1F1A]">Политика конфиденциальности</h1>
      </div>

      <div className="flex-1 px-5 py-6 flex flex-col gap-6 max-w-lg mx-auto w-full">

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-bold text-[#1A1F1A]">МусорВон — Политика конфиденциальности</h2>
          <p className="text-sm text-[#7F8A80]">Последнее обновление: май 2025 г.</p>
        </section>

        <Section title="1. ОПЕРАТОР ПЕРСОНАЛЬНЫХ ДАННЫХ">
          <div className="flex flex-col gap-1">
            <Row label="ФИО" value="Земсков Андрей Васильевич" />
            <Row label="ИНН" value="773272369185" />
            <Row label="Email" value="andreyzemsckoff@yandex.ru" />
            <Row label="Телефон" value="+7 968 450 35 11" />
          </div>
        </Section>

        <Section title="2. КАКИЕ ДАННЫЕ МЫ СОБИРАЕМ">
          <ul className="flex flex-col gap-1.5 list-none">
            <li>— Адрес электронной почты (email) для авторизации и уведомлений</li>
            <li>— Адрес квартиры: корпус, подъезд, этаж, номер квартиры — для оказания услуги</li>
            <li>— Имя пользователя — для персонализации обращения</li>
            <li>— Данные о заказах: дата, статус, сумма оплаты</li>
          </ul>
        </Section>

        <Section title="3. ЦЕЛЬ ОБРАБОТКИ">
          Персональные данные обрабатываются исключительно для оказания услуги по выносу мусора: идентификации пользователя, определения адреса доставки, обработки оплаты и уведомления о статусе заказа.
        </Section>

        <Section title="4. ПРАВОВОЕ ОСНОВАНИЕ">
          Обработка персональных данных осуществляется на основании согласия пользователя (ст. 6 Федерального закона №152-ФЗ «О персональных данных»).
        </Section>

        <Section title="5. СРОК ХРАНЕНИЯ">
          Персональные данные хранятся до момента удаления аккаунта пользователем. После удаления данные уничтожаются в течение 30 дней.
        </Section>

        <Section title="6. ПЕРЕДАЧА ТРЕТЬИМ ЛИЦАМ">
          <ul className="flex flex-col gap-1.5 list-none">
            <li>— <strong>Supabase Inc. (США)</strong> — платформа для хранения данных и авторизации. Серверы расположены в ЕС/США.</li>
            <li>— <strong>ООО «ЮКасса»</strong> — процессинг платежей. Передаются только данные, необходимые для проведения транзакции.</li>
          </ul>
          Иным третьим лицам данные не передаются.
        </Section>

        <Section title="7. ТРАНСГРАНИЧНАЯ ПЕРЕДАЧА">
          Данные передаются на серверы Supabase Inc., расположенные в США и ЕС. Передача осуществляется в соответствии с требованиями гл. 5 152-ФЗ.
        </Section>

        <Section title="8. COOKIES">
          Приложение использует cookies для авторизации и корректной работы сессий. Cookies не используются для рекламных целей. Вы можете запретить использование cookies в настройках браузера, однако это может повлиять на работу приложения.
        </Section>

        <Section title="9. ПРАВА ПОЛЬЗОВАТЕЛЯ">
          <ul className="flex flex-col gap-1.5 list-none">
            <li>— Получить копию своих персональных данных</li>
            <li>— Потребовать исправления или удаления данных</li>
            <li>— Отозвать согласие на обработку данных</li>
          </ul>
          Для реализации прав направьте запрос на: <strong>andreyzemsckoff@yandex.ru</strong>
        </Section>

        <Section title="10. КОНТАКТЫ">
          <div className="flex flex-col gap-1">
            <Row label="Email" value="andreyzemsckoff@yandex.ru" />
            <Row label="Телефон" value="+7 968 450 35 11" />
          </div>
        </Section>

        <p className="text-xs text-[#7F8A80] pb-[env(safe-area-inset-bottom)]">
          Продолжая использовать приложение МусорВон, вы подтверждаете согласие с настоящей Политикой конфиденциальности.
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
