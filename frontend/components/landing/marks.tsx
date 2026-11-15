// Small shared marks: the GHOST wordmark, the turn arrow, a reveal wrapper.

/** GHOST wordmark: the ghost glyph plus the name set in Instrument Sans,
 *  the same typeface as the rest of the site. Size it with font-size. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-[0.32em] font-semibold uppercase leading-none tracking-[0.02em] ${className}`}>
      <svg viewBox="0 0 19 20" className="h-[0.95em] w-auto shrink-0" fill="currentColor" aria-hidden="true">
        <path d="M2 9a7.5 7.5 0 0115 0v10.5l-2.5-2.2-2.5 2.2-2.5-2.2-2.5 2.2L4.5 17.3 2 19.5z" />
        <rect x="6" y="7.5" width="2.4" height="4" rx="1.2" fill="var(--eye, #000)" />
        <rect x="10.6" y="7.5" width="2.4" height="4" rx="1.2" fill="var(--eye, #000)" />
      </svg>
      Ghost
    </span>
  );
}

/** The "↳" turn arrow used on every call to action. */
export function TurnArrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" aria-hidden="true">
      <path d="M3 1.5v6.5a2.5 2.5 0 002.5 2.5H14M10.5 7l3.5 3.5-3.5 3.5" />
    </svg>
  );
}
