import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function NotFound() {
  return (
    <div>
      <SiteHeader />
      <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col justify-center px-5 py-24">
        <p className="text-[12px] tracking-[0.2em] text-gold uppercase">404</p>
        <h1 className="section-title mt-3">This page is not in the tree.</h1>
        <p className="prose-muted mt-4">
          The route does not exist. Head back to the pool, or open the app if you
          already have a wallet connected.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="pill">
            <Link href="/">Home</Link>
          </Button>
          <Button asChild size="pill" variant="outline" className="rounded-full">
            <Link href="/login">Launch app</Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
