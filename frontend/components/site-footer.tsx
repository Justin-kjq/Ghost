import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p className="font-serif text-lg text-foreground">Ghost</p>
        <div className="flex flex-wrap gap-5">
          <Link href="/login">App</Link>
          <a href="https://github.com/Arnab-Afk/Ghost" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href="https://explorer.solana.com/?cluster=devnet" target="_blank" rel="noreferrer">
            Devnet explorer
          </a>
        </div>
        <p>Devnet only. Never mainnet. Lean MVP trust model.</p>
      </div>
    </footer>
  );
}
