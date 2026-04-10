import React from 'react'

export interface ProgressBarProps {
  value: number
  color?: string
  showLabel?: boolean
  size?: 'sm' | 'md'
  /** Chat injection data */
  data?: { value?: number; color?: string }
}

const ProgressBar: React.FC<ProgressBarProps> = (props) => {
  const d = props.data
  const raw = d?.value ?? props.value
  const color = d?.color ?? props.color
  const showLabel = props.showLabel ?? true
  const size = props.size ?? 'sm'

  const clamped = Math.min(100, Math.max(0, raw))

  // Track height: sm=5px, md=5px (Fila flat style)
  const trackClass = 'h-[5px]'

  // Default color logic based on value threshold
  const defaultColor =
    clamped >= 70 ? '#00C875' : clamped >= 40 ? '#00CAE3' : '#E74C3C'

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-[13px] font-medium text-light-text-secondary">{clamped}%</span>
        </div>
      )}
      <div
        className={`w-full ${trackClass} bg-[#F4F6FC] rounded-none overflow-hidden`}
      >
        <div
          className={`${trackClass} rounded-none transition-all duration-500 ease-out`}
          style={{
            width: `${clamped}%`,
            backgroundColor: color || defaultColor,
          }}
        />
      </div>
    </div>
  )
}

export default ProgressBar
