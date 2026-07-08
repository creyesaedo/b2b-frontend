'use client';

import { useTranslations } from 'next-intl';
import {
  ArrowRight,
  BarChart3,
  Database,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Store,
} from 'lucide-react';

// Conceptual pipeline of the platform, described in business terms only:
// no service names, hosts, ports or other infrastructure details are exposed.
const STEPS = [
  { icon: Store, key: 'sources' },
  { icon: RefreshCw, key: 'collect' },
  { icon: Sparkles, key: 'normalize' },
  { icon: Database, key: 'store' },
  { icon: ShieldCheck, key: 'access' },
  { icon: BarChart3, key: 'app' },
] as const;

export function SystemFlow() {
  const t = useTranslations('dbDocs.flow');

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
      {STEPS.map((step, i) => (
        <div
          key={step.key}
          className="flex flex-col lg:flex-1 lg:flex-row lg:items-stretch"
        >
          <div className="flex flex-1 flex-col rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                <step.icon className="h-[1.1rem] w-[1.1rem]" />
              </span>
              <span className="font-mono text-xs font-semibold text-gray-300 dark:text-gray-600">
                {String(i + 1).padStart(2, '0')}
              </span>
            </div>
            <h4 className="mt-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
              {t(`${step.key}.title`)}
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              {t(`${step.key}.desc`)}
            </p>
          </div>

          {i < STEPS.length - 1 && (
            <div
              className="flex items-center justify-center text-gray-300 dark:text-gray-600"
              aria-hidden
            >
              <ArrowRight className="my-1 h-4 w-4 rotate-90 lg:mx-1 lg:my-0 lg:rotate-0" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
