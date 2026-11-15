// Two engineering-drawing "figures" for the Privacy section.
// FIG. 01: the commitment tree, with your Merkle path lit from leaf to root.
// FIG. 02: the proof, private inputs in, a circuit, π out, verified on-chain.

import type { ReactNode } from "react";

const CREAM = "#fefbf6";
const GOLD = "#d6bf7a";
const MONO = "var(--font-geist-mono)";

/* ───────── shared card chrome ───────── */

function FigCard({
  fig,
  title,
  meta,
  children,
}: {
  fig: string;
  title: string;
  meta: [string, string][];
  children: ReactNode;
}) {
  return (
    <figure className="flex h-full flex-col border border-cream/10 bg-night text-cream">
      <figcaption className="flex items-center justify-between border-b border-cream/10 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.08em] text-cream/55">
        <span className="flex items-center gap-2">
          <span className="h-[6px] w-[6px] bg-sun" />
          {fig}
        </span>
        <span>{title}</span>
      </figcaption>
      <div className="grid-paper relative flex-1 [--gp:rgba(254,251,246,.06)] [--gs:24px]">{children}</div>
      <dl className="grid grid-cols-3 border-t border-cream/10 font-mono text-[10px] uppercase tracking-[0.06em]">
        {meta.map(([k, v]) => (
          <div key={k} className="border-l border-cream/10 px-4 py-3 first:border-0">
            <dt className="text-cream/40">{k}</dt>
            <dd className="mt-1 text-cream/85">{v}</dd>
          </div>
        ))}
      </dl>
    </figure>
  );
}

const Label = ({ x, y, children, anchor = "start", gold = false, size = 9 }: { x: number; y: number; children: ReactNode; anchor?: "start" | "middle" | "end"; gold?: boolean; size?: number }) => (
  <text x={x} y={y} textAnchor={anchor} fontSize={size} fontFamily={MONO} letterSpacing=".04em" fill={gold ? GOLD : CREAM} fillOpacity={gold ? 1 : 0.55}>
    {children}
  </text>
);

/* ───────── FIG. 01: commitment tree ───────── */

