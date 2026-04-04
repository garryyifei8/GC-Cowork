import React from 'react'

export interface LoadingSpinnerProps {
  text?: string
  /** Chat injection data */
  data?: { text?: string }
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = (props) => {
  const d = props.data
  const text = d?.text ?? props.text

  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-8"
      role="status"
      aria-live="polite"
      aria-label={text ?? '加载中'}
    >
      <div
        className="w-8 h-8 rounded-full border-[3px] border-[#E8E8E8] border-t-primary animate-spin"
        aria-hidden="true"
      />
      {text && (
        <p className="text-[13px] text-[#6C7688] text-center m-0">{text}</p>
      )}
    </div>
  )
}

export default LoadingSpinner
