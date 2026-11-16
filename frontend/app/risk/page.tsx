import type { Metadata } from "next";
import Link from "next/link";
import { LegalSection, LegalShell } from "@/components/legal/legal-shell";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Risk Disclosure",
  description: `Material risks of using ${LEGAL.product}.`,
};

export default function RiskPage() {
  return (
    <LegalShell
      title="Risk Disclosure"
      description="Material risks you accept when you deposit, withdraw, or otherwise use Ghost."
    >
      <LegalSection title="1. Read this first">
        <p>
          Ghost involves cryptographic software, blockchain transactions, and experimental privacy
          design. You can lose some or all of the funds you interact with. Only use amounts you can
          afford to lose. This disclosure supplements our{" "}
          <Link href="/terms" className="underline underline-offset-2">
            Terms of Service
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. Smart contract and software risk">
        <p>
          The on-chain program, circuits, SDK, frontend, and relayer may contain bugs or
          vulnerabilities. Exploits, incorrect proofs handling, or integration mistakes can result
          in permanent loss of funds.
        </p>
        <p>Ghost has not completed a formal third-party security audit.</p>
      </LegalSection>

      <LegalSection title="3. Relayer / trust risk">
        <p>
          In the current design, proof verification is off-chain and only the designated relayer can
          call withdraw. If the relayer is malicious, compromised, or misconfigured, pool funds can
          be stolen. Do not assume Ghost is trustless.
        </p>
      </LegalSection>

      <LegalSection title="4. Ghost Note risk">
        <p>
          Your Ghost Note is the key to withdrawn funds. Anyone who obtains it can withdraw. If you
          lose it, we cannot recover it. Browser crashes, cleared storage, malware, phishing, or
          accidental disclosure can cause total loss.
        </p>
      </LegalSection>

      <LegalSection title="5. Privacy is not absolute">
        <p>
          Deposits and withdrawals leave public Solana footprints. Timing analysis, amount
          correlation (fixed denomination), RPC providers, wallet software, or operational mistakes
          (for example withdrawing to the same address that deposited) can reduce privacy.
        </p>
      </LegalSection>

      <LegalSection title="6. Network and token risk">
        <p>
          Solana outages, congestion, forks, RPC failures, or token issues (including mock or
          bridged USDC variants) can delay or prevent transactions. Asset prices and liquidity can
          change rapidly.
        </p>
      </LegalSection>

      <LegalSection title="7. Regulatory and compliance risk">
        <p>
          Privacy-preserving tools face evolving regulation. Your local laws may restrict use,
          require reporting, or treat certain activity as prohibited. You are responsible for your
          own compliance. Ghost does not provide legal or tax advice.
        </p>
      </LegalSection>

      <LegalSection title="8. No insurance or guarantees">
        <p>
          There is no deposit insurance, no guaranteed uptime, and no guarantee of privacy,
          anonymity, or successful withdrawal. Interface copy that describes “gasless” withdrawals
          means the relayer may pay Solana fees when it chooses to operate, not that withdrawals
          are free of all cost or risk.
        </p>
      </LegalSection>

      <LegalSection title="9. Acknowledgement">
        <p>
          By using Ghost you acknowledge these risks and agree that {LEGAL.operator} and its
          contributors are not liable for losses arising from them, to the fullest extent permitted
          by law.
        </p>
      </LegalSection>

      <LegalSection title="10. Contact">
        <p>
          <a className="underline underline-offset-2" href={`mailto:${LEGAL.contactEmail}`}>
            {LEGAL.contactEmail}
          </a>
        </p>
      </LegalSection>
    </LegalShell>
  );
}