export function FigTree() {
  // node centres per level, root first
  const levels = [[180], [100, 260], [60, 140, 220, 300], [40, 80, 120, 160, 200, 240, 280, 320]];
  const ys = [70, 140, 210, 280];
  const path = [5, 2, 1, 0]; // index on each level, leaf → root, for leaf c5
  const onPath = (lvl: number, i: number) => path[3 - lvl] === i;
  // the sibling of each path node is a "path element"
  const isSibling = (lvl: number, i: number) => lvl > 0 && (path[3 - lvl] ^ 1) === i;

  const edges: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let l = 1; l < levels.length; l++)
    levels[l].forEach((x, i) => {
      const px = levels[l - 1][i >> 1];
      edges.push({ x1: px, y1: ys[l - 1], x2: x, y2: ys[l] });
    });

  const goldPath = `M${levels[3][5]} ${ys[3] - 9}V${(ys[2] + ys[3]) / 2}H${levels[2][2]}V${ys[2] - 9}M${levels[2][2]} ${ys[2] - 9}V${(ys[1] + ys[2]) / 2}H${levels[1][1]}V${ys[1] - 9}M${levels[1][1]} ${ys[1] - 9}V${(ys[0] + ys[1]) / 2}H${levels[0][0]}V${ys[0] - 12}`;

  return (
    <FigCard fig="Fig. 01" title="Commitment tree" meta={[["Hash", "Poseidon T3"], ["Depth", "10 levels"], ["Leaves", "1,024"]]}>
      <svg viewBox="0 0 360 360" className="absolute inset-0 h-full w-full" role="img" aria-label="A Merkle tree of deposit commitments. The path from your leaf to the root is highlighted; the sibling hashes along it are the path elements your proof uses.">
        {/* elbow edges */}
        {edges.map((e, i) => {
          const my = (e.y1 + e.y2) / 2;
          return <path key={i} d={`M${e.x1} ${e.y1 + 9}V${my}H${e.x2}V${e.y2 - 9}`} fill="none" stroke={CREAM} strokeOpacity=".28" strokeWidth="1" />;
        })}

        {/* the live merkle path, marching from leaf to root */}
        <path d={goldPath} fill="none" stroke={GOLD} strokeWidth="1.6" className="march" />

        {/* nodes */}
        {levels.map((row, l) =>
          row.map((x, i) => {
            const root = l === 0;
            const size = root ? 24 : l === 3 ? 16 : 18;
            const gold = onPath(l, i);
            const sib = isSibling(l, i);
            return (
              <g key={`${l}-${i}`}>
                <rect
                  x={x - size / 2}
                  y={ys[l] - size / 2}
                  width={size}
                  height={size}
                  fill={gold ? GOLD : "#252324"}
                  fillOpacity={gold ? (root ? 1 : 0.18) : 1}
                  stroke={gold || sib ? GOLD : CREAM}
                  strokeOpacity={gold || sib ? 1 : 0.5}
                  strokeDasharray={sib ? "2 2" : undefined}
                  strokeWidth="1"
                  className={root ? "pulse" : undefined}
                />
                {l === 3 && (
                  <Label x={x} y={ys[l] + 22} anchor="middle" gold={gold}>
                    c{i}
                  </Label>
                )}
              </g>
            );
          }),
        )}

        {/* annotations with leader lines */}
        <path d="M194 70H236" stroke={GOLD} strokeWidth="1" />
        <Label x={240} y={67} gold>
          ROOT
        </Label>
        <Label x={240} y={79}>
          stored on-chain
        </Label>

        <path d="M240 307V314H346V320" stroke={GOLD} strokeWidth="1" fill="none" />
        <Label x={346} y={331} anchor="end" gold>
          YOUR DEPOSIT
        </Label>
        <Label x={346} y={343} anchor="end">
          Poseidon(secret, nullifier)
        </Label>

        <path d="M200 307V314H14V328H20" stroke={CREAM} strokeOpacity=".4" strokeWidth="1" fill="none" strokeDasharray="2 2" />
        <Label x={24} y={331}>
          sibling hashes
        </Label>
        <Label x={24} y={343}>
          = pathElements
        </Label>

        {/* legend */}
        <g transform="translate(20 22)">
          <path d="M0 0H18" stroke={GOLD} strokeWidth="1.6" />
          <Label x={24} y={3}>
            merkle path
          </Label>
          <rect x="104" y="-5" width="10" height="10" fill="none" stroke={GOLD} strokeDasharray="2 2" />
          <Label x={120} y={3}>
            path element
          </Label>
        </g>
      </svg>
    </FigCard>
  );
}

/* ───────── FIG. 02: the proof ───────── */

