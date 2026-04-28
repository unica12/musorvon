import type { OrderStatus } from '../../types'

const STATUS_MAP: Record<OrderStatus, { label: string; className: string }> = {
  pending: {
    label: 'Ожидает оплаты',
    className: 'bg-yellow-100 text-yellow-700',
  },
  paid: {
    label: 'Оплачен',
    className: 'bg-blue-100 text-blue-700',
  },
  courier_assigned: {
    label: 'Курьер назначен',
    className: 'bg-purple-100 text-purple-700',
  },
  in_progress: {
    label: 'В пути',
    className: 'bg-orange-100 text-orange-700',
  },
  completed: {
    label: 'Выполнен',
    className: 'bg-[#E6F4EA] text-[#1A6B38]',
  },
  cancelled: {
    label: 'Отменён',
    className: 'bg-gray-100 text-gray-500',
  },
}

interface BadgeProps {
  status: OrderStatus
}

export function Badge({ status }: BadgeProps) {
  const { label, className } = STATUS_MAP[status]
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  )
}
