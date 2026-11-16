import Link from "next/link";
import { GhostWordmark } from "@/components/ghost-mark";
import { GITHUB_REPO } from "@/lib/addresses";
import { LEGAL_PAGES } from "@/lib/legal";

export function SiteFooter() {
  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <GhostWordmark />
          <div className="flex flex-wrap gap-6 text-[14.5px] text-foreground/80">
            <Link href="/login" className="hover:text-foreground">
              App
            </Link>
            <a href={GITHUB_REPO} target="_blank" rel="noreferrer" className="hover:text-foreground">
              GitHub
            </a>
            {LEGAL_PAGES.map((p) => (
              <Link key={p.href} href={p.href} className="hover:text-foreground">
                {p.label}
              </Link>
            ))}
          </div>
        </div>
        <p className="max-w-[70ch] text-sm leading-relaxed text-muted-foreground">
          Not financial advice. Ghost is an unaudited Lean MVP: Groth16 is verified off-chain,
          and a malicious relayer can drain the vault. See the{" "}
          <Link href="/risk" className="underline underline-offset-2">
            Risk Disclosure
          </Link>
          .
        </p>
      </div>
    </footer>
  );
}
