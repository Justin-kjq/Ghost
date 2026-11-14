import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GhostWordmark } from "@/components/ghost-mark";
import { GITHUB_REPO } from "@/lib/addresses";

const links = [
  { href: "#verify", label: "Verify" },
  { href: "#how", label: "How it works" },
  { href: GITHUB_REPO, label: "Docs", external: true },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-[4.25rem] w-full max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/" className="hover:opacity-80">
          <GhostWordmark markClassName="size-8" />
        </Link>
        <nav className="hidden items-center gap-8 text-[14.5px] text-foreground/85 md:flex">
          {links.map((l) =>
            l.external ? (
              <a
                key={l.label}
                href={l.href}
                className="hover:text-foreground"
                target="_blank"
                rel="noreferrer"
              >
                {l.label}
              </a>
            ) : (
              <a key={l.label} href={l.href} className="hover:text-foreground">
                {l.label}
              </a>
            ),
          )}
        </nav>
        <div className="flex items-center gap-3">
          <details className="relative md:hidden">
            <summary className="cursor-pointer list-none text-[14.5px] text-foreground/80 [&::-webkit-details-marker]:hidden">
              Menu
            </summary>
            <div className="absolute right-0 mt-3 w-44 rounded-lg border border-hairline bg-background p-3 text-sm shadow-sm">
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className="block py-1.5 text-foreground/80 hover:text-foreground"
                  {...(l.external ? { target: "_blank", rel: "noreferrer" } : {})}
                >
                  {l.label}
                </a>
              ))}
            </div>
          </details>
          <Button asChild size="pill" className="h-10 px-5">
            <Link href="/login">Launch app</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
