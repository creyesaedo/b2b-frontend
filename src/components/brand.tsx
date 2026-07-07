import { LogoMark } from '@/components/logo';

/** App wordmark used in the header, sidebar and auth pages. */
export function Brand({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display font-semibold ${className}`}>
      <LogoMark className="h-6 w-6 text-blue-600" />
      <span className="lowercase tracking-tight">acuanto</span>
    </span>
  );
}
