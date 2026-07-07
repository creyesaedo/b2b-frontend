/**
 * acuanto logomark: an "A" monogram drawn as a price-trend line.
 * The stroke rises with a dip (chart zigzag), peaks at the apex of the
 * "A" and falls, with the crossbar completing the letter.
 */
export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="3,21 5.5,16.5 7.5,18.5 12,4 21,21" />
      <line x1="8.8" y1="15" x2="17.6" y2="15" />
    </svg>
  );
}
