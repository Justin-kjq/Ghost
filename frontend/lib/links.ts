/**
 * Single source of truth for marketing / footer / social URLs.
 * Import from here in footer, header, landing, and stake so links never drift.
 */

export const SITE_URL = "https://ghostlabshq.xyz";

export const LINKS = {
  home: "/",
  app: "/app",
  login: "/login",
  stake: "/stake",
  docs: "/docs",
  litepaper: "/litepaper.pdf",
  pitchDeck: "/pitch-deck/index.html",
  demoVideo: "https://youtu.be/QTJv78KeQqM",
  github: "https://github.com/arnabbhowmik07/Ghost",
  x: "https://x.com/ghostlabshq",
  telegram: "https://t.me/ghostlabshq_xyz",
  discord: "https://discord.gg/4xsr4MRhN",
  linkedin: "https://www.linkedin.com/company/ghostlabshq",
  ambassador:
    "https://docs.google.com/forms/d/e/1FAIpQLSezSFDfI8AQyycSNpzFxfAgc9BlbM8vgElNf4DTHl7OCM__dA/viewform",
  terms: "/terms",
  privacy: "/privacy",
  cookies: "/cookies",
  risk: "/risk",
} as const;

export type SiteLink = {
  label: string;
  href: string;
  external?: boolean;
};

/** Icon / chip row under the Ghost mark in the footer. */
export const SOCIAL_LINKS: SiteLink[] = [
  { label: "X", href: LINKS.x, external: true },
  { label: "Telegram", href: LINKS.telegram, external: true },
  { label: "Discord", href: LINKS.discord, external: true },
  { label: "GitHub", href: LINKS.github, external: true },
  { label: "LinkedIn", href: LINKS.linkedin, external: true },
];

export const FOOTER_COLUMNS: { title: string; links: SiteLink[] }[] = [
  {
    title: "Product",
    links: [
      { label: "App", href: LINKS.app },
      { label: "Stake", href: LINKS.stake },
      { label: "Docs", href: LINKS.docs },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Litepaper", href: LINKS.litepaper, external: true },
      { label: "Pitch deck", href: LINKS.pitchDeck, external: true },
      { label: "Demo video", href: LINKS.demoVideo, external: true },
      { label: "GitHub", href: LINKS.github, external: true },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "X", href: LINKS.x, external: true },
      { label: "Telegram", href: LINKS.telegram, external: true },
      { label: "Discord", href: LINKS.discord, external: true },
      { label: "LinkedIn", href: LINKS.linkedin, external: true },
      { label: "Ambassador program", href: LINKS.ambassador, external: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: LINKS.terms },
      { label: "Privacy", href: LINKS.privacy },
      { label: "Cookies", href: LINKS.cookies },
      { label: "Risk Disclosure", href: LINKS.risk },
    ],
  },
];

export function isExternalHref(href: string): boolean {
  return (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.endsWith(".pdf")
  );
}
