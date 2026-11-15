/** Monochrome brand marks for the “built with” strip. */

type MarkProps = { className?: string; title: string };

function SolanaMark({ className = "", title }: MarkProps) {
  // Official Solana logomark silhouette (three bars), monochrome for the sand strip.
  return (
    <svg viewBox="0 0 397.7 311.7" className={className} role="img" aria-label={title}>
      <title>{title}</title>
      <path
        fill="currentColor"
        d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7zM64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8zM333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z"
      />
    </svg>
  );
}

function AnchorMark({ className = "", title }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label={title} fill="none">
      <title>{title}</title>
      <circle cx="32" cy="14" r="7" stroke="currentColor" strokeWidth="3.2" />
      <path
        d="M32 21v28M32 49c-12 0-20-7-22-16M32 49c12 0 20-7 22-16"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path d="M18 28h28" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
      <path
        d="M10 33c2.5 1.5 5 2.5 8 2.5M54 33c-2.5 1.5-5 2.5-8 2.5"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CircomMark({ className = "", title }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label={title} fill="none">
      <title>{title}</title>
      <circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="32" cy="32" r="8" fill="currentColor" />
      <path
        d="M32 10v8M32 46v8M10 32h8M46 32h8M16.5 16.5l5.5 5.5M42 42l5.5 5.5M16.5 47.5l5.5-5.5M42 22l5.5-5.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SnarkjsMark({ className = "", title }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label={title} fill="none">
      <title>{title}</title>
      <rect x="8" y="12" width="48" height="40" rx="4" stroke="currentColor" strokeWidth="2.4" />
      <path d="M16 24h12M16 32h20M16 40h8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path
        d="M40 28l6 6-6 6M48 28l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SplTokenMark({ className = "", title }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label={title} fill="none">
      <title>{title}</title>
      <circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="2.4" />
      <path
        d="M22 28h20c0 0 0 8-10 8s-10-8-10-8z"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path d="M32 28V20M26 44h12" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="32" cy="36" r="3" fill="currentColor" />
    </svg>
  );
}

const brands = [
  {
    name: "Solana",
    href: "https://solana.com",
    Mark: SolanaMark,
    markClass: "h-[18px] w-auto md:h-[22px]",
  },
  {
    name: "Anchor",
    href: "https://www.anchor-lang.com",
    Mark: AnchorMark,
    markClass: "h-[22px] w-[22px] md:h-[26px] md:w-[26px]",
  },
  {
    name: "Circom",
    href: "https://docs.circom.io",
    Mark: CircomMark,
    markClass: "h-[22px] w-[22px] md:h-[26px] md:w-[26px]",
  },
  {
    name: "snarkjs",
    href: "https://github.com/iden3/snarkjs",
    Mark: SnarkjsMark,
    markClass: "h-[22px] w-[22px] md:h-[26px] md:w-[26px]",
  },
  {
    name: "SPL Token",
    href: "https://spl.solana.com/token",
    Mark: SplTokenMark,
    markClass: "h-[22px] w-[22px] md:h-[26px] md:w-[26px]",
  },
] as const;

export function BuiltWithLogos() {
  return (
    <ul className="flex flex-1 flex-wrap items-center justify-between gap-x-8 gap-y-5 text-ink/80">
      {brands.map(({ name, href, Mark, markClass }) => (
        <li key={name}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2.5 transition-opacity hover:opacity-100 opacity-80"
          >
            <Mark className={`${markClass} shrink-0`} title={name} />
            <span
              className={
                name === "Solana"
                  ? "text-[18px] font-semibold tracking-[0.08em] md:text-[22px]"
                  : name === "Circom"
                    ? "text-[18px] italic tracking-[-0.02em] md:text-[22px]"
                    : name === "snarkjs"
                      ? "font-mono text-[15px] font-semibold tracking-[-0.02em] md:text-[18px]"
                      : "text-[17px] font-semibold tracking-[-0.02em] md:text-[20px]"
              }
            >
              {name === "Solana" ? "SOLANA" : name}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