export function FigProof() {
  return (
    <FigCard fig="Fig. 02" title="Groth16 proof" meta={[["Curve", "BN128"], ["Proving", "~5 s"], ["Verify", "~800k gas"]]}>
      <svg viewBox="0 0 360 360" className="absolute inset-0 h-full w-full" role="img" aria-label="Private inputs (secret, nullifier, path) and public inputs (root, nullifier hash, recipient) enter the merkle_proof circuit in the browser. It outputs a proof π, which the Groth16Verifier checks on-chain.">
        {/* browser boundary */}
        <rect x="14" y="14" width="332" height="214" fill="none" stroke={CREAM} strokeOpacity=".22" strokeDasharray="4 4" />
        <Label x={22} y={30}>
          YOUR BROWSER
        </Label>

        {/* inputs */}
        {[
          { x: 28, title: "PRIVATE", rows: ["secret", "nullifier", "path[10]"], gold: true },
          { x: 192, title: "PUBLIC", rows: ["root", "nullifierHash", "recipient"], gold: false },
        ].map((b) => (
          <g key={b.title}>
            <rect x={b.x} y="42" width="140" height="74" fill="#252324" stroke={b.gold ? GOLD : CREAM} strokeOpacity={b.gold ? 1 : 0.5} />
            <path d={`M${b.x} 58H${b.x + 140}`} stroke={b.gold ? GOLD : CREAM} strokeOpacity={b.gold ? 0.5 : 0.25} />
            <Label x={b.x + 8} y={53} gold={b.gold}>
              {b.title}
            </Label>
            {b.gold && (
              <g transform={`translate(${b.x + 124} 46)`} fill="none" stroke={GOLD} strokeWidth="1">
                <path d="M2 4V3a3 3 0 016 0v1" />
                <rect x="0.5" y="4" width="9" height="6" />
              </g>
            )}
            {b.rows.map((r, i) => (
              <g key={r}>
                <Label x={b.x + 8} y={74 + i * 15}>
                  {r}
                </Label>
                <text x={b.x + 132} y={74 + i * 15} textAnchor="end" fontSize="9" fontFamily={MONO} fill={CREAM} fillOpacity=".8">
                  {b.gold ? "••••••" : "0x…"}
                </text>
              </g>
            ))}
          </g>
        ))}

        {/* wires into the circuit */}
        <path d="M98 116V136H160V150" fill="none" stroke={GOLD} strokeOpacity=".7" />
        <path d="M262 116V136H200V150" fill="none" stroke={CREAM} strokeOpacity=".4" />
        <circle r="2.5" fill={GOLD}>
          <animateMotion dur="2.4s" repeatCount="indefinite" path="M98 116V136H160V150" />
        </circle>
        <circle r="2.5" fill={CREAM}>
          <animateMotion dur="2.4s" begin="1.2s" repeatCount="indefinite" path="M262 116V136H200V150" />
        </circle>

        {/* circuit */}
        <rect x="70" y="150" width="220" height="62" fill="#252324" stroke={CREAM} strokeOpacity=".6" />
        <Label x={80} y={164}>
          merkle_proof.circom
        </Label>
        {Array.from({ length: 10 }, (_, i) => (
          <rect key={i} x={82 + i * 20} y="172" width="14" height="14" fill="none" stroke={CREAM} strokeOpacity=".35" className="gate" style={{ animationDelay: `${i * 0.18}s` }} />
        ))}
        {/* proving progress */}
        <rect x="82" y="196" width="196" height="4" fill={CREAM} fillOpacity=".1" />
        <rect x="82" y="196" width="196" height="4" fill={GOLD} className="prove-bar" />

        {/* out of the browser: π to the chain */}
        <path d="M180 212V252" stroke={GOLD} strokeWidth="1.2" />
        <circle r="2.5" fill={GOLD}>
          <animateMotion dur="2.4s" begin=".6s" repeatCount="indefinite" path="M180 212V300" />
        </circle>

        <rect x="120" y="252" width="120" height="28" fill="#252324" stroke={GOLD} />
        <text x="180" y="270" textAnchor="middle" fontSize="11" fontFamily={MONO} fill={GOLD}>
          π = (A, B, C)
        </text>
        <path d="M180 280V300" stroke={GOLD} strokeWidth="1.2" />

        <rect x="96" y="300" width="168" height="36" fill={GOLD} />
        <path d="M110 318l5 5 10-10" fill="none" stroke="#252324" strokeWidth="1.6" />
        <text x="134" y="322" fontSize="11" fontFamily={MONO} fill="#252324">
          Groth16Verifier
        </text>

        <path d="M264 318H292" stroke={CREAM} strokeOpacity=".4" />
        <Label x={296} y={315}>
          ON-CHAIN
        </Label>
        <Label x={296} y={327}>
          SOLANA
        </Label>
      </svg>
    </FigCard>
  );
}
