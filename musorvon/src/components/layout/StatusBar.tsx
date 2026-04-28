interface StatusBarProps {
  title?: string
  onBack?: () => void
  rightAction?: React.ReactNode
}

export function StatusBar({ title, onBack, rightAction }: StatusBarProps) {
  return (
    <div className="sticky top-0 z-10 bg-[#F7FAF6] pt-[env(safe-area-inset-top)]">
      <div className="h-14 flex items-center px-4 relative">
        {onBack && (
          <button
            onClick={onBack}
            className="absolute left-4 flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#E6F4EA] active:scale-95 transition-all"
            aria-label="Назад"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1A1F1A"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
        {title && (
          <h1 className="text-base font-semibold text-[#1A1F1A] mx-auto">
            {title}
          </h1>
        )}
        {rightAction && (
          <div className="absolute right-4">{rightAction}</div>
        )}
      </div>
    </div>
  )
}
