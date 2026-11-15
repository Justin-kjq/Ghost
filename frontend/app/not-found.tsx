import Link from "next/link";
import { Wordmark, TurnArrow } from "@/components/landing/marks";

export default function NotFound() {
  return (
    <div className="landing-root flex min-h-screen flex-col bg-cream text-ink">
      <div className="gutter py-8">
        <Link href="/">
          <Wordmark className="text-[22px] [--eye:var(--cream)]" />
        </Link>
      </div>
      <main className="gutter flex flex-1 flex-col justify-center pb-24">
        <span className="tag">404</span>
        <h1 className="t-48 mt-6 max-w-[16ch]">This page is not in the tree.</h1>
        <p className="t-16 mt-4 max-w-[48ch] font-normal text-ink/65">
          The route does not exist. Head back to the pool, or open the app if you already have a
          wallet connected.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/"
            className="group inline-flex h-11 items-center gap-[10px] bg-ink px-[18px] text-[16px] text-cream"
          >
            Home
            <TurnArrow className="h-[14px] w-[14px] transition-transform group-hover:translate-x-[3px]" />
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center border border-ink/15 px-[18px] text-[16px] text-ink hover:bg-sand"
          >
            Launch app
          </Link>
        </div>
      </main>
    </div>
  );
}
