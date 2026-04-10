import React from 'react'

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'default' | 'primary' | 'secondary' | 'indigo' | 'orange' | 'pink' | 'purple' | 'teal'

export interface StatusBadgeProps {
  status: StatusVariant
  label: string
  size?: 'sm' | 'md'
  /** Chat injection data */
  data?: { status?: StatusVariant; label?: string }
}

/* Fila badge style: bg tint + text color, no border */
const VARIANTS: Record<string, string> = {
  success:   'bg-[#2ED47E1A] text-[#2ED47E]',
  warning:   'bg-[#FFB2641A] text-[#FFB264]',
  danger:    'bg-[#E74C3C1A] text-[#E74C3C]',
  info:      'bg-[#00CAE31A] text-[#00CAE3]',
  primary:   'bg-[#00C8751A] text-[#00C875]',
  secondary: 'bg-[#796DF61A] text-[#796DF6]',
  indigo:    'bg-[#3538CD1A] text-[#3538CD]',
  orange:    'bg-[#FF7A591A] text-[#FF7A59]',
  pink:      'bg-[#DD25901A] text-[#DD2590]',
  purple:    'bg-[#9B51E01A] text-[#9B51E0]',
  teal:      'bg-[#0E93841A] text-[#0E9384]',
  default:   'bg-[#F4F6FC] text-[#919AA3]',
}

const StatusBadge: React.FC<StatusBadgeProps> = (props) => {
  const d = props.data
  const status = d?.status ?? props.status
  const label = d?.label ?? props.label
  const size = props.size ?? 'md'

  const variantClass = VARIANTS[status] ?? VARIANTS.default
  const sizeClass = size === 'sm'
    ? 'px-2.5 py-[3px] text-[15px]'
    : 'px-3 py-[3px] text-[15px]'

  return (
    <span
      className={`inline-flex items-center rounded-[3px] font-medium ${variantClass} ${sizeClass}`}
      role="status"
      aria-label={`Status: ${label}`}
    >
      {label}
    </span>
  )
}

export default StatusBadge
