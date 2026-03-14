import type { LucideIcon } from 'lucide-react'
import type { ComponentType, LazyExoticComponent } from 'react'

export type WidgetLayer = 'atomic' | 'business' | 'view'

export interface WidgetDef<P = any> {
  type: string
  layer: WidgetLayer
  component: LazyExoticComponent<ComponentType<P>> | ComponentType<P>
  defaultProps?: Partial<P>
  defaultSize?: { cols: number; rows: number }
  title?: string
  icon?: LucideIcon
}

export interface WidgetSlot {
  id: string
  widgetType: string
  props?: Record<string, any>
  area?: string
}

export type GridType = 'single' | '2-col' | '3-col' | '4-col' | 'dashboard'

export interface PageLayout {
  title: string
  grid: GridType
  slots: WidgetSlot[]
}

export interface WidgetHostProps {
  type: string
  props?: Record<string, any>
  data?: any
  area?: string
  showHeader?: boolean
}
