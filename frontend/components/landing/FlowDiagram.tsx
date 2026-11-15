"use client";

import { useEffect, useRef, useState } from "react";

/*
  Ghost's money flow as a route map: boxes joined by dashed elbows, with one
  route at a time lighting up and carrying a packet to the next box.
*/

const W = 124;
const H = 58;
const R = 14;

type Node = { id: string; x: number; y: number; name: string; sub: string };

const nodes: Node[] = [
  { id: "a", x: 30, y: 40, name: "USDC", sub: "wallet A" },
  { id: "b", x: 170, y: 150, name: "GhostPool", sub: "commitment" },
  { id: "c", x: 330, y: 290, name: "Groth16", sub: "in browser" },
  { id: "d", x: 500, y: 380, name: "API", sub: "POST /withdraw" },
  { id: "e", x: 660, y: 240, name: "Relayer", sub: "fronts SOL" },
  { id: "f", x: 800, y: 110, name: "Fresh wallet", sub: "0 SOL" },
  { id: "g", x: 940, y: 8, name: "Recipient", sub: "0.997 USDC" },
  { id: "h", x: 820, y: 400, name: "USDC fee", sub: "settled 0.003" },
];
const at = (id: string) => nodes.find((n) => n.id === id)!;

// down from a bottom port, round the corner, run right into a left port
const v = (x1: number, y1: number, x2: number, y2: number) =>
  `M${x1} ${y1}V${y2 - R}Q${x1} ${y2} ${x1 + R} ${y2}H${x2}`;
// right from a right port, round the corner, run up into a bottom port
const hv = (x1: number, y1: number, x2: number, y2: number) =>
  `M${x1} ${y1}H${x2 - R}Q${x2} ${y1} ${x2} ${y1 - R}V${y2}`;

type Route = { from: string; to: string; d: string; label: string; lx: number; ly: number; end: [number, number]; dir: "r" | "u" };

const routes: Route[] = (() => {
  const A = at("a"), B = at("b"), C = at("c"), D = at("d"), E = at("e"), F = at("f"), G = at("g"), Hh = at("h");
  return [
    { from: "a", to: "b", d: v(A.x + 30, A.y + H, B.x, B.y + H / 2), label: "deposit()", lx: A.x + 40, ly: B.y + H / 2 - 10, end: [B.x, B.y + H / 2], dir: "r" },
    { from: "b", to: "c", d: v(B.x + 30, B.y + H, C.x, C.y + H / 2), label: "merkle path", lx: B.x + 40, ly: C.y + H / 2 - 10, end: [C.x, C.y + H / 2], dir: "r" },
    { from: "c", to: "d", d: v(C.x + 30, C.y + H, D.x, D.y + H / 2), label: "proof + note", lx: C.x + 40, ly: D.y + H / 2 - 10, end: [D.x, D.y + H / 2], dir: "r" },
    { from: "d", to: "e", d: hv(D.x + W, D.y + H / 2, E.x + 30, E.y + H), label: "verify ZK", lx: D.x + W + 8, ly: D.y + H / 2 - 10, end: [E.x + 30, E.y + H], dir: "u" },
    { from: "e", to: "f", d: hv(E.x + W, E.y + H / 2, F.x + 40, F.y + H), label: "withdraw()", lx: E.x + W + 6, ly: E.y + H / 2 + 22, end: [F.x + 40, F.y + H], dir: "u" },
    { from: "f", to: "g", d: hv(F.x + W, F.y + H / 2, G.x + 30, G.y + H), label: "transfer", lx: F.x + W + 4, ly: F.y + H / 2 + 22, end: [G.x + 30, G.y + H], dir: "u" },
    { from: "e", to: "h", d: v(E.x + 94, E.y + H, Hh.x, Hh.y + H / 2), label: "fee skim", lx: E.x + 104, ly: Hh.y + H / 2 - 10, end: [Hh.x, Hh.y + H / 2], dir: "r" },
  ];
})();

const CREAM = "#fefbf6";
const SUN = "#ffec88";

function Arrowhead({ x, y, dir, color }: { x: number; y: number; dir: "r" | "u"; color: string }) {
  const d = dir === "r" ? `M${x - 7} ${y - 5}L${x - 1} ${y}L${x - 7} ${y + 5}` : `M${x - 5} ${y + 7}L${x} ${y + 1}L${x + 5} ${y + 7}`;
  return <path d={d} fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />;
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
    const id = setInterval(() => setStep((s) => (s + 1 > routes.length ? -1 : s + 1)), 1500);
    return () => clearInterval(id);
  }, [visible, reduced]);

  // with reduced motion, show the whole route map travelled and still
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
      aria-label="Ghost's flow: wallet A deposits USDC into GhostPool; a Groth16 proof built in the browser goes to the relayer; the relayer verifies it and fronts SOL; a fresh wallet holding zero SOL receives USDC; the fee is settled in USDC."
    >
      {/* idle routes */}
      {routes.map((r) => (
        <g key={r.label}>
          <path d={r.d} fill="none" stroke={CREAM} strokeOpacity=".32" strokeWidth="1.2" strokeDasharray="2 5" strokeLinecap="round" />
          <Arrowhead x={r.end[0]} y={r.end[1]} dir={r.dir} color="rgba(254,251,246,.4)" />
        </g>
      ))}

      {/* routes already travelled this cycle */}
      {routes.map((r, i) =>
        i < step ? <path key={`t${r.label}`} d={r.d} fill="none" stroke={SUN} strokeOpacity=".4" strokeWidth="1.2" /> : null,
      )}

      {/* the live route */}
      {active && (
        <g key={step}>
          <path d={active.d} pathLength={1} fill="none" stroke={SUN} strokeWidth="1.6" className="route-on" />
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

      {/* route labels */}
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

      {/* source ports */}
      {routes.map((r) => {
        const m = /^M([\d.]+) ([\d.]+)/.exec(r.d)!;
        return <rect key={`p${r.label}`} x={+m[1] - 3.5} y={+m[2] - 3.5} width="7" height="7" fill={CREAM} fillOpacity=".55" />;
      })}

      {/* boxes */}
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
            <text x={n.x + W / 2} y={n.y + 26} textAnchor="middle" fontSize="14" fill={on ? "#252324" : CREAM} style={{ transition: "fill .4s" }}>
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
