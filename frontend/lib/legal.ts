import { SITE_URL } from "@/lib/addresses";

export const LEGAL = {
  product: "Ghost",
  operator: "Ghost Privacy Suite",
  contactEmail: "legal@ghost.arnabbhowmik.in",
  siteUrl: SITE_URL,
  /** Update when counsel revises the policies. */
  effectiveDate: "November 16, 2026",
  lastUpdated: "November 16, 2026",
} as const;

export const LEGAL_PAGES = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/cookies", label: "Cookie Policy" },
  { href: "/risk", label: "Risk Disclosure" },
] as const;
