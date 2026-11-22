import Link from "next/link";
import { Wordmark } from "@/components/landing/marks";
import {
  FOOTER_COLUMNS,
  SOCIAL_LINKS,
  isExternalHref,
  type SiteLink,
} from "@/lib/links";
import { SITE } from "@/src/config/site";

function FooterAnchor({
  href,
  children,
  external,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  const className =
    "text-cream/70 transition-opacity hover:text-cream hover:opacity-100";
  const openExternal = external || isExternalHref(href);

  if (openExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
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

function SocialChip({ link }: { link: SiteLink }) {
  return (
    <FooterAnchor href={link.href} external={link.external}>
      <span className="inline-flex h-9 min-w-9 items-center justify-center border border-cream/15 px-3 text-[13px] tracking-[-0.01em]">
        {link.label}
      </span>
    </FooterAnchor>
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
                <SocialChip key={s.label} link={s} />
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
                      <FooterAnchor href={link.href} external={link.external}>
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
