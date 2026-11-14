import { cn } from "@/lib/utils";

function Mark({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center text-foreground/80", className)}
      title={label}
      aria-label={label}
    >
      <span className="flex h-7 w-7 items-center justify-center [&_svg]:h-7 [&_svg]:w-7">
        {children}
      </span>
    </span>
  );
}

export function BuiltWithStrip() {
  return (
    <section className="border-y border-hairline">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-8 px-5 py-10 md:flex-row md:justify-between">
        <p className="text-[12px] tracking-[0.2em] text-foreground/70 uppercase">Built with</p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-5">
          <Mark label="Solana">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M4.2 15.6c.2.2.5.4.8.4h14.7c.6 0 .9-.7.5-1.1l-2.7-2.7c-.2-.2-.5-.4-.8-.4H1.9c-.6 0-.9.7-.5 1.1l2.8 2.7Zm0-9.2c.2.2.5.4.8.4h14.7c.6 0 .9-.7.5-1.1L17.5 3c-.2-.2-.5-.4-.8-.4H1.9c-.6 0-.9.7-.5 1.1l2.8 2.7Zm15.6 4.6c-.2-.2-.5-.4-.8-.4H4.3c-.6 0-.9.7-.5 1.1l2.7 2.7c.2.2.5.4.8.4h14.8c.6 0 .9-.7.5-1.1l-2.8-2.7Z" />
            </svg>
          </Mark>
          <Mark label="Anchor">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <circle cx="12" cy="6.2" r="2.1" />
              <path d="M12 8.4v11.2M6.2 13.2H9M15 13.2h2.8" strokeLinecap="round" />
              <path d="M6.5 11.5c.4 5 2.6 8 5.5 8s5.1-3 5.5-8" />
            </svg>
          </Mark>
          <Mark label="Circom">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <rect x="3.5" y="3.5" width="6" height="6" rx="1" />
              <rect x="14.5" y="3.5" width="6" height="6" rx="1" />
              <rect x="9" y="14.5" width="6" height="6" rx="1" />
              <path d="M6.5 9.5v2.5H12M17.5 9.5v2.5H12M12 12v2.5" />
            </svg>
          </Mark>
          <Mark label="Groth16">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <circle cx="12" cy="12" r="8.2" />
              <path d="M9.2 12.8c.4 1.6 1.6 2.4 3.2 2.4 1.8 0 3-1.1 3-3.2S14.2 8.8 12.4 8.8c-1.4 0-2.5.6-3 1.8" strokeLinecap="round" />
            </svg>
          </Mark>
          <Mark label="Phantom">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M5 10.2C5 6.4 8.1 4 12 4s7 2.4 7 6.2v7.1c0 .7-.8 1.1-1.4.7l-2.1-1.4-2.1 2.2c-.3.3-.8.3-1.1 0l-2-2.2-2.2 1.4c-.6.4-1.4 0-1.4-.7V10.2Z" />
            </svg>
          </Mark>
          <Mark label="Devnet">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <circle cx="12" cy="12" r="8.2" />
              <path d="M4.5 12h15M12 3.8c2.4 2.4 3.6 5.2 3.6 8.2S14.4 17.8 12 20.2C9.6 17.8 8.4 15 8.4 12S9.6 6.2 12 3.8Z" />
            </svg>
          </Mark>
        </div>
      </div>
    </section>
  );
}
