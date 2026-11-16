"use client";

import { useEffect, useRef, useState } from "react";

/*
  Ghost Gas route map (same visual system).
  Correct causality:
    1) X1 tops up → treasury → gas note
    2) X2 attaches note, signs SPL transfer → recipient (tokens)
    3) Relayer sponsors SOL + debits the note (not on the token path)
*/

const W = 124;
const H = 58;
const R = 14;

type Node = { id: string; x: number; y: number; name: string; sub: string };

const nodes: Node[] = [
  { id: "a", x: 28, y: 36, name: "Primary", sub: "funds credit" },
  { id: "b", x: 168, y: 148, name: "Ghost", sub: "treasury" },
  { id: "c", x: 320, y: 286, name: "Gas note", sub: "prepaid fee" },
  { id: "d", x: 480, y: 372, name: "Alt wallet", sub: "signs · 0 SOL" },
  { id: "e", x: 680, y: 372, name: "Recipient", sub: "receives tokens" },
  { id: "f", x: 680, y: 148, name: "Relayer", sub: "pays SOL" },
  { id: "g", x: 860, y: 36, name: "Credit", sub: "debit ~0.01$" },
];
const at = (id: string) => nodes.find((n) => n.id === id)!;

const v = (x1: number, y1: number, x2: number, y2: number) =>
  `M${x1} ${y1}V${y2 - R}Q${x1} ${y2} ${x1 + R} ${y2}H${x2}`;
const h = (x1: number, y1: number, x2: number) => `M${x1} ${y1}H${x2}`;
const hv = (x1: number, y1: number, x2: number, y2: number) =>
  `M${x1} ${y1}H${x2 - R}Q${x2} ${y1} ${x2} ${y1 - R}V${y2}`;
const vh = (x1: number, y1: number, x2: number, y2: number) =>
  `M${x1} ${y1}V${y2 + R}Q${x1} ${y2} ${x1 + R} ${y2}H${x2}`;

type Route = {
  from: string;
  to: string;
  d: string;
  label: string;
  lx: number;
  ly: number;
  end: [number, number];
  dir: "r" | "u" | "d";
};

const routes: Route[] = (() => {
  const A = at("a"),
    B = at("b"),
    C = at("c"),
    D = at("d"),
    E = at("e"),
    F = at("f"),
    G = at("g");
  return [
    {
      from: "a",
      to: "b",
      d: v(A.x + 30, A.y + H, B.x, B.y + H / 2),
      label: "top up",
      lx: A.x + 40,
      ly: B.y + H / 2 - 10,
      end: [B.x, B.y + H / 2],
      dir: "r",
    },
    {
      from: "b",
      to: "c",
      d: v(B.x + 30, B.y + H, C.x, C.y + H / 2),
      label: "issue note",
      lx: B.x + 40,
      ly: C.y + H / 2 - 10,
      end: [C.x, C.y + H / 2],
      dir: "r",
    },
    {
      from: "c",
      to: "d",
      d: v(C.x + 30, C.y + H, D.x, D.y + H / 2),
      label: "attach note",
      lx: C.x + 40,
      ly: D.y + H / 2 - 10,
      end: [D.x, D.y + H / 2],
      dir: "r",
    },
    // Tokens: X2 → recipient (relayer is NOT on this path)
    {
      from: "d",
      to: "e",
      d: h(D.x + W, D.y + H / 2, E.x),
      label: "SPL transfer",
      lx: D.x + W + 18,
      ly: D.y + H / 2 - 10,
      end: [E.x, E.y + H / 2],
      dir: "r",
    },
    // Sponsorship branch: X2 asks relayer to pay SOL
    {
      from: "d",
      to: "f",
      d: vh(D.x + 94, D.y, F.x, F.y + H / 2),
      label: "sponsor SOL",
      lx: D.x + 104,
      ly: F.y + H / 2 + 18,
      end: [F.x, F.y + H / 2],
      dir: "r",
    },
    // Debit credit after successful send
    {
      from: "f",
      to: "g",
      d: hv(F.x + W, F.y + H / 2, G.x + 30, G.y + H),
      label: "debit note",
      lx: F.x + W + 8,
      ly: F.y + H / 2 + 22,
      end: [G.x + 30, G.y + H],
      dir: "u",
    },
  ];
})();

const CREAM = "#fefbf6";
const SUN = "#ffec88";

