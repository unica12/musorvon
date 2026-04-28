import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  padding?: 'sm' | 'md' | 'lg'
}

export function Card({
  children,
  className = '',
  onClick,
  padding = 'md',
}: CardProps) {
  const paddings = { sm: 'p-4', md: 'p-5', lg: 'p-6' }

  return (
    <div
      className={[
        'bg-white rounded-3xl border border-[#E0EBE1]',
        paddings[padding],
        onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
