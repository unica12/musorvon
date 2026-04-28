import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export function OnboardingPage() {
  const navigate = useNavigate()

  function handleStart() {
    navigate('/register')
  }

  return (
    <div className="flex flex-col items-center justify-between min-h-dvh px-6 py-12 bg-[#F7FAF6] pt-[calc(env(safe-area-inset-top)+3rem)]">
      <div />

      <div className="flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="w-28 h-28 rounded-3xl bg-[#33A65A] flex items-center justify-center shadow-lg shadow-green-200">
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
          >
            <path
              d="M16 20h32l-4 28H20L16 20z"
              fill="white"
              fillOpacity="0.9"
            />
            <path
              d="M12 20h40M24 20v-4a4 4 0 018 0v4"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M26 28v12M32 28v12M38 28v12"
              stroke="#33A65A"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Text */}
        <div className="text-center flex flex-col gap-3">
          <h1 className="text-4xl font-bold text-[#1A1F1A] tracking-tight">
            МусорВон
          </h1>
          <p className="text-lg text-[#7F8A80] leading-relaxed">
            Вынос мусора прямо от вашей двери.
            <br />
            Быстро. Удобно. Без хлопот.
          </p>
        </div>

        {/* Features */}
        <div className="flex flex-col gap-3 w-full">
          {[
            { icon: '⚡', text: 'Курьер приедет за 15–30 минут' },
            { icon: '💳', text: 'Онлайн-оплата — всего 100 ₽' },
            { icon: '📱', text: 'Статус заказа в реальном времени' },
          ].map((feat) => (
            <div
              key={feat.text}
              className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border border-[#E0EBE1]"
            >
              <span className="text-2xl">{feat.icon}</span>
              <span className="text-sm text-[#1A1F1A]">{feat.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full flex flex-col gap-3 pb-[env(safe-area-inset-bottom)]">
        <Button fullWidth size="lg" onClick={handleStart}>
          Начать
        </Button>
        <p className="text-center text-xs text-[#7F8A80]">
          Нажимая «Начать», вы соглашаетесь с условиями сервиса
        </p>
      </div>
    </div>
  )
}
