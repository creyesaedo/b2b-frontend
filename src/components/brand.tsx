import Image from 'next/image';

/** App wordmark used in the header, sidebar and auth pages. */
export function Brand({ className = '' }: { className?: string }) {
  return (
    <span
      aria-label="acuanto"
      className={`inline-flex items-end gap-0.5 font-display font-semibold ${className}`}
    >
      {/* The navy arrow vanishes on dark backgrounds; swap in the white-arrow variant. */}
      <Image
        src="/acuanto-logo.png"
        alt=""
        width={700}
        height={700}
        priority
        className="h-[1.25em] w-auto dark:hidden"
      />
      <Image
        src="/acuanto-logo-dark.png"
        alt=""
        width={700}
        height={700}
        priority
        className="hidden h-[1.25em] w-auto dark:block"
      />
      <span aria-hidden="true" className="lowercase leading-none tracking-tight">
        cuanto
      </span>
    </span>
  );
}
