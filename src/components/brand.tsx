import Image from 'next/image';

/** App wordmark used in the header, sidebar and auth pages. */
export function Brand({ className = '' }: { className?: string }) {
  return (
    <span
      aria-label="acuanto?"
      className={`inline-flex items-baseline gap-0 font-display text-xl font-bold ${className}`}
    >
      {/* The navy arrow vanishes on dark backgrounds; swap in the white-arrow variant. */}
      <Image
        src="/acuanto-logo.png"
        alt=""
        width={700}
        height={700}
        priority
        className="h-[1.02em] w-auto dark:hidden"
      />
      <Image
        src="/acuanto-logo-dark.png"
        alt=""
        width={700}
        height={700}
        priority
        className="hidden h-[1.02em] w-auto dark:block"
      />
      <span aria-hidden="true" className="ml-[0.03em] lowercase leading-none tracking-tight">
        cuanto
      </span>
      {/* Question mark as a real Sora glyph so it shares the wordmark's weight, color and baseline. */}
      <span aria-hidden="true" className="ml-[0.05em] font-extrabold leading-none text-blue-600">
        ?
      </span>
    </span>
  );
}
