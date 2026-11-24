import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/links";

/** Public marketing + legal URLs. App routes (/app/*) stay out — they require a wallet. */
const routes: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/docs", changeFrequency: "monthly", priority: 0.9 },
  { path: "/stake", changeFrequency: "weekly", priority: 0.8 },
  { path: "/login", changeFrequency: "monthly", priority: 0.7 },
  { path: "/pitch-deck/index.html", changeFrequency: "monthly", priority: 0.7 },
  { path: "/brand-kit/index.html", changeFrequency: "monthly", priority: 0.6 },
  { path: "/litepaper.pdf", changeFrequency: "monthly", priority: 0.6 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/cookies", changeFrequency: "yearly", priority: 0.3 },
  { path: "/risk", changeFrequency: "yearly", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return routes.map(({ path, changeFrequency, priority }) => ({
    url: new URL(path, SITE_URL).toString(),
    lastModified,
    changeFrequency,
    priority,
  }));
}
