import { Suspense } from 'react'
import { AlertTriangle } from 'lucide-react'
import ErrorBoundary from '../components/ui/ErrorBoundary'
import { registry } from './registry'
import type { WidgetHostProps } from './types'

function WidgetFallback() {
  return (
    <div className="animate-pulse space-y-3 p-4">
      <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-20 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
    </div>
  )
}

function WidgetNotFound({ type }: { type: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-6 text-center">
      <AlertTriangle className="h-8 w-8 text-amber-500" />
      <p className="text-sm text-gray-500 dark:text-gray-400">
        未找到组件: <code className="rounded bg-gray-100 dark:bg-gray-800 px-1 py-0.5 text-xs">{type}</code>
      </p>
    </div>
  )
}

export default function WidgetHost({ type, props, data, area, showHeader = true }: WidgetHostProps) {
  const def = registry.get(type)
  if (!def) return <WidgetNotFound type={type} />

  const Component = def.component
  const mergedProps = { ...def.defaultProps, ...props, data }

  return (
    <div style={area ? { gridArea: area } : undefined}>
      {showHeader && def.title && (
        <div className="flex items-center gap-2 mb-3">
          {def.icon && <def.icon className="w-4 h-4 text-primary" />}
          <h3 className="text-sm font-semibold text-text-primary dark:text-gray-100">{def.title}</h3>
        </div>
      )}
      <ErrorBoundary>
        <Suspense fallback={<WidgetFallback />}>
          <Component {...mergedProps} />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
