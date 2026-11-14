import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LandingFaq } from "@/components/landing-faq";
import { BuiltWithStrip } from "@/components/tool-marks";
import { VerifySection } from "@/components/verify-section";
import { ProductMock } from "@/components/product-mock";
import { StatDash } from "@/components/stat-dash";
import { fetchPoolLiveStats } from "@/lib/pool-stats";

export const dynamic = "force-dynamic";

const steps = [
  {
    n: "01",
    title: "Deposit into the pool",
    body: "Send exactly 1 USDC. Ghost writes a Poseidon commitment and a sequential leaf on-chain. You receive a secret note — the only key to those funds.",
  },
  {
    n: "02",
    title: "Prove locally",
    body: "The browser builds a Groth16 proof of Merkle inclusion. The recipient is bound as a public signal. The note never leaves your machine.",
  },
  {
    n: "03",
    title: "Relayer pays the gas",
    body: "Ghost’s relayer verifies the proof off-chain and submits withdraw. A fresh address with 0 SOL still receives 0.997 USDC.",
  },
];

function formatAgo(iso: string | null) {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const min = Math.round(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 48) return `${hr} hr ago`;
  return new Date(iso).toLocaleDateString();
}

export default async function LandingPage() {
  const stats = await fetchPoolLiveStats();

  return (
    <div className="relative">
      <SiteHeader />

      <section className="relative isolate min-h-[min(92vh,880px)] overflow-hidden">
        <div className="hero-geometry pointer-events-none absolute inset-0" />
        <div className="hero-art-mask pointer-events-none absolute inset-x-0 top-0 h-[46vh] min-h-[280px] sm:h-[52vh] lg:inset-y-0 lg:left-auto lg:h-auto lg:w-[58%]">
          <Image
            src="/art/hero-veiled.webp"
            alt="Veiled marble statue in a sunlit colonnade"
            fill
            priority
            className="object-cover object-[center_12%] lg:object-[center_18%]"
            sizes="(min-width: 1024px) 58vw, 100vw"
          />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[min(92vh,880px)] w-full max-w-[1600px] flex-col justify-end px-5 pb-12 pt-[48vh] sm:px-8 sm:pt-[54vh] lg:justify-center lg:px-16 lg:py-24 lg:pt-24 xl:pl-24">
          <div className="max-w-[42rem] lg:max-w-[54rem]">
            <p className="fade-up inline-flex w-fit items-center rounded-full border border-hairline bg-background/70 px-3 py-1 text-[11px] tracking-[0.16em] text-foreground/80 uppercase">
              Devnet beta · test funds only
            </p>
            <h1 className="hero-title fade-up fade-up-delay-1 mt-6 font-serif">
              <span className="lg:whitespace-nowrap">Privacy is not a feature.</span>
              <br />
              It&apos;s a <em className="italic text-muted-foreground">right.</em>
            </h1>
            <p className="prose-muted fade-up fade-up-delay-2 mt-6">
              Shielded deposits into a shared USDC pool. Withdraw later, unlinkably, to any
              address — even one that has never held a lamport.
            </p>
            <div className="fade-up fade-up-delay-3 mt-9 flex flex-wrap gap-3">
              <Button asChild size="pill">
                <Link href="/login">
                  Launch app <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="pill" variant="outline" className="rounded-full">
                <a href="#how">How it works</a>
              </Button>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-8 left-5 z-20 hidden w-[min(100%,22rem)] sm:left-8 lg:left-auto lg:right-[8%] lg:bottom-16 lg:block">
          <div className="pointer-events-auto">
            <ProductMock stats={stats} />
          </div>
        </div>
      </section>

      <BuiltWithStrip />

      <section id="how" className="mx-auto w-full max-w-6xl px-5 py-[7.5rem]">
        <p className="text-[12px] tracking-[0.2em] text-gold uppercase">How it works</p>
        <h2 className="section-title mt-3 max-w-xl">
          Three steps. One denomination. Zero gas on the recipient.
        </h2>
        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {steps.map((step) => (
            <article key={step.n} className="border-t border-hairline pt-6">
              <p className="font-mono text-xs text-gold">{step.n}</p>
              <h3 className="mt-3 font-serif text-2xl">{step.title}</h3>
              <p className="prose-muted mt-3 text-[16px]">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="product" className="relative overflow-visible border-t border-hairline">
        <div className="mx-auto grid w-full max-w-6xl items-end gap-10 px-5 pt-16 md:grid-cols-[0.9fr_1.1fr] md:pt-10 md:pb-0">
          <div className="relative z-10 mx-auto w-full max-w-md md:-mb-16">
            <Image
              src="/art/hero-hooded-scholar.webp"
              alt="Painted hooded scholar reading"
              width={829}
              height={1107}
              className="h-auto w-full"
              sizes="(min-width: 768px) 40vw, 90vw"
            />
          </div>
          <div className="pb-16 md:pb-24">
            <p className="text-[12px] tracking-[0.2em] text-gold uppercase">The pool</p>
            <h2 className="section-title mt-3">A single, honest ledger of leaves.</h2>
            <ul className="mt-8 space-y-5">
              <li className="prose-muted">
                <strong className="text-foreground">On-chain commitments.</strong> Each
                deposit creates a CommitmentRecord and a sequential LeafRecord so an honest
                relayer can rebuild the tree after a restart.
              </li>
              <li className="prose-muted">
                <strong className="text-foreground">Nullifiers.</strong> The same note cannot
                be spent twice, even by the relayer.
              </li>
              <li className="prose-muted">
                <strong className="text-foreground">Recipient binding.</strong> The circuit
                public signals include the destination pubkey.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-[7.5rem] md:pt-32">
        <p className="text-[12px] tracking-[0.2em] text-gold uppercase">Live on Devnet</p>
        <h2 className="section-title mt-3">The pool, as it stands.</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <StatDash
            label="Deposits"
            value={stats.deposits != null ? String(stats.deposits) : null}
          />
          <StatDash
            label="Anonymity set"
            value={stats.anonymitySet != null ? `${stats.anonymitySet} leaves` : null}
            hint="Leaves in the Merkle tree"
          />
          <StatDash
            label="TVL"
            value={stats.tvlUi != null ? `${stats.tvlUi} USDC` : null}
            hint="Vault token account"
            unavailableHint="Could not read the vault ATA. Showing a dash instead of a guessed zero."
          />
          <StatDash
            label="Last activity"
            value={formatAgo(stats.lastActivityIso)}
          />
          <StatDash
            label="Relayer"
            value={
              stats.relayerOk == null ? null : stats.relayerOk ? "Healthy" : "Unreachable"
            }
            hint={stats.cluster}
          />
        </div>
      </section>

      <VerifySection stats={stats} />

      <section className="mx-auto w-full max-w-3xl px-5 py-[7.5rem] pt-0">
        <h2 className="section-title">Questions, plainly.</h2>
        <div className="mt-8">
          <LandingFaq />
        </div>
      </section>

      <section className="border-t border-hairline">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-8 px-5 py-[7.5rem] md:flex-row md:items-center">
          <h2 className="section-title max-w-lg">
            Withdraw in private.
            <em className="italic text-muted-foreground"> Arrive with nothing.</em>
          </h2>
          <Button asChild size="pill">
            <Link href="/login">
              Launch app <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
