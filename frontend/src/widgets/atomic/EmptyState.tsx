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
      className="flex flex-col items-center justify-center text-center gap-3 py-12 px-6"
      role="status"
    >
      {props.icon && (
        <div
          className="flex items-center justify-center w-18 h-18 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 mb-1"
          aria-hidden="true"
        >
          {props.icon}
        </div>
      )}
      <h3 className="font-heading text-lg font-semibold m-0 leading-snug text-gray-900 dark:text-gray-100">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 m-0 leading-relaxed max-w-sm">
          {description}
        </p>
      )}
      {props.action && (
        <button
          type="button"
          className="mt-2 inline-flex items-center justify-center px-5 py-2 bg-primary text-white border-none rounded-full text-sm font-semibold cursor-pointer transition-colors duration-150 hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          onClick={props.action.onClick}
        >
          {props.action.label}
        </button>
      )}
    </div>
  )
}

export default EmptyState
