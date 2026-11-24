import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/links";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ghost",
    short_name: "Ghost",
    description:
      "Prepaid gas for Solana. Fund credit once, send tokens with zero SOL.",
    start_url: "/",
    scope: "/",
    id: SITE_URL,
    display: "standalone",
    lang: "en",
    background_color: "#fefbf6",
    theme_color: "#252324",
    categories: ["finance", "utilities"],
    icons: [
      {
        src: "/icon.svg",
        type: "image/svg+xml",
        sizes: "any",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        type: "image/png",
        sizes: "180x180",
        purpose: "any",
      },
    ],
  };
}
