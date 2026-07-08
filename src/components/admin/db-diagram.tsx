'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, ChevronDown, ChevronRight, KeyRound, Link2 } from 'lucide-react';
import { ColumnDoc, RelationDoc, SchemaId, TableDoc, tableById } from '@/lib/db-docs';

const SCHEMA_BADGE: Record<SchemaId, string> = {
  mercadolibre: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  shared: 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
};

interface Edge {
  key: string;
  d: string;
  kind: 'fk' | 'soft';
  label: string;
}

/**
 * ER-style diagram: table nodes laid out in columns, FK/soft edges drawn as an
 * SVG overlay. Node positions are measured from the DOM and recomputed on
 * resize and on expand/collapse, so edges stay attached as nodes grow or the
 * grid wraps on small screens. Clicking a node expands it to its full column
 * list (name, type, nullability); the arrow button jumps to the table detail.
 */
export function DbDiagram({
  layout,
  relations,
}: {
  layout: string[][];
  relations: RelationDoc[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const compute = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const base = el.getBoundingClientRect();
    const rectOf = (id: string) => {
      const node = el.querySelector<HTMLElement>(`[data-table-node="${id}"]`);
      if (!node) return null;
      const r = node.getBoundingClientRect();
      return {
        left: r.left - base.left,
        top: r.top - base.top,
        right: r.right - base.left,
        bottom: r.bottom - base.top,
        cx: r.left - base.left + r.width / 2,
        cy: r.top - base.top + r.height / 2,
      };
    };
    setEdges(
      relations.flatMap((rel) => {
        const a = rectOf(rel.from);
        const b = rectOf(rel.to);
        if (!a || !b) return [];
        let d: string;
        if (b.left - a.right >= 16) {
          // target clearly to the right
          const midX = (a.right + b.left) / 2;
          d = `M ${a.right} ${a.cy} C ${midX} ${a.cy}, ${midX} ${b.cy}, ${b.left - 5} ${b.cy}`;
        } else if (a.left - b.right >= 16) {
          // target clearly to the left
          const midX = (a.left + b.right) / 2;
          d = `M ${a.left} ${a.cy} C ${midX} ${a.cy}, ${midX} ${b.cy}, ${b.right + 5} ${b.cy}`;
        } else if (b.top > a.bottom) {
          const midY = (a.bottom + b.top) / 2;
          d = `M ${a.cx} ${a.bottom} C ${a.cx} ${midY}, ${b.cx} ${midY}, ${b.cx} ${b.top - 5}`;
        } else {
          const midY = (a.top + b.bottom) / 2;
          d = `M ${a.cx} ${a.top} C ${a.cx} ${midY}, ${b.cx} ${midY}, ${b.cx} ${b.bottom + 5}`;
        }
        return [{ key: `${rel.from}->${rel.to}:${rel.label}`, d, kind: rel.kind, label: rel.label }];
      }),
    );
  }, [relations]);

  useEffect(() => {
    compute();
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [compute, expanded]);

  return (
    <div ref={containerRef} className="relative">
      <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <marker id="db-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" className="fill-gray-400 dark:fill-gray-500" />
          </marker>
        </defs>
        {edges.map((e) => (
          <path
            key={e.key}
            d={e.d}
            fill="none"
            markerEnd="url(#db-arrow)"
            strokeDasharray={e.kind === 'soft' ? '5 4' : undefined}
            className="stroke-gray-400 dark:stroke-gray-500"
            strokeWidth={1.5}
          >
            <title>{e.label}</title>
          </path>
        ))}
      </svg>
      <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
        {layout.map((column, i) => (
          <div key={i} className="flex flex-col gap-6">
            {column.map((id) => {
              const table = tableById(id);
              return table ? (
                <TableNode key={id} table={table} expanded={expanded.has(id)} onToggle={toggle} />
              ) : null;
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function TableNode({
  table,
  expanded,
  onToggle,
}: {
  table: TableDoc;
  expanded: boolean;
  onToggle: (id: string) => void;
}) {
  const t = useTranslations('dbDocs');
  const keyColumns = table.columns.filter((c) => c.pk || c.fk).slice(0, 5);
  const visibleColumns = expanded ? table.columns : keyColumns;
  const restCount = table.columns.length - visibleColumns.length;
  const Chevron = expanded ? ChevronDown : ChevronRight;

  return (
    <div
      data-table-node={table.id}
      role="button"
      tabIndex={0}
      onClick={() => onToggle(table.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle(table.id);
        }
      }}
      className={`relative z-10 w-full cursor-pointer rounded-lg border bg-white text-left shadow-sm transition-shadow hover:shadow-md dark:bg-gray-900 ${
        table.kind === 'operational'
          ? 'border-dashed border-gray-300 dark:border-gray-700'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      <div className="flex items-center gap-1.5 border-b border-gray-100 px-2.5 py-2 dark:border-gray-800">
        <Chevron className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        <span className="min-w-0 flex-1 truncate font-mono text-xs font-semibold text-gray-800 dark:text-gray-100">
          {table.id}
        </span>
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${SCHEMA_BADGE[table.schema]}`}>
          {table.schema}
        </span>
        <button
          type="button"
          title={t('goToDetail')}
          aria-label={t('goToDetail')}
          onClick={(e) => {
            e.stopPropagation();
            document.getElementById(`tbl-${table.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className="shrink-0 rounded p-0.5 text-gray-300 transition-colors hover:bg-gray-100 hover:text-blue-500 dark:hover:bg-gray-800"
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <ul className="px-2.5 py-2 font-mono text-[11px] leading-5 text-gray-600 dark:text-gray-300">
        {visibleColumns.map((c) => (
          <ColumnRow key={c.name} column={c} tableId={table.id} />
        ))}
        {restCount > 0 ? (
          <li className="pl-[18px] text-gray-400 dark:text-gray-500">
            {t('moreColumns', { count: restCount })}
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function ColumnRow({ column, tableId }: { column: ColumnDoc; tableId: string }) {
  return (
    <li className="flex items-center gap-1.5">
      {column.pk ? (
        <KeyRound className="h-3 w-3 shrink-0 text-amber-500" />
      ) : column.fk ? (
        <Link2 className="h-3 w-3 shrink-0 text-blue-400" />
      ) : (
        <span className="w-3 shrink-0" />
      )}
      <span className="min-w-0 truncate">
        {column.name}
        {column.fk === tableId ? <span className="text-gray-400"> ⟲</span> : null}
      </span>
      <span className="ml-auto shrink-0 pl-2 text-[10px] text-gray-400 dark:text-gray-500">
        {column.type.replace(' UNIQUE', '')}
        {column.nullable ? '?' : ''}
      </span>
    </li>
  );
}
