import Image from 'next/image';

/** App wordmark used in the header, sidebar and auth pages. */
export function Brand({ className = '' }: { className?: string }) {
  return (
    <span
      aria-label="acuanto?"
      className={`inline-flex items-end gap-0.5 font-display text-xl font-semibold ${className}`}
    >
      {/* The navy arrow vanishes on dark backgrounds; swap in the white-arrow variant. */}
      <Image
        src="/acuanto-logo.png"
        alt=""
        width={700}
        height={700}
        priority
        className="h-[1.4em] w-auto dark:hidden"
      />
      <Image
        src="/acuanto-logo-dark.png"
        alt=""
        width={700}
        height={700}
        priority
        className="hidden h-[1.4em] w-auto dark:block"
      />
      <span aria-hidden="true" className="lowercase leading-none tracking-tight">
        cuanto
      </span>
      {/* Rounded question mark in the logo's accent blue. */}
      <svg
        aria-hidden="true"
        viewBox="5 2 14 21"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="ml-0.5 h-[1.05em] w-auto text-blue-600"
      >
        <path d="M8 8.4c0-2.9 1.6-4.65 4-4.65 2.3 0 4 1.75 4 4.25 0 3.2-4 3.4-4 6.5v.5" />
        <circle cx="12" cy="20.6" r="1.75" stroke="none" fill="currentColor" />
      </svg>
    </span>
  );
}
