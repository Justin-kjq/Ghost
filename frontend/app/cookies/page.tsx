import type { Metadata } from "next";
import Link from "next/link";
import { LegalSection, LegalShell } from "@/components/legal/legal-shell";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: `How ${LEGAL.product} uses cookies and similar technologies.`,
};

export default function CookiesPage() {
  return (
    <LegalShell
      title="Cookie Policy"
      description="Cookies, local storage, and similar tech Ghost may use in your browser."
    >
      <LegalSection title="1. Overview">
        <p>
          This Cookie Policy explains how {LEGAL.operator} uses cookies and similar technologies on{" "}
          {LEGAL.siteUrl}. It should be read with our{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. What we use today">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="font-medium text-ink">Essential local storage.</strong> The app may
            store Ghost Notes and local activity in your browser so deposit / withdraw works across
            sessions. This is required for the product to function as designed.
          </li>
          <li>
            <strong className="font-medium text-ink">Wallet connection state.</strong> Reown AppKit /
            WalletConnect and wallet extensions may store connection preferences so you do not have
            to reconnect every visit.
          </li>
          <li>
            <strong className="font-medium text-ink">UI preferences.</strong> Minor preferences (for
            example sidebar open state) may be stored locally.
          </li>
        </ul>
        <p>
          Ghost does not currently run third-party advertising cookies. If we add analytics or
          marketing cookies later, we will update this policy and, where required, ask for consent.
        </p>
      </LegalSection>

      <LegalSection title="3. Why we use them">
        <p>
          These technologies keep you signed into a wallet session, remember notes you choose to
          keep in-browser, and make the interface usable. Without essential storage, you would need
          to re-import notes and reconnect wallets more often.
        </p>
      </LegalSection>

      <LegalSection title="4. Your controls">
        <p>
          You can clear cookies and site data in your browser settings, use private browsing, or
          disconnect your wallet. Clearing storage will delete locally saved Ghost Notes unless you
          exported them first.
        </p>
        <p>
          Browser controls vary. Refer to your browser’s help pages for instructions on managing
          cookies and site data.
        </p>
      </LegalSection>

      <LegalSection title="5. Third parties">
        <p>
          Wallet providers and WalletConnect / Reown may set their own cookies or storage when you
          use their connectors. Those technologies are governed by their policies, not ours.
        </p>
      </LegalSection>

      <LegalSection title="6. Updates">
        <p>
          We may revise this Cookie Policy as Ghost adds features. The date at the top of this page
          will reflect the latest update.
        </p>
      </LegalSection>

      <LegalSection title="7. Contact">
        <p>
          <a className="underline underline-offset-2" href={`mailto:${LEGAL.contactEmail}`}>
            {LEGAL.contactEmail}
          </a>
        </p>
      </LegalSection>
    </LegalShell>
  );
}
