import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/landing/marks";
import { SiteFooter } from "@/components/site-footer";
import { LEGAL, LEGAL_PAGES } from "@/lib/legal";
import { LINKS } from "@/lib/links";

export function LegalShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="landing-root min-h-screen bg-cream text-ink">
      <header className="gutter flex items-center justify-between border-b border-ink/15 bg-paper py-6">
        <Link href="/" className="w-fit text-ink [--eye:var(--paper)]">
          <Wordmark className="text-[20px]" />
        </Link>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 t-14">
          <Link
            href={LINKS.stake}
            className="text-ink/55 transition-colors hover:text-ink"
          >
            Stake
          </Link>
          {LEGAL_PAGES.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="text-ink/55 transition-colors hover:text-ink"
            >
              {p.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="gutter mx-auto max-w-[760px] py-16 md:py-24">
        <p className="tag">Legal</p>
        <h1 className="t-48 mt-6">{title}</h1>
        <p className="t-16 mt-4 max-w-[56ch] font-normal leading-[1.5] text-ink/65">
          {description}
        </p>
        <p className="mt-6 font-mono text-[12px] tracking-[0.04em] text-ink/45">
          Effective {LEGAL.effectiveDate} · Last updated {LEGAL.lastUpdated}
        </p>

        <article className="legal-prose mt-14 space-y-10 border-t border-ink/15 pt-10">
          {children}
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="t-28">{title}</h2>
      <div className="space-y-3 text-[16px] font-normal leading-[1.6] text-ink/70">
        {children}
      </div>
    </section>
  );
}
