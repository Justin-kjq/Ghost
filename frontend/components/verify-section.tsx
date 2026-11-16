import { ExternalLink, GitBranch, KeyRound, Shield, FileWarning, Cpu } from "lucide-react";
import { CopyAddr } from "@/components/copy-addr";
import { FlowDiagram } from "@/components/flow-diagram";
import { DEVNET, GITHUB_REPO, explorerAddress, publicMint, publicProgramId } from "@/lib/addresses";
import type { PoolLiveStats } from "@/lib/pool-stats";

function AddrRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-hairline py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[12px] tracking-[0.16em] text-muted-foreground uppercase">{label}</p>
      <div className="flex min-w-0 items-center gap-2">
        <a
          href={explorerAddress(value)}
          target="_blank"
          rel="noreferrer"
          className="truncate font-mono text-[13px] text-foreground hover:underline"
        >
          {value}
        </a>
        <CopyAddr value={value} />
        <a
          href={explorerAddress(value)}
          target="_blank"
          rel="noreferrer"
          className="text-muted-foreground hover:text-foreground"
          aria-label="Open in Solana Explorer"
        >
          <ExternalLink className="size-3.5" />
        </a>
      </div>
    </div>
  );
}

export function VerifySection({ stats }: { stats: PoolLiveStats }) {
  const program = publicProgramId();
  const mint = stats.mint || publicMint();
  const pool = stats.pool || DEVNET.pool;
  const vault = stats.vault || DEVNET.vault;

  const levers = [
    {
      icon: GitBranch,
      t: "Open source",
      d: "Read the program, circuit, relayer, and UI. Nothing here is closed.",
      href: GITHUB_REPO,
    },
    {
      icon: KeyRound,
      t: "Non-custodial",
      d: "Ghost never holds your keys or Ghost Notes. The note lives in this browser unless you export it.",
    },
    {
      icon: Cpu,
      t: "Proofs in the browser",
      d: "Groth16 (Circom) runs locally. The relayer never needs the note; sending it would let someone link you.",
    },
    {
      icon: Shield,
      t: "Recipient-bound proofs",
      d: "The destination pubkey is a Groth16 public signal. An honest relayer cannot reroute your withdraw. This Lean MVP still verifies proofs off-chain; a malicious relayer can drain the vault.",
    },
    {
      icon: FileWarning,
      t: "Unaudited MVP",
      d: "No audit yet. Nullifier PDAs still stop the same note being spent twice.",
    },
  ];

  return (
    <section id="verify" className="mx-auto w-full max-w-6xl px-5 py-[7.5rem]">
      <p className="text-[12px] tracking-[0.2em] text-gold uppercase">Verify</p>
      <h2 className="section-title mt-3 max-w-2xl">
        Don&apos;t take our word. Check the chain.
      </h2>
      <p className="prose-muted mt-5">
        Every deposit writes a commitment and a sequential leaf on Solana. Explorer links below
        open the live accounts.
      </p>

      <div className="mt-10 rounded-2xl border border-hairline bg-card/60 px-5 sm:px-6">
        <AddrRow label="Program" value={program} />
        <AddrRow label="Pool" value={pool} />
        <AddrRow label="Mint (USDC)" value={mint} />
        <AddrRow label="Vault" value={vault} />
      </div>

      <ul className="mt-12 grid gap-8 md:grid-cols-2">
        {levers.map((item) => (
          <li key={item.t} className="border-t border-hairline pt-5">
            <item.icon className="size-5 text-gold" />
            <h3 className="mt-3 font-serif text-2xl">{item.t}</h3>
            <p className="prose-muted mt-2">{item.d}</p>
            {item.href ? (
              <a
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm text-foreground underline-offset-4 hover:underline"
              >
                GitHub <ExternalLink className="size-3.5" />
              </a>
            ) : null}
          </li>
        ))}
      </ul>

      <h3 className="mt-16 font-serif text-3xl tracking-tight">The path of a note</h3>
      <FlowDiagram />
    </section>
  );
}
