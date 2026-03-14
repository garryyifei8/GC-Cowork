import React from 'react'

export interface LoadingSpinnerProps {
  text?: string
  /** Chat injection data */
  data?: { text?: string }
}

const DOT_COLORS = ['bg-primary', 'bg-emerald-500', 'bg-amber-500']

const LoadingSpinner: React.FC<LoadingSpinnerProps> = (props) => {
  const d = props.data
  const text = d?.text ?? props.text

  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-12"
      role="status"
      aria-live="polite"
      aria-label={text ?? '加载中'}
    >
      <div className="flex items-center gap-1.5">
        {DOT_COLORS.map((color, i) => (
          <span
            key={i}
            className={`inline-block w-2 h-2 rounded-full ${color} animate-bounce`}
            style={{ animationDelay: `${i * 0.2}s` }}
            aria-hidden="true"
          />
        ))}
      </div>
      {text && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center m-0">
          {text}
        </p>
      )}
    </div>
  )
}

export default LoadingSpinner
