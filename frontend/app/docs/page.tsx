import Link from "next/link";
import type { Metadata } from "next";
import { TurnArrow, Wordmark } from "@/components/landing/marks";
import { SiteFooter } from "@/components/site-footer";
import { LINKS } from "@/lib/links";

export const metadata: Metadata = {
  title: "Docs",
  description:
    "Why Solana gas funding leaks privacy, and how Ghost Gas fixes it with prepaid credit.",
};

const steps = [
  {
    title: "Primary wallet tops up",
    body: "Your funded wallet sends USDC to Ghost and receives a gas note. That note is prepaid credit for network fees.",
  },
  {
    title: "Alt wallet only signs",
    body: "A second wallet (often with zero SOL) attaches the note, chooses a token and recipient, and signs the transfer.",
  },
  {
    title: "Ghost pays the fee",
    body: "Ghost covers the SOL fee on-chain. Tokens move from the alt wallet to the recipient. A small fee is taken from the gas note.",
  },
];

export default function DocsPage() {
  return (
    <div className="landing-root min-h-screen bg-cream text-ink">
      <header className="gutter flex items-center justify-between border-b border-ink/15 bg-paper py-6">
        <Link href="/" className="w-fit text-ink [--eye:var(--paper)]">
          <Wordmark className="text-[20px]" />
        </Link>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 t-14">
          <Link href="/" className="text-ink/55 transition-colors hover:text-ink">
            Home
          </Link>
          <Link href={LINKS.stake} className="text-ink/55 transition-colors hover:text-ink">
            Stake
          </Link>
          <Link href="/docs" className="text-ink transition-colors">
            Docs
          </Link>
          <Link href={LINKS.app} className="text-ink/55 transition-colors hover:text-ink">
            App
          </Link>
        </nav>
      </header>

      <main>
        <header className="gutter border-b border-ink/10 bg-paper pb-16 pt-20 md:pb-20 md:pt-28">
          <h1 className="t-56 max-w-[14ch]">Ghost Gas, explained</h1>
          <p className="t-20 mt-6 max-w-[42ch] font-normal leading-[1.45] text-ink/65">
            The problem is simple. So is the fix. Prepaid credit lets an alt wallet send
            tokens without ever holding SOL.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href={LINKS.app}
              className="group inline-flex items-center gap-[10px] bg-ink px-[18px] py-[13px] text-[17px] leading-none tracking-[-0.01em] text-cream"
            >
              Open app
              <TurnArrow className="h-[14px] w-[14px] transition-transform group-hover:translate-x-[3px]" />
            </Link>
            <Link
              href="/#how"
              className="inline-flex items-center border border-ink/20 bg-transparent px-[18px] py-[13px] text-[17px] leading-none tracking-[-0.01em] text-ink"
            >
              See the flow
            </Link>
          </div>
        </header>

        <section className="gutter grid gap-10 border-b border-ink/10 py-16 md:grid-cols-2 md:gap-16 md:py-24">
          <div>
            <h2 className="t-32">The pain</h2>
            <p className="t-16 mt-4 max-w-[40ch] font-normal leading-[1.55] text-ink/65">
              On Solana, every send needs SOL for fees. That forces a funding step that
              often reveals who is behind a quiet wallet.
            </p>
          </div>
          <ul className="border-t border-ink/15">
            {[
              {
                t: "Alt wallets need SOL to move tokens",
                d: "A wallet with tokens but no SOL is stuck. It cannot pay the network fee, so it cannot send.",
              },
              {
                t: "Someone has to send SOL first",
                d: "Usually a primary wallet tops up the alt wallet with SOL. That transfer is public on-chain.",
              },
              {
                t: "The funding link is the leak",
                d: "Observers can connect the funded wallet to the spender. Privacy breaks before the real transfer even happens.",
              },
            ].map((item) => (
              <li key={item.t} className="border-b border-ink/15 py-6">
                <p className="t-20">{item.t}</p>
                <p className="t-14 mt-2 max-w-[48ch] font-normal leading-[1.5] text-ink/60">
                  {item.d}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="gutter grid gap-10 border-b border-ink/10 bg-sand py-16 md:grid-cols-2 md:gap-16 md:py-24">
          <div>
            <h2 className="t-32">The solution</h2>
            <p className="t-16 mt-4 max-w-[40ch] font-normal leading-[1.55] text-ink/65">
              Ghost Gas moves the fee off the alt wallet. The primary wallet prepays Ghost.
              The alt wallet only signs.
            </p>
          </div>
          <div className="border border-ink/15 bg-paper p-6 md:p-8">
            <p className="t-24 max-w-[28ch]">
              No SOL handoff from primary to alt. That link never has to exist.
            </p>
            <dl className="mt-10 grid gap-6 border-t border-ink/15 pt-8 sm:grid-cols-2">
              <div>
                <dt className="t-14 text-ink/50">Primary wallet</dt>
                <dd className="t-16 mt-2 font-normal leading-[1.45] text-ink/75">
                  Pays USDC once, receives a gas note (prepaid credit).
                </dd>
              </div>
              <div>
                <dt className="t-14 text-ink/50">Alt wallet</dt>
                <dd className="t-16 mt-2 font-normal leading-[1.45] text-ink/75">
                  Holds tokens, attaches the note, signs. Can have zero SOL.
                </dd>
              </div>
              <div>
                <dt className="t-14 text-ink/50">Ghost</dt>
                <dd className="t-16 mt-2 font-normal leading-[1.45] text-ink/75">
                  Pays the Solana fee and debits a flat USDC amount from the note.
                </dd>
              </div>
              <div>
                <dt className="t-14 text-ink/50">Recipient</dt>
                <dd className="t-16 mt-2 font-normal leading-[1.45] text-ink/75">
                  Gets the tokens from the alt wallet. Tokens never pass through Ghost.
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="gutter py-16 md:py-24">
          <h2 className="t-32 max-w-[18ch]">Three steps</h2>
          <ol className="mt-10 border-t border-ink/15">
            {steps.map((step, i) => (
              <li
                key={step.title}
                className="grid grid-cols-[48px_1fr] gap-4 border-b border-ink/15 py-7 md:gap-8"
              >
                <span className="font-mono text-[12px] tracking-[0.06em] text-ink/45">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="t-20">{step.title}</p>
                  <p className="t-14 mt-2 max-w-[54ch] font-normal leading-[1.5] text-ink/60">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="gutter border-y border-ink/10 bg-night py-16 text-cream md:py-20">
          <div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <h2 className="t-32 max-w-[18ch]">What Ghost is not pretending</h2>
              <ul className="mt-8 max-w-[54ch] space-y-4 t-16 font-normal leading-[1.5] text-cream/70">
                <li>
                  The gas credit ledger is operated by Ghost&apos;s relayer. You are trusting that
                  service for debit accounting.
                </li>
                <li>
                  Ghost Shield (the private pool) is separate. Gas is the everyday send product.
                </li>
                <li>
                  This is an unaudited MVP. Start small until you are comfortable with the trust
                  model.
                </li>
              </ul>
            </div>
            <Link
              href={LINKS.app}
              className="group inline-flex w-fit items-center gap-[10px] bg-sun px-[18px] py-[13px] text-[17px] leading-none tracking-[-0.01em] text-ink"
            >
              Try Credits
              <TurnArrow className="h-[14px] w-[14px] transition-transform group-hover:translate-x-[3px]" />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
