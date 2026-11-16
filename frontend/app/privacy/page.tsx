import type { Metadata } from "next";
import { LegalSection, LegalShell } from "@/components/legal/legal-shell";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${LEGAL.product} collects, uses, and shares information.`,
};

export default function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy Policy"
      description="What Ghost learns about you — and what stays only on your device."
    >
      <LegalSection title="1. Who we are">
        <p>
          {LEGAL.operator} (“Ghost”, “we”, “us”) operates the Ghost website and application at{" "}
          {LEGAL.siteUrl}. This policy explains how we handle information when you visit the site
          or use the app.
        </p>
        <p>
          Questions:{" "}
          <a className="underline underline-offset-2" href={`mailto:${LEGAL.contactEmail}`}>
            {LEGAL.contactEmail}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. What Ghost is designed not to collect">
        <p>
          Ghost Notes (the secrets that unlock a deposit) are generated and stored in your browser.
          We do not ask you to upload a Ghost Note to our servers. You should never send a Ghost
          Note to us, the relayer, or any third party unless you intend for them to control those
          funds.
        </p>
        <p>
          We do not require an account, email, phone number, or government ID to connect a wallet
          and use the core deposit / withdraw flow.
        </p>
      </LegalSection>

      <LegalSection title="3. Information we may process">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="font-medium text-ink">Wallet activity.</strong> When you connect a
            wallet, your public address and transaction signatures are visible on Solana like any
            other on-chain activity.
          </li>
          <li>
            <strong className="font-medium text-ink">Relayer requests.</strong> Withdrawals are
            submitted through our relayer. The relayer receives the zero-knowledge proof and public
            signals needed to submit the transaction (for example Merkle root, nullifier hash, and
            recipient). It does not need your Ghost Note.
          </li>
          <li>
            <strong className="font-medium text-ink">Wallet connection providers.</strong> Connecting
            via Reown AppKit / WalletConnect may involve those providers processing connection
            metadata according to their own policies.
          </li>
          <li>
            <strong className="font-medium text-ink">Technical logs.</strong> Our hosts may record
            standard server logs (IP address, user agent, timestamps, request paths) for security,
            reliability, and abuse prevention.
          </li>
          <li>
            <strong className="font-medium text-ink">Local storage.</strong> The app may store notes
            and activity history in your browser’s local storage. Clearing site data removes them.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. How we use information">
        <p>We use the limited information above to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>operate and improve the Ghost website, app, and relayer;</li>
          <li>submit withdrawals you request and prevent abuse of the fee-payer;</li>
          <li>secure the service and investigate incidents;</li>
          <li>comply with law when we are legally required to do so.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Sharing">
        <p>
          On-chain data is public by design. Off-chain, we do not sell personal information. We may
          share limited technical data with infrastructure providers (hosting, RPC, WalletConnect /
          Reown) who process it to provide their services, and with advisors or authorities when
          required by law.
        </p>
      </LegalSection>

      <LegalSection title="6. Retention">
        <p>
          Server logs are kept only as long as needed for operations and security. On-chain records
          persist indefinitely on Solana. Browser-stored notes remain until you export, delete, or
          clear them.
        </p>
      </LegalSection>

      <LegalSection title="7. Your choices">
        <p>
          You can disconnect your wallet, clear local storage, stop using the service, or contact us
          at {LEGAL.contactEmail}. Because Ghost Notes never leave your device by default, we cannot
          recover a lost note for you.
        </p>
      </LegalSection>

      <LegalSection title="8. International users">
        <p>
          Ghost may be hosted or accessed from multiple regions. If you use the service from outside
          the operator’s jurisdiction, you understand that information may be processed in other
          countries with different data-protection rules.
        </p>
      </LegalSection>

      <LegalSection title="9. Changes">
        <p>
          We may update this policy as Ghost moves toward a production product. The “Last updated”
          date at the top will change when we do. Continued use after an update means you accept the
          revised policy.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
