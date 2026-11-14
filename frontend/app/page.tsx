import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LandingFaq } from "@/components/landing-faq";
import { fetchRelayerStats } from "@/lib/relayer-public";
import { CLUSTER } from "@/lib/config";

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

const marks = ["Solana", "Anchor", "Circom", "Groth16", "Phantom", "Devnet"];

export default async function LandingPage() {
  const stats = await fetchRelayerStats();

  return (
    <div className="relative">
      <SiteHeader />

      <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-16 pt-12 md:grid-cols-[1.1fr_0.9fr] md:gap-16 md:pb-24 md:pt-20">
        <div>
          <p className="fade-up mb-5 text-xs font-medium tracking-[0.22em] text-gold uppercase">
            Private USDC · Solana Devnet
          </p>
          <h1 className="fade-up fade-up-delay-1 font-serif text-[2.75rem] leading-[1.08] tracking-tight text-balance sm:text-5xl md:text-[3.6rem]">
            Privacy is not a feature. It&apos;s a{" "}
            <em className="italic text-muted-foreground">right.</em>
          </h1>
          <p className="fade-up fade-up-delay-2 mt-6 max-w-md text-base leading-relaxed text-muted-foreground md:text-lg">
            Shielded deposits into a shared USDC pool. Withdraw later, unlinkably,
            to any address — even one that has never held a lamport.
          </p>
          <div className="fade-up fade-up-delay-3 mt-8 flex flex-wrap gap-3">
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
        <div className="fade-up fade-up-delay-2 relative aspect-[4/5] overflow-hidden rounded-sm bg-stone/20 md:aspect-[4/5]">
          <Image
            src="/art/hero-veiled.webp"
            alt="Veiled marble statue in a sunlit colonnade"
            fill
            priority
            className="object-cover object-[center_20%]"
            sizes="(min-width: 768px) 42vw, 100vw"
          />
        </div>
      </section>

      <section className="border-y border-hairline">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-8 md:flex-row md:items-center md:justify-between">
          <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
            Built with
          </p>
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-muted-foreground">
            {marks.map((m) => (
              <span key={m} className="tracking-wide">
                {m}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto w-full max-w-6xl px-5 py-20 md:py-28">
        <p className="text-xs tracking-[0.22em] text-gold uppercase">How it works</p>
        <h2 className="mt-3 max-w-xl font-serif text-4xl tracking-tight md:text-5xl">
          Three steps. One denomination. Zero gas on the recipient.
        </h2>
        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {steps.map((step) => (
            <article key={step.n} className="border-t border-hairline pt-6">
              <p className="font-mono text-xs text-gold">{step.n}</p>
              <h3 className="mt-3 font-serif text-2xl">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="product" className="border-y border-hairline bg-[#f3efe8]">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-2 md:py-24">
          <div className="relative mx-auto aspect-[3/4] w-full max-w-md">
            <Image
              src="/art/hero-hooded-scholar.webp"
              alt="Painted hooded scholar"
              fill
              className="object-contain"
              sizes="(min-width: 768px) 40vw, 90vw"
            />
          </div>
          <div>
            <p className="text-xs tracking-[0.22em] text-gold uppercase">The pool</p>
            <h2 className="mt-3 font-serif text-4xl tracking-tight md:text-5xl">
              A single, honest ledger of leaves.
            </h2>
            <ul className="mt-8 space-y-5 text-muted-foreground">
              <li>
                <strong className="text-foreground">On-chain commitments.</strong>{" "}
                Each deposit creates a CommitmentRecord and a sequential LeafRecord
                so an honest relayer can rebuild the tree after a restart.
              </li>
              <li>
                <strong className="text-foreground">Nullifiers.</strong> The same
                note cannot be spent twice, even by the relayer.
              </li>
              <li>
                <strong className="text-foreground">Recipient binding.</strong> The
                circuit public signals include the destination pubkey.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden border-b border-hairline">
        <Image
          src="/art/dashboard-tapestry.webp"
          alt=""
          fill
          className="object-cover opacity-25"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background" />
        <div className="relative mx-auto w-full max-w-6xl px-5 py-20 md:py-24">
          <p className="text-xs tracking-[0.22em] text-gold uppercase">Why Ghost</p>
          <h2 className="mt-3 max-w-xl font-serif text-4xl tracking-tight md:text-5xl">
            Quiet machinery. Editorial restraint.
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {[
              {
                t: "Shielded USDC",
                d: "One denomination, one commitment, one leaf. The vault holds the same token you deposited.",
              },
              {
                t: "Proofs in the browser",
                d: "Circom + Groth16 run locally. The note never goes to the relayer — sending it would link you.",
              },
              {
                t: "Gasless exits",
                d: "The relayer pays Solana fees. A fresh address with 0 SOL still receives 0.997 USDC.",
              },
              {
                t: "Notes stay local",
                d: "Export, import, copy. Ghost does not keep a server-side copy of your secret.",
              },
            ].map((f) => (
              <article
                key={f.t}
                className="border-t border-hairline bg-background/40 pt-5 backdrop-blur-[2px]"
              >
                <h3 className="font-serif text-2xl">{f.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-20">
        <div className="grid gap-6 md:grid-cols-3">
          <Stat
            label="Cluster"
            value={stats?.cluster || CLUSTER}
          />
          <Stat
            label="Deposits"
            value={
              typeof stats?.deposits === "number" ? String(stats.deposits) : "—"
            }
          />
          <Stat
            label="Relayer"
            value={stats?.ok ? "Healthy" : "Unreachable"}
          />
        </div>
        {!stats && (
          <p className="mt-4 text-sm text-muted-foreground">
            Live stats unavailable — the relayer did not answer. The app still
            works once it is reachable.
          </p>
        )}
      </section>

      <section className="mx-auto w-full max-w-3xl px-5 pb-20">
        <h2 className="font-serif text-4xl tracking-tight">Questions, plainly.</h2>
        <div className="mt-8">
          <LandingFaq />
        </div>
      </section>

      <section className="border-t border-hairline">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-8 px-5 py-16 md:flex-row md:items-center">
          <h2 className="max-w-lg font-serif text-4xl tracking-tight md:text-5xl">
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-hairline pt-5">
      <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-2 font-serif text-3xl capitalize">{value}</p>
    </div>
  );
}
