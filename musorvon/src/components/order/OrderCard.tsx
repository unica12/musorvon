import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import type { Order } from '../../types'

interface OrderCardProps {
  order: Order
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatAmount(kopecks: number): string {
  return `${kopecks / 100} ₽`
}

export function OrderCard({ order }: OrderCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-[#1A1F1A]">
            Вынос мусора
          </p>
          <p className="text-xs text-[#7F8A80]">
            {formatDate(order.created_at)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-sm font-semibold text-[#1A1F1A]">
            {formatAmount(order.amount)}
          </span>
          <Badge status={order.status} />
        </div>
      </div>
    </Card>
  )
}