function Arrowhead({
  x,
  y,
  dir,
  color,
}: {
  x: number;
  y: number;
  dir: "r" | "u" | "d";
  color: string;
}) {
  const d =
    dir === "r"
      ? `M${x - 7} ${y - 5}L${x - 1} ${y}L${x - 7} ${y + 5}`
      : dir === "u"
        ? `M${x - 5} ${y + 7}L${x} ${y + 1}L${x + 5} ${y + 7}`
        : `M${x - 5} ${y - 7}L${x} ${y - 1}L${x + 5} ${y - 7}`;
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

export function FlowDiagram({ className = "" }: { className?: string }) {
  const [rawStep, setStep] = useState(-1);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
        setVisible(e.isIntersecting);
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || reduced) return;
    const id = setInterval(
      () => setStep((s) => (s + 1 > routes.length ? -1 : s + 1)),
      1500,
    );
    return () => clearInterval(id);
  }, [visible, reduced]);

  const step = reduced ? routes.length - 1 : rawStep;

  const lit = new Set<string>();
  routes.forEach((r, i) => {
    if (i <= step) {
      lit.add(r.from);
      lit.add(r.to);
    }
  });
  const active = step >= 0 && step < routes.length ? routes[step] : null;

  return (
    <svg
      ref={ref}
      viewBox="0 0 1080 470"
      className={className}
      role="img"
      aria-label="Ghost Gas: the primary wallet tops up Ghost and gets a gas note. The alt wallet attaches the note and signs a token transfer straight to the recipient. Ghost pays SOL as fee payer and debits the note. Tokens do not pass through the relayer."
    >
      {routes.map((r) => (
        <g key={r.label}>
          <path
            d={r.d}
            fill="none"
            stroke={CREAM}
            strokeOpacity=".32"
            strokeWidth="1.2"
            strokeDasharray="2 5"
            strokeLinecap="round"
          />
          <Arrowhead x={r.end[0]} y={r.end[1]} dir={r.dir} color="rgba(254,251,246,.4)" />
        </g>
      ))}

      {routes.map((r, i) =>
        i < step ? (
          <path
            key={`t${r.label}`}
            d={r.d}
            fill="none"
            stroke={SUN}
            strokeOpacity=".4"
            strokeWidth="1.2"
          />
        ) : null,
      )}

      {active && (
        <g key={step}>
          <path
            d={active.d}
            pathLength={1}
            fill="none"
            stroke={SUN}
            strokeWidth="1.6"
            className="route-on"
          />
          <circle r="4" fill={SUN}>
            <animateMotion
              ref={(el) => (el as SVGAnimationElement | null)?.beginElement()}
              begin="indefinite"
              dur="1.1s"
              fill="freeze"
              path={active.d}
              keyPoints="0;1"
              keyTimes="0;1"
              calcMode="spline"
              keySplines="0.6 0 0.3 1"
            />
          </circle>
          <Arrowhead x={active.end[0]} y={active.end[1]} dir={active.dir} color={SUN} />
        </g>
      )}

      {routes.map((r, i) => (
        <text
          key={`l${r.label}`}
          x={r.lx}
          y={r.ly}
          fontSize="11"
          fontFamily="var(--font-geist-mono)"
          fill={i === step ? SUN : CREAM}
          fillOpacity={i === step ? 1 : 0.38}
          style={{ transition: "fill .4s, fill-opacity .4s" }}
        >
          {r.label}
        </text>
      ))}

      {routes.map((r) => {
        const m = /^M([\d.]+) ([\d.]+)/.exec(r.d)!;
        return (
          <rect
            key={`p${r.label}`}
            x={+m[1] - 3.5}
            y={+m[2] - 3.5}
            width="7"
            height="7"
            fill={CREAM}
            fillOpacity=".55"
          />
        );
      })}

      {nodes.map((n) => {
        const on = active?.to === n.id;
        const seen = lit.has(n.id);
        return (
          <g key={n.id} style={{ transition: "all .4s" }}>
            <rect
              x={n.x}
              y={n.y}
              width={W}
              height={H}
              fill={on ? SUN : CREAM}
              fillOpacity={on ? 1 : seen ? 0.1 : 0.05}
              stroke={on ? SUN : CREAM}
              strokeOpacity={on ? 1 : seen ? 0.55 : 0.28}
              style={{ transition: "fill .4s, fill-opacity .4s, stroke-opacity .4s" }}
            />
            <text
              x={n.x + W / 2}
              y={n.y + 26}
              textAnchor="middle"
              fontSize="14"
              fill={on ? "#252324" : CREAM}
              style={{ transition: "fill .4s" }}
            >
              {n.name}
            </text>
            <text
              x={n.x + W / 2}
              y={n.y + 44}
              textAnchor="middle"
              fontSize="11"
              fontFamily="var(--font-geist-mono)"
              fill={on ? "#252324" : CREAM}
              fillOpacity={on ? 0.7 : 0.45}
            >
              {n.sub}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
