import { BarChart3 } from 'lucide-react';

/** App wordmark used in the header, sidebar and auth pages. */
export function Brand({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold ${className}`}>
      <BarChart3 className="h-5 w-5 text-blue-600" />
      <span>MercadoMetrics</span>
    </span>
  );
}
