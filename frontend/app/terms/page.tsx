import type { Metadata } from "next";
import Link from "next/link";
import { LegalSection, LegalShell } from "@/components/legal/legal-shell";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms that govern your use of ${LEGAL.product}.`,
};

export default function TermsPage() {
  return (
    <LegalShell
      title="Terms of Service"
      description="The rules for using Ghost’s website, app, and relayer."
    >
      <LegalSection title="1. Agreement">
        <p>
          By accessing {LEGAL.siteUrl} or using Ghost (“Service”), you agree to these Terms of
          Service and our{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            Privacy Policy
          </Link>
          ,{" "}
          <Link href="/cookies" className="underline underline-offset-2">
            Cookie Policy
          </Link>
          , and{" "}
          <Link href="/risk" className="underline underline-offset-2">
            Risk Disclosure
          </Link>
          . If you do not agree, do not use the Service.
        </p>
      </LegalSection>

      <LegalSection title="2. Eligibility">
        <p>
          You must be able to form a binding contract under applicable law and must not use Ghost
          if doing so would violate sanctions, export controls, or other laws that apply to you.
          You are solely responsible for complying with the laws of your jurisdiction.
        </p>
      </LegalSection>

      <LegalSection title="3. The Service">
        <p>
          Ghost provides software interfaces to deposit a fixed amount of USDC into an on-chain
          pool, receive a local Ghost Note, and later withdraw with a zero-knowledge proof. A
          relayer may pay Solana network fees for withdrawals according to the pool configuration.
        </p>
        <p>
          Ghost is experimental software. Features, networks, fees, and availability may change or
          stop without notice.
        </p>
      </LegalSection>

      <LegalSection title="4. Non-custodial design">
        <p>
          Ghost does not take custody of your Ghost Note. If you lose the note, clear browser
          storage without exporting it, or share it with someone else, we cannot restore access to
          those funds.
        </p>
        <p>
          Connecting a wallet does not create an account with us. You remain responsible for your
          keys, seed phrases, devices, and wallet software.
        </p>
      </LegalSection>

      <LegalSection title="5. Relayer and trust assumptions">
        <p>
          In the current Lean MVP, Groth16 proofs and Merkle inclusion are verified off-chain by the
          relayer, and only the designated relayer can call withdraw on-chain. A malicious or
          compromised relayer could steal pool funds. Do not treat Ghost as a trustless mixer.
        </p>
      </LegalSection>

      <LegalSection title="6. Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>use Ghost to violate any law, including sanctions or money-laundering rules;</li>
          <li>attempt to drain, disrupt, or abuse the relayer, RPC, or hosting infrastructure;</li>
          <li>reverse engineer the Service except where mandatory law allows;</li>
          <li>misrepresent the Service as audited, insured, or risk-free;</li>
          <li>interfere with other users’ access to the Service.</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Fees">
        <p>
          On-chain pool fees (for example basis points on withdraw) and Solana network fees may
          apply. Relayer fee sponsorship is discretionary and may be rate-limited, paused, or ended
          at any time.
        </p>
      </LegalSection>

      <LegalSection title="8. Intellectual property">
        <p>
          The Ghost name, branding, and site content are owned by {LEGAL.operator} or its licensors.
          Open-source components are governed by their respective licenses on GitHub.
        </p>
      </LegalSection>

      <LegalSection title="9. Disclaimers">
        <p>
          THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE” WITHOUT WARRANTIES OF ANY KIND, WHETHER
          EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND
          NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE,
          SECURE, OR FREE OF HARMFUL COMPONENTS.
        </p>
        <p>
          Ghost is not a bank, broker, exchange, custodian, or financial adviser. Nothing on the
          Service is an offer to buy or sell securities or any regulated financial product.
        </p>
      </LegalSection>

      <LegalSection title="10. Limitation of liability">
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, {LEGAL.operator.toUpperCase()} AND ITS
          CONTRIBUTORS ARE NOT LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY,
          OR PUNITIVE DAMAGES, OR ANY LOSS OF FUNDS, PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR
          USE OF THE SERVICE — INCLUDING RELAYER FAILURE, SMART-CONTRACT BUGS, OR LOST GHOST NOTES —
          EVEN IF ADVISED OF THE POSSIBILITY.
        </p>
        <p>
          OUR TOTAL LIABILITY FOR ANY CLAIM RELATING TO THE SERVICE IS LIMITED TO THE GREATER OF (A)
          THE FEES YOU PAID US DIRECTLY FOR THE SERVICE IN THE PRIOR THREE MONTHS, OR (B) ONE HUNDRED
          U.S. DOLLARS.
        </p>
      </LegalSection>

      <LegalSection title="11. Indemnity">
        <p>
          You will indemnify and hold harmless {LEGAL.operator} and its contributors from claims,
          damages, and expenses (including reasonable legal fees) arising from your use of the
          Service or violation of these Terms.
        </p>
      </LegalSection>

      <LegalSection title="12. Changes and termination">
        <p>
          We may modify these Terms or suspend the Service at any time. Continued use after changes
          become effective constitutes acceptance. We may terminate or restrict access for any
          reason, including suspected abuse.
        </p>
      </LegalSection>

      <LegalSection title="13. Contact">
        <p>
          <a className="underline underline-offset-2" href={`mailto:${LEGAL.contactEmail}`}>
            {LEGAL.contactEmail}
          </a>
        </p>
      </LegalSection>
    </LegalShell>
  );
}
