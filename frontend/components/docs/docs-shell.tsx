import type { ReactNode } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/landing/marks";
import { SiteFooter } from "@/components/site-footer";
import { LINKS } from "@/lib/links";

export const DOCS_NAV = [
  { href: "/docs", label: "Overview" },
  { href: "/docs/how-it-works", label: "How it works" },
  { href: "/docs/gas-notes", label: "Gas notes" },
  { href: "/docs/fees", label: "Fees" },
  { href: "/docs/trust", label: "Trust model" },
  { href: "/docs/api", label: "API" },
  { href: "/docs/shield", label: "Shield" },
  { href: "/docs/faq", label: "FAQ" },
] as const;

export function DocsShell({
  children,
  activeHref,
}: {
  children: ReactNode;
  activeHref: string;
}) {
  return (
    <div className="landing-root min-h-screen bg-cream text-ink">
      <header className="gutter flex items-center justify-between border-b border-ink/15 bg-paper py-6">
        <Link href="/" className="w-fit text-ink [--eye:var(--paper)]">
          <Wordmark className="text-[20px]" />
        </Link>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 t-14">
          <Link href="/" className="text-ink/55 transition-colors hover:text-ink">
            Home
          </Link>
          <Link
            href={LINKS.stake}
            className="text-ink/55 transition-colors hover:text-ink"
          >
            Stake
          </Link>
          <Link href="/docs" className="text-ink transition-colors">
            Docs
          </Link>
          <Link
            href={LINKS.login}
            className="text-ink/55 transition-colors hover:text-ink"
          >
            App
          </Link>
        </nav>
      </header>

      <div className="gutter grid gap-10 py-10 md:grid-cols-[220px_minmax(0,1fr)] md:gap-14 md:py-14">
        <aside className="md:sticky md:top-8 md:self-start">
          <p className="tag">Docs</p>
          <nav className="mt-6 flex flex-col border-t border-ink/15">
            {DOCS_NAV.map((item) => {
              const on = item.href === activeHref;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`border-b border-ink/15 py-3 t-14 transition-colors ${
                    on ? "text-ink" : "text-ink/50 hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>

      <SiteFooter />
    </div>
  );
}

export function DocsH1({ children }: { children: ReactNode }) {
  return <h1 className="t-48 max-w-[18ch]">{children}</h1>;
}

export function DocsLead({ children }: { children: ReactNode }) {
  return (
    <p className="t-20 mt-5 max-w-[46ch] font-normal leading-[1.45] text-ink/65">
      {children}
    </p>
  );
}

export function DocsH2({
  id,
  children,
}: {
  id?: string;
  children: ReactNode;
}) {
  return (
    <h2 id={id} className="t-32 mt-14 scroll-mt-24">
      {children}
    </h2>
  );
}

export function DocsP({ children }: { children: ReactNode }) {
  return (
    <p className="t-16 mt-4 max-w-[58ch] font-normal leading-[1.55] text-ink/70">
      {children}
    </p>
  );
}

export function DocsList({ items }: { items: string[] }) {
  return (
    <ul className="mt-5 max-w-[58ch] space-y-3 border-t border-ink/15 pt-5">
      {items.map((item) => (
        <li
          key={item}
          className="border-b border-ink/10 pb-3 t-16 font-normal leading-[1.5] text-ink/70"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
