"use client";

import { useState, type ReactNode } from "react";
import { Cabinet, CaseTile, parts } from "./LineArt";
import { TurnArrow } from "./marks";
import { Reveal } from "./Reveal";

/* ───────── How it works: drawing + numbered index ───────── */

export function HowPanel() {
  const [active, setActive] = useState<number | null>(null);
  return (
    <div className="grid grid-cols-[1fr_auto] bg-paper">
      <Reveal className="relative p-6 md:p-10" threshold={0.05}>
        <div className="mx-auto aspect-[520/640] max-h-[680px] w-full max-w-[560px]">
          <Cabinet active={active} />
        </div>
        <p
          className="t-14 absolute bottom-5 left-6 max-w-[60%] text-ink/70 transition-opacity duration-300 md:left-10"
          style={{ opacity: active ? 1 : 0 }}
          aria-live="polite"
        >
          {active ? `${parts[active - 1].name} · ${parts[active - 1].where}` : ""}
        </p>
      </Reveal>
      <ol className="flex w-[52px] flex-col border-l border-ink/10 md:w-[64px]">
        {parts.map((p) => (
          <li key={p.n} className="flex-1 border-b border-ink/10 last:border-0">
            <button
              onMouseEnter={() => setActive(p.n)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(p.n)}
              onBlur={() => setActive(null)}
              aria-label={`${p.n}: ${p.name}`}
              className={`t-14 grid h-full min-h-[44px] w-full place-items-center transition-colors ${
                active === p.n ? "bg-sun" : "hover:bg-sun/50"
              }`}
            >
              {p.n}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ───────── Proof (case-study) slider ───────── */

export type Case = {
  title: string;
  kind: "tx" | "contract";
  label: string;
  caption: string;
  meta: [string, string][];
  body: string;
  href: string;
};

export function Cases({ items }: { items: Case[] }) {
  const [i, setI] = useState(0);
  const c = items[i];
  const go = (d: number) => setI((n) => (n + d + items.length) % items.length);
  return (
    <div>
      <div key={i} className="grid gap-8 md:grid-cols-[minmax(0,540px)_1fr] md:gap-0">
        <div className="md:pr-[40px]">
          <CaseTile label={c.label} caption={c.caption} kind={i} />
        </div>
        <div className="md:border-l md:border-ink/15 md:pl-[40px]">
          <h3 className="t-32 max-w-[480px]">{c.title}</h3>
          <hr className="my-6 border-ink/15" />
          <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
            <dl className="self-start">
              {c.meta.map(([k, v]) => (
                <div key={k} className="t-14 flex gap-2 border-b border-ink/15 py-[10px] first:border-t">
                  <dt>{k}</dt>
                  <dd className="font-normal">{v}</dd>
                </div>
              ))}
            </dl>
            <div>
              <p className="text-[20px] font-normal leading-[1.5] tracking-[-0.01em]">{c.body}</p>
              <a href={c.href} target="_blank" rel="noopener noreferrer" className="t-16 group mt-8 inline-flex items-center gap-[10px] text-ink">
                {c.kind === "tx" ? "View transaction" : "View contract"}
                <TurnArrow className="h-[14px] w-[14px] transition-transform group-hover:translate-x-[3px]" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between border-t border-ink/15 pt-6">
        <span className="t-14 font-mono">
          {String(i + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
        </span>
        <div className="flex gap-[6px]">
          {[
            [-1, "Previous", "M10 3L5 8l5 5"],
            [1, "Next", "M6 3l5 5-5 5"],
          ].map(([d, label, path]) => (
            <button
              key={label as string}
              onClick={() => go(d as number)}
              aria-label={label as string}
              className="grid h-10 w-10 place-items-center bg-ink text-sun transition-transform active:scale-95"
            >
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d={path as string} />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────── FAQ accordion ───────── */

export function Faq({ items }: { items: { q: string; a: ReactNode }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <ul className="border-t border-[#efe6a6]">
      {items.map((it, i) => {
        const on = open === i;
        return (
          <li key={it.q} className="border-b border-[#efe6a6]">
            <button
              onClick={() => setOpen(on ? null : i)}
              aria-expanded={on}
              className="flex w-full items-center justify-between gap-6 py-4 text-left"
            >
              <span className="text-[20px] leading-[1.2] tracking-[-0.04em] text-ink">{it.q}</span>
              <svg
                viewBox="0 0 16 16"
                className={`h-4 w-4 shrink-0 text-ink transition-transform duration-300 ${on ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
              >
                <path d="M3 6l5 5 5-5" />
              </svg>
            </button>
            <div className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.6,0,0.2,1)] ${on ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
              <div className="overflow-hidden">
                <p className="max-w-[640px] pb-6 text-[18px] font-normal leading-[1.5] tracking-[-0.01em] text-ink">{it.a}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
