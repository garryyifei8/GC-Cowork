import WidgetHost from '../widgets/WidgetHost';
import type { PageLayout, GridType } from '../widgets/types';

const GRID_CLASSES: Record<GridType, string> = {
  single: 'grid grid-cols-1 gap-6',
  '2-col': 'grid grid-cols-1 md:grid-cols-2 gap-6',
  '3-col': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  '4-col': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6',
  dashboard: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6',
};

interface PageRendererProps {
  layout: PageLayout;
  pageProps?: Record<string, any>;
}

export default function PageRenderer({ layout, pageProps }: PageRendererProps) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-text-primary">{layout.title}</h1>
      <div className={GRID_CLASSES[layout.grid] || GRID_CLASSES['single']}>
        {layout.slots.map((slot) => (
          <WidgetHost
            key={slot.id}
            type={slot.widgetType}
            props={{ ...slot.props, ...pageProps }}
            area={slot.area}
            className={slot.className}
          />
        ))}
      </div>
    </div>
  );
}
