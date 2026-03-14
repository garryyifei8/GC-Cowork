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
  const heightClass = size === 'sm' ? 'h-1.5' : 'h-2.5'

  const defaultColor =
    clamped >= 70 ? '#00ca72' : clamped >= 40 ? '#3b82f6' : '#e2445c'

  return (
    <div className="w-full">
      <div
        className={`w-full ${heightClass} bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden`}
      >
        <div
          className={`${heightClass} rounded-full transition-all duration-500 ease-out`}
          style={{
            width: `${clamped}%`,
            backgroundColor: color || defaultColor,
          }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 block text-right">
          {clamped}%
        </span>
      )}
    </div>
  )
}

export default ProgressBar
