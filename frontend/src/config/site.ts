/**
 * Site-wide marketing / staking flags and links.
 * Flip STAKING_ENABLED and set DEXSCREENER_PAIR to go live — no other code changes.
 */

export const TOKEN_SYMBOL = "GHOST";

/** When false, stake UI stays in “Coming at TGE” / placeholder mode. */
export const STAKING_ENABLED = false;

/**
 * Solana pair address for the DexScreener embed.
 * Leave empty to hide the chart section.
 */
export const DEXSCREENER_PAIR = "";

export function dexscreenerEmbedUrl(pair = DEXSCREENER_PAIR): string | null {
  const trimmed = pair.trim();
  if (!trimmed) return null;
  return `https://dexscreener.com/solana/${trimmed}?embed=1&theme=dark`;
}

export const SITE = {
  name: "Ghost",
  brand: "Ghost Labs",
  tagline: "Prepaid gas and private rails for Solana.",
  url: "https://ghostlabshq.xyz",
  copyrightYear: 2026,
} as const;

/** External + internal links. `#` + TODO = not published yet. */
export const LINKS = {
  app: "/login",
  stake: "/stake",
  home: "/",
  docs: "/docs",
  /** TODO: publish litepaper */
  litepaper: "#",
  /** TODO: host demo on site docs index; YouTube is live */
  demoVideo: "https://youtu.be/2z89OodyuL4",
  /** TODO: add pitch deck URL */
  pitchDeck: "#",
  /** TODO: point at public org repo when ready */
  github: "#",
  /** TODO: publish brand kit */
  brandKit: "#",
  x: "https://x.com/ghostlabshq",
  /** TODO: add Telegram invite */
  telegram: "#",
  /** TODO: add Discord invite */
  discord: "#",
  ambassador:
    "https://docs.google.com/forms/d/e/1FAIpQLSezSFDfI8AQyycSNpzFxfAgc9BlbM8vgElNf4DTHl7OCM__dA/viewform",
  terms: "/terms",
  privacy: "/privacy",
  cookies: "/cookies",
  risk: "/risk",
} as const;

export const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "App", href: LINKS.app },
      { label: "Stake", href: LINKS.stake },
      { label: "Docs", href: LINKS.docs },
      { label: "Litepaper", href: LINKS.litepaper, todo: true },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Demo video", href: LINKS.demoVideo, external: true },
      { label: "Pitch deck", href: LINKS.pitchDeck, todo: true },
      { label: "GitHub", href: LINKS.github, todo: true },
      { label: "Brand kit", href: LINKS.brandKit, todo: true },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "X", href: LINKS.x, external: true },
      { label: "Telegram", href: LINKS.telegram, todo: true },
      { label: "Discord", href: LINKS.discord, todo: true },
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
] as const;

export const SOCIAL_LINKS = [
  { label: "X", href: LINKS.x, external: true as const },
  { label: "Telegram", href: LINKS.telegram, todo: true as const },
  { label: "Discord", href: LINKS.discord, todo: true as const },
  { label: "GitHub", href: LINKS.github, todo: true as const },
] as const;
