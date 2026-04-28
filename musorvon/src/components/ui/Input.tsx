import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-sm font-medium text-[#1A1F1A]">{label}</label>
      )}
      <input
        className={[
          'h-12 w-full px-4 rounded-2xl border bg-white text-[#1A1F1A] placeholder:text-[#7F8A80]',
          'focus:outline-none focus:ring-2 focus:ring-[#33A65A] focus:border-transparent',
          'transition-all duration-200',
          error
            ? 'border-red-400 focus:ring-red-400'
            : 'border-[#E0EBE1] hover:border-[#33A65A]',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
