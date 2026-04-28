import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  loading?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-200 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'

  const variants = {
    primary:
      'bg-[#33A65A] text-white hover:bg-[#1A6B38] active:scale-95 focus-visible:ring-[#33A65A]',
    secondary:
      'bg-[#E6F4EA] text-[#1A6B38] hover:bg-[#D0EDD8] active:scale-95 focus-visible:ring-[#33A65A]',
    ghost:
      'bg-transparent text-[#33A65A] hover:bg-[#E6F4EA] active:scale-95 focus-visible:ring-[#33A65A]',
    danger:
      'bg-red-50 text-red-600 hover:bg-red-100 active:scale-95 focus-visible:ring-red-400',
  }

  const sizes = {
    sm: 'h-10 px-4 text-sm',
    md: 'h-12 px-6 text-base',
    lg: 'h-14 px-8 text-lg',
  }

  return (
    <button
      className={[
        base,
        variants[variant],
        sizes[size],
        fullWidth ? 'w-full' : '',
        disabled || loading ? 'opacity-50 cursor-not-allowed' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Загрузка…
        </span>
      ) : (
        children
      )}
    </button>
  )
}
