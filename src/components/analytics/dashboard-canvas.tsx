'use client';

import { useMemo, useState } from 'react';
import {
  ResponsiveGridLayout,
  useContainerWidth,
  type Layout,
  type LayoutItem,
} from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import type { WidgetLayout, WidgetSpec } from '@/lib/engine/types';

// Mirrors the engine's grid model (12 columns; row unit ≈ 5.5rem as before).
const ROW_HEIGHT = 88;
const MARGIN: [number, number] = [16, 16];

export type LayoutOverrides = Record<string, WidgetLayout>;

/**
 * Draggable/resizable dashboard canvas (react-grid-layout v2). Widgets drag
 * from anywhere on their frame (`.widget-drag-handle`, minus `.widget-no-drag`
 * scroll areas) and resize by the SE corner handle. On phones (<768px)
 * everything stacks in one column and editing is off.
 *
 * `overrides` are the user's rearrangements on top of the template layout;
 * `onOverridesChange` receives ONLY the widgets that differ from the template
 * (empty object = pristine), so the caller can persist/reset cheaply.
 */
export function DashboardCanvas({
  widgets,
  overrides,
  onOverridesChange,
  renderWidget,
}: {
  widgets: WidgetSpec[];
  overrides: LayoutOverrides;
  onOverridesChange: (next: LayoutOverrides) => void;
  renderWidget: (widget: WidgetSpec) => React.ReactNode;
}) {
  const { width, containerRef, mounted } = useContainerWidth();
  const [editable, setEditable] = useState(true);

  const layouts = useMemo(() => {
    const lg: LayoutItem[] = widgets.map((w) => {
      const o = overrides[w.id] ?? w.layout;
      return { i: w.id, x: o.x, y: o.y, w: o.w, h: o.h, minW: 2, minH: 2 };
    });
    // Single column, template reading order (top-left first).
    const ordered = [...widgets].sort(
      (a, b) => a.layout.y - b.layout.y || a.layout.x - b.layout.x,
    );
    let y = 0;
    const xs: LayoutItem[] = ordered.map((w) => {
      const item: LayoutItem = { i: w.id, x: 0, y, w: 1, h: w.layout.h, static: true };
      y += w.layout.h;
      return item;
    });
    return { lg, xs };
  }, [widgets, overrides]);

  const handleChange = (layout: Layout) => {
    if (!editable) return;
    const next: LayoutOverrides = {};
    for (const item of layout) {
      const spec = widgets.find((w) => w.id === item.i);
      if (!spec) continue;
      const moved =
        item.x !== spec.layout.x ||
        item.y !== spec.layout.y ||
        item.w !== spec.layout.w ||
        item.h !== spec.layout.h;
      if (moved) next[item.i] = { x: item.x, y: item.y, w: item.w, h: item.h };
    }
    onOverridesChange(next);
  };

  return (
    // The hook targets React 19 ref types; React 18's div ref doesn't accept
    // the `| null` generic, hence the cast.
    <div ref={containerRef as React.RefObject<HTMLDivElement>}>
      {mounted && (
        <ResponsiveGridLayout
          width={width}
          layouts={layouts}
          breakpoints={{ lg: 768, xs: 0 }}
          cols={{ lg: 12, xs: 1 }}
          rowHeight={ROW_HEIGHT}
          margin={MARGIN}
          containerPadding={[0, 0]}
          dragConfig={{
            enabled: editable,
            handle: '.widget-drag-handle',
            // Scrollable widget bodies opt out: dragging their scrollbar must
            // scroll, not move the widget.
            cancel: '.widget-no-drag',
          }}
          resizeConfig={{ enabled: editable }}
          onBreakpointChange={(bp) => setEditable(bp === 'lg')}
          onLayoutChange={handleChange}
        >
          {widgets.map((widget) => (
            <div key={widget.id} className="min-h-0">
              {renderWidget(widget)}
            </div>
          ))}
        </ResponsiveGridLayout>
      )}
    </div>
  );
}
