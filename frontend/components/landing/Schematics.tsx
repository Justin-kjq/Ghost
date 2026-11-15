// Plain-language visuals for the three Security cards. Each one tells a single
// story a non-developer can read at a glance: who has the money, what anyone
// watching can see, and what Ghost does about it.

import type { ReactNode } from "react";
import { Cross, Eye, GhostIcon, Key, Lock, Person, Shield, Tick, Wallet } from "./icons";

const CREAM = "#fefbf6";
const GOLD = "#d6bf7a";
const BOX = "#2b292a";

export function Card({
  code,
  title,
  specs,
  children,
  bodyClass = "aspect-[440/300]",
}: {
  code: string;
  title: string;
  specs: [string, string][];
  children: ReactNode;
  bodyClass?: string;
}) {
  return (
    <figure className="flex h-full flex-col border border-cream/15 bg-black/15 text-cream">
      <figcaption className="flex items-center justify-between border-b border-cream/15 px-4 py-3 text-[12px] text-cream/70">
        <span className="flex items-center gap-2">
          <span className="h-[6px] w-[6px] bg-sun" />
          {code}
        </span>
        <span>{title}</span>
      </figcaption>
      <div className={`grid-paper relative ${bodyClass} [--gp:rgba(254,251,246,.06)] [--gs:22px]`}>{children}</div>
      <dl className="grid grid-cols-3 border-t border-cream/15 text-[12px]">
        {specs.map(([k, v]) => (
          <div key={k} className="border-l border-cream/15 px-4 py-3 first:border-0">
            <dt className="text-cream/50">{k}</dt>
            <dd className="mt-1 text-cream">{v}</dd>
          </div>
        ))}
      </dl>
    </figure>
  );
}

/** readable text: 12px sans for words, small caps headers */
const T = ({ x, y, children, a = "start", gold = false, o = 0.85, s = 12, w = 500 }: { x: number; y: number; children: ReactNode; a?: "start" | "middle" | "end"; gold?: boolean; o?: number; s?: number; w?: number }) => (
  <text x={x} y={y} textAnchor={a} fontSize={s} fontWeight={w} fill={gold ? GOLD : CREAM} fillOpacity={gold ? 1 : o}>
    {children}
  </text>
);
const H = ({ x, y, children, a = "start" }: { x: number; y: number; children: ReactNode; a?: "start" | "middle" | "end" }) => (
  <text x={x} y={y} textAnchor={a} fontSize="10" letterSpacing=".1em" fill={CREAM} fillOpacity=".5">
    {children}
  </text>
);

function Dot({ path, dur = "2.4s", begin = "0s", gold = true }: { path: string; dur?: string; begin?: string; gold?: boolean }) {
  return (
    <circle r="3" fill={gold ? GOLD : CREAM}>
      <animateMotion dur={dur} begin={begin} repeatCount="indefinite" path={path} />
    </circle>
  );
}

/* ───────── 02 · Gasless: sending with zero SOL ───────── */

export function SchGasless() {
  const sendPath = "M150 196H296";
  return (
    <Card code="02" title="Sending with zero SOL" specs={[["SOL you need", "None"], ["Fees paid by", "Ghost"], ["You pay", "~0.003 USDC"]]}>
      <svg viewBox="0 0 440 300" className="absolute inset-0 h-full w-full" role="img" aria-label="Any other wallet with zero SOL is stuck and cannot send. With Ghost, a wallet with zero SOL receives 1 USDC; Ghost pays the network fee and takes about 0.003 USDC instead.">
        {/* row 1: the usual problem */}
        <H x={22} y={36}>ANY OTHER WALLET</H>
        <rect x="20" y="48" width="130" height="58" fill={BOX} stroke={CREAM} strokeOpacity=".3" />
        <Wallet x={30} y={57} c="rgba(254,251,246,.55)" />
        <T x={58} y={71} o={0.6}>
          Your wallet
        </T>
        <T x={30} y={96} s={11} o={0.5}>
          0 SOL · 1 USDC
        </T>
        <path d="M150 77H252" stroke={CREAM} strokeOpacity=".3" strokeDasharray="3 4" />
        <Cross x={258} y={67} />
        <T x={286} y={74} o={0.75}>
          Stuck.
        </T>
        <T x={286} y={90} s={11} o={0.5}>
          Needs SOL for fees
        </T>

        <path d="M20 128H420" stroke={CREAM} strokeOpacity=".12" />

        {/* row 2: with Ghost */}
        <H x={22} y={156}>WITH GHOST</H>
        <rect x="20" y="168" width="130" height="58" fill={BOX} stroke={GOLD} />
        <Wallet x={30} y={177} c={GOLD} />
        <T x={58} y={191}>
          Your wallet
        </T>
        <T x={30} y={216} s={11} o={0.6}>
          0 SOL · 1 USDC
        </T>

        <path d={sendPath} stroke={GOLD} strokeWidth="1.4" />
        <path d="M290 190l6 6-6 6" fill="none" stroke={GOLD} strokeWidth="1.4" />
        <Dot path={sendPath} dur="1.8s" />
        <Dot path={sendPath} dur="1.8s" begin=".9s" />

        {/* ghost covers the fee, mid-arrow */}
        <GhostIcon x={213} y={160} s={1.1} />
        <T x={223} y={150} a="middle" s={11} gold>
          Ghost pays the gas
        </T>
        <T x={223} y={222} a="middle" s={10.5} o={0.55}>
          fee: ~0.003 USDC
        </T>

        <rect x="296" y="168" width="124" height="58" fill={BOX} stroke={CREAM} strokeOpacity=".35" />
        <Person x={306} y={177} />
        <T x={332} y={191}>
          Your friend
        </T>
        <Tick x={306} y={202} s={0.8} />
        <T x={326} y={216} s={11} gold>
          1 USDC sent
        </T>

        <T x={220} y={268} a="middle" s={12.5} o={0.95}>
          No SOL, no problem. Ghost covers the network fee
        </T>
        <T x={220} y={285} a="middle" s={12.5} gold>
          and takes a few cents of USDC instead.
        </T>
      </svg>
    </Card>
  );
}

