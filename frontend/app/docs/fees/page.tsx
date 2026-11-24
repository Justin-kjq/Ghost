import type { Metadata } from "next";
import {
  DocsH1,
  DocsH2,
  DocsLead,
  DocsList,
  DocsP,
  DocsShell,
} from "@/components/docs/docs-shell";
import { AEO } from "@/lib/aeo";

export const metadata: Metadata = {
  title: "Fees",
  description:
    "Ghost Gas fees: flat USDC debit per send, optional deposit haircut, and how SOL costs are covered.",
  alternates: { canonical: "/docs/fees" },
};

export default function FeesDocsPage() {
  return (
    <DocsShell activeHref="/docs/fees">
      <DocsH1>Fees</DocsH1>
      <DocsLead>
        You prepay in USDC. Ghost pays SOL. Each sponsored send takes a flat debit
        from the note.
      </DocsLead>

      <DocsH2>Per-send debit</DocsH2>
      <DocsP>
        Default: <strong className="font-medium text-ink">{AEO.fee}</strong>. That
        amount comes out of the gas note, not out of the SPL transfer amount.
      </DocsP>

      <DocsH2>What Ghost pays</DocsH2>
      <DocsP>
        Ghost’s relayer pays Solana compute and signature fees (and optional ATA
        rent when creating a recipient token account is required and allowed).
        Operator margin is roughly note debit minus SOL spent minus ops cost.
      </DocsP>

      <DocsH2>Deposits</DocsH2>
      <DocsList
        items={[
          "USDC deposits credit closest to face value after any protocol fee configured by the host.",
          "Non-USDC allowlisted deposits are priced via a live Jupiter quote, then a haircut may apply so credited USDC is less than the quoted out amount.",
          "Deposits are verified strictly: transfer instruction shape, treasury ATA, freshness, and replay protection.",
        ]}
      />

      <DocsH2>Limits</DocsH2>
      <DocsP>
        Hosts can set rate limits (for example max sponsored txs per hour), fee
        caps, and mint allowlists. Early pilots should keep limits tight.
      </DocsP>
    </DocsShell>
  );
}
