import Link from "next/link";
import { Button } from "@/components/ui/button";

const links = [
  { href: "#product", label: "Product" },
  { href: "#how", label: "How it works" },
  { href: "https://github.com/Arnab-Afk/Ghost", label: "Docs", external: true },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/" className="font-serif text-xl tracking-tight">
          Ghost
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
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
            <summary className="cursor-pointer list-none text-sm text-muted-foreground [&::-webkit-details-marker]:hidden">
              Menu
            </summary>
            <div className="absolute right-0 mt-3 w-44 rounded-lg border border-hairline bg-background p-3 text-sm shadow-sm">
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className="block py-1.5 text-muted-foreground hover:text-foreground"
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
