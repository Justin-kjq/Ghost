import Link from "next/link";
import { Wordmark } from "@/components/landing/marks";
import {
  FOOTER_COLUMNS,
  SITE,
  SOCIAL_LINKS,
} from "@/src/config/site";

function FooterAnchor({
  href,
  children,
  external,
  todo,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
  todo?: boolean;
}) {
  const className =
    "text-cream/70 transition-opacity hover:text-cream hover:opacity-100";

  if (todo || href === "#") {
    return (
      <span className={`${className} cursor-default`} title="Coming soon">
        {children}
      </span>
    );
  }

  if (external || href.startsWith("http")) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-cream/10 bg-coal text-cream">
      <div className="gutter py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)]">
          <div className="max-w-[320px]">
            <Link href="/" className="inline-flex text-cream [--eye:var(--coal)]">
              <Wordmark className="text-[22px]" />
            </Link>
            <p className="t-14 mt-5 font-normal leading-[1.55] text-cream/55">
              {SITE.tagline}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {SOCIAL_LINKS.map((s) => (
                <FooterAnchor
                  key={s.label}
                  href={s.href}
                  external={"external" in s ? s.external : false}
                  todo={"todo" in s ? s.todo : false}
                >
                  <span className="inline-flex h-9 min-w-9 items-center justify-center border border-cream/15 px-3 text-[13px] tracking-[-0.01em]">
                    {s.label}
                  </span>
                </FooterAnchor>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="tag text-cream/45 [&::before]:bg-sun">{col.title}</p>
                <ul className="mt-5 space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label} className="t-14 font-normal">
                      <FooterAnchor
                        href={link.href}
                        external={"external" in link ? link.external : false}
                        todo={"todo" in link ? link.todo : false}
                      >
                        {link.label}
                      </FooterAnchor>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-cream/10 pt-8 md:flex-row md:items-center md:justify-between">
          <p className="t-14 font-normal text-cream/50">
            © {SITE.copyrightYear} {SITE.brand}
          </p>
          <p className="t-14 max-w-[52ch] font-normal text-cream/40">
            Not financial advice. Staking and token features unlock at TGE.
          </p>
        </div>
      </div>
    </footer>
  );
}
