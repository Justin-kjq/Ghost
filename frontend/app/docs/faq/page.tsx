import type { Metadata } from "next";
import {
  DocsH1,
  DocsLead,
  DocsShell,
} from "@/components/docs/docs-shell";
import { JsonLd } from "@/components/json-ld";
import { SITE_FAQS, faqPageJsonLd } from "@/lib/aeo";
import { SITE_URL } from "@/lib/links";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about Ghost Gas: prepaid Solana gas, gas notes, fees, and Shield.",
  alternates: { canonical: "/docs/faq" },
};

export default function FaqDocsPage() {
  return (
    <DocsShell activeHref="/docs/faq">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          ...faqPageJsonLd(SITE_FAQS),
          "@id": `${SITE_URL}/docs/faq#faq`,
          url: `${SITE_URL}/docs/faq`,
        }}
      />

      <DocsH1>FAQ</DocsH1>
      <DocsLead>
        Short answers you can cite. For deeper context, use How it works, Gas
        notes, Fees, and Trust.
      </DocsLead>

      <div className="mt-10 border-t border-ink/15">
        {SITE_FAQS.map((item) => (
          <article
            key={item.q}
            id={item.q
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, "")}
            className="scroll-mt-24 border-b border-ink/15 py-7"
          >
            <h2 className="t-20">{item.q}</h2>
            <p className="t-16 mt-3 max-w-[58ch] font-normal leading-[1.55] text-ink/70">
              {item.a}
            </p>
          </article>
        ))}
      </div>
    </DocsShell>
  );
}
