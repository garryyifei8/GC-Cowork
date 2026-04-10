import React from 'react'

export interface EmptyStateAction {
  label: string
  onClick: () => void
}

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: EmptyStateAction
  /** Chat injection data */
  data?: { title?: string; description?: string }
}

const EmptyState: React.FC<EmptyStateProps> = (props) => {
  const d = props.data
  const title = d?.title ?? props.title
  const description = d?.description ?? props.description

  return (
    <div
      className="flex flex-col items-center justify-center text-center gap-3 py-8 px-6"
      role="status"
    >
      {props.icon && (
        <div
          className="w-16 h-16 rounded-full bg-[#F5F6FA] flex items-center justify-center text-[#6C7688] mb-1"
          aria-hidden="true"
        >
          {props.icon}
        </div>
      )}
      <h3 className="text-[15px] font-semibold text-[#333333] m-0 leading-snug">
        {title}
      </h3>
      {description && (
        <p className="text-[13px] text-[#6C7688] m-0 leading-relaxed max-w-xs text-center">
          {description}
        </p>
      )}
      {props.action && (
        <button
          type="button"
          className="mt-2 inline-flex items-center justify-center px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-[13px] font-medium cursor-pointer transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary border-0"
          onClick={props.action.onClick}
        >
          {props.action.label}
        </button>
      )}
    </div>
  )
}

export default EmptyState