/* ───────── 03 · Compliance: you choose who sees what ───────── */

export function SchCompliance() {
  const rows = [
    ["Deposit", "0.2", true],
    ["Sent to friend", "0.2", true],
    ["Sent", "0.5", false],
    ["Deposit", "1.0", false],
  ] as const;
  const keyPath = "M184 120H256";
  return (
    <Card code="03" title="You choose who sees what" specs={[["You share", "Only what you pick"], ["With", "Who you choose"], ["Screening", "Sanctions lists"]]}>
      <svg viewBox="0 0 440 300" className="absolute inset-0 h-full w-full" role="img" aria-label="Your activity has four transactions. You switch on two and share a read-only key with an auditor, who sees only those two. Every deposit is also checked against sanctions lists.">
        {/* your activity with toggles */}
        <rect x="20" y="30" width="164" height="168" fill={BOX} stroke={CREAM} strokeOpacity=".35" />
        <H x={30} y={50}>YOUR ACTIVITY</H>
        {rows.map(([t, v, on], i) => {
          const y = 66 + i * 32;
          return (
            <g key={i}>
              <T x={30} y={y + 15} s={11.5} o={on ? 0.95 : 0.5}>
                {t}
              </T>
              <T x={136} y={y + 15} a="end" s={11} o={on ? 0.7 : 0.4}>
                {v}
              </T>
              {/* toggle */}
              <rect x="144" y={y + 4} width="28" height="15" rx="7.5" fill={on ? GOLD : "none"} stroke={on ? GOLD : CREAM} strokeOpacity={on ? 1 : 0.4} />
              <circle cx={on ? 164 : 152} cy={y + 11.5} r="5" fill={on ? "#252324" : CREAM} fillOpacity={on ? 1 : 0.5} />
            </g>
          );
        })}

        {/* the read-only key travels to the auditor */}
        <path d={keyPath} stroke={GOLD} strokeWidth="1.4" strokeDasharray="4 4" />
        <path d="M250 114l6 6-6 6" fill="none" stroke={GOLD} strokeWidth="1.4" />
        <Key x={210} y={96} s={1.1} />
        <Dot path={keyPath} dur="1.6s" />
        <T x={220} y={142} a="middle" s={10.5} gold>
          read-only key
        </T>

        {/* auditor */}
        <rect x="256" y="30" width="164" height="168" fill={BOX} stroke={GOLD} />
        <Eye x={266} y={38} c={GOLD} />
        <T x={292} y={52} gold s={11.5}>
          Auditor sees
        </T>
        {rows
          .filter((r) => r[2])
          .map(([t, v], i) => (
            <g key={i}>
              <T x={266} y={86 + i * 32} s={11.5}>
                {t}
              </T>
              <T x={410} y={86 + i * 32} a="end" s={11} o={0.7}>
                {v}
              </T>
            </g>
          ))}
        <path d="M266 140H410" stroke={CREAM} strokeOpacity=".15" />
        <Lock x={264} y={152} c="rgba(254,251,246,.5)" s={0.9} />
        <T x={288} y={166} s={11} o={0.5}>
          everything else
        </T>
        <T x={288} y={181} s={11} o={0.5}>
          stays private
        </T>

        {/* sanctions screening */}
        <Shield x={84} y={221} />
        <T x={110} y={235} s={12}>
          Every deposit checked against sanctions lists
        </T>

        <T x={220} y={276} a="middle" s={12.5} gold>
          Private, not hidden.
        </T>
      </svg>
    </Card>
  );
}
