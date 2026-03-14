import type { WidgetDef } from './types'

class WidgetRegistry {
  private widgets = new Map<string, WidgetDef>()

  register(def: WidgetDef): void {
    if (this.widgets.has(def.type)) {
      console.warn(`Widget "${def.type}" is already registered. Overwriting.`)
    }
    this.widgets.set(def.type, def)
  }

  get(type: string): WidgetDef | undefined {
    return this.widgets.get(type)
  }

  has(type: string): boolean {
    return this.widgets.has(type)
  }

  getAll(): WidgetDef[] {
    return Array.from(this.widgets.values())
  }

  getByLayer(layer: WidgetDef['layer']): WidgetDef[] {
    return this.getAll().filter(w => w.layer === layer)
  }
}

export const registry = new WidgetRegistry()
