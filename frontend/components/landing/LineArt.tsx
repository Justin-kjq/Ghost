// Blueprint-style line art. Every stroked element carries pathLength=1 so the
// `.draw` class can trace it in when its Reveal wrapper scrolls into view.
//
// Note: no `vectorEffect: non-scaling-stroke` here. Combined with pathLength it
// breaks dash normalisation in Chromium, which left shapes half-drawn (circles
// rendered as "C", frames missing sides).

const L = { pathLength: 1 };

/* ───────── the system "cabinet" drawing for How it works ───────── */

export const parts = [
  { n: 1, name: "Gas note", where: "prepaid credit voucher" },
  { n: 2, name: "X1 top-up", where: "USDC into Ghost treasury" },
  { n: 3, name: "Relayer", where: "sponsors the send for you" },
  { n: 4, name: "Network gateway", where: "standard Solana entry" },
  { n: 5, name: "Gas sponsor", where: "pays the Solana network fee" },
  { n: 6, name: "Credit ledger", where: "debits the note per send" },
  { n: 7, name: "X2 signer", where: "can hold 0 SOL" },
  { n: 8, name: "Ghost treasury", where: "holds prepaid USDC" },
  { n: 9, name: "Token transfer", where: "you sign, Ghost pays gas" },
];

// [x, y, w, h] for each part, in a 520 × 640 cabinet
const boxes: Record<number, [number, number, number, number]> = {
  1: [60, 72, 150, 70],
  2: [230, 72, 230, 70],
  3: [60, 200, 400, 56],
  4: [60, 300, 400, 56],
  5: [60, 400, 190, 80],
  6: [270, 400, 190, 80],
  7: [60, 520, 116, 70],
  8: [190, 520, 120, 70],
  9: [324, 520, 136, 70],
};

function Terminals({ x, y, w }: { x: number; y: number; w: number }) {
  const n = Math.max(2, Math.floor(w / 26));
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <circle key={i} {...L} cx={x + 14 + i * ((w - 28) / (n - 1))} cy={y + 12} r="4" />
      ))}
    </>
  );
}

export function Cabinet({ active }: { active: number | null }) {
  const ink = "#252324";
  return (
    <svg viewBox="0 0 520 640" className="draw h-full w-full" fill="none" stroke={ink} strokeWidth="1.1">
      {/* enclosure */}
      <rect {...L} x="20" y="20" width="480" height="600" />
      <rect {...L} x="34" y="34" width="452" height="572" strokeOpacity=".4" />
      {/* DIN rails between rows */}
      {[176, 280, 380, 500].map((y) => (
        <g key={y}>
          <rect {...L} x="44" y={y} width="432" height="8" strokeOpacity=".5" />
          {Array.from({ length: 18 }, (_, i) => (
            <path key={i} {...L} d={`M${56 + i * 24} ${y + 2}v4`} strokeOpacity=".35" />
          ))}
        </g>
      ))}
      {/* row labels sit in the gap above each rail, clear of the rail itself */}
      {[
        [56, "ON YOUR DEVICE"],
        [170, "SENDING"],
        [374, "CHECKING"],
        [494, "PAYING OUT"],
      ].map(([y, t]) => (
        <text key={t} x="476" y={y as number} textAnchor="end" fill={ink} fillOpacity=".45" stroke="none" fontSize="10" fontFamily="var(--font-geist-mono)">
          {t}
        </text>
      ))}
      {parts.map((p) => {
        const [x, y, w, h] = boxes[p.n];
        const on = active === p.n;
        return (
          <g key={p.n} style={{ transition: "opacity .3s" }} opacity={active && !on ? 0.45 : 1}>
            <rect {...L} x={x} y={y} width={w} height={h} fill={on ? "#ffec88" : "transparent"} style={{ transition: "fill .3s" }} />
            <Terminals x={x} y={y} w={w} />
            <path {...L} d={`M${x} ${y + 24}H${x + w}`} strokeOpacity=".35" />
            <text x={x + 10} y={y + h - 12} fill={ink} stroke="none" fontSize="12">
              {p.name}
            </text>
            <text x={x + w - 8} y={y + h - 12} textAnchor="end" fill={ink} fillOpacity=".5" stroke="none" fontSize="10" fontFamily="var(--font-geist-mono)">
              {p.n}
            </text>
          </g>
        );
      })}
      {/* wiring between rows */}
      <path {...L} d="M135 142V200M345 142V200M260 256V300M155 356V400M365 356V400M120 480V520M275 480V520" data-dots="" strokeOpacity=".6" />
    </svg>
  );
}

/* ───────── receipt art for the quote ───────── */

export function ReceiptArt() {
  const rows: [string, string][] = [
    ["FROM", "NEW WALLET"],
    ["TO", "RECIPIENT"],
    ["AMOUNT", "1 USDC"],
    ["GAS PAID BY", "GHOST"],
    ["FEE", "~0.003 USDC"],
    ["STATUS", "CONFIRMED"],
  ];
  const mono = { fill: "#fefbf6", stroke: "none", fontSize: 13, fontFamily: "var(--font-geist-mono)" } as const;
  return (
    <div className="grid-paper relative h-full w-full bg-night [--gs:34px]">
      <svg viewBox="0 0 1360 640" preserveAspectRatio="xMidYMid slice" className="draw absolute inset-0 h-full w-full" fill="none" stroke="#fefbf6" strokeOpacity=".55" strokeWidth="1.2">
        <rect {...L} x="120" y="90" width="460" height="460" strokeOpacity=".25" />
        <rect {...L} x="200" y="150" width="300" height="360" />
        <text x="230" y="182" {...mono} fillOpacity=".75" fontSize="14">
          RELAY RECEIPT · TX 0x2910…b4c7
        </text>
        <path {...L} d="M230 198H470" strokeOpacity=".3" />
        {/* real rows instead of blank lines */}
        {rows.map(([k, v], i) => (
          <g key={k}>
            <text x="230" y={232 + i * 34} {...mono} fillOpacity=".45">
              {k}
            </text>
            <text x="470" y={232 + i * 34} textAnchor="end" {...mono} fillOpacity=".85">
              {v}
            </text>
            <path {...L} d={`M230 ${244 + i * 34}H470`} strokeOpacity=".12" />
          </g>
        ))}
        <text x="230" y="452" fill="#b9a46a" stroke="none" fontSize="14" fontFamily="var(--font-geist-mono)">
          FROM SENDER: 0 SOL
        </text>
        <path {...L} d="M200 470l25 20 25-20 25 20 25-20 25 20 25-20 25 20 25-20 25 20 25-20 25 20 25-20" stroke="#b9a46a" strokeOpacity="1" />
        <path {...L} d="M580 320H700M700 320l-8-6M700 320l-8 6" strokeOpacity=".4" />
      </svg>
    </div>
  );
}

/* ───────── slide tile for the on-chain proof slider ───────── */

export function CaseTile({ label, caption, kind }: { label: string; caption: string; kind: number }) {
  return (
    <div className="grid-paper relative aspect-[4/3.4] w-full bg-night [--gs:44px]">
      <svg viewBox="0 0 540 460" className="draw-now absolute inset-0 h-full w-full" fill="none" stroke="#fefbf6" strokeOpacity=".4" strokeWidth="1.1">
        <rect {...L} x="130" y="140" width="280" height="250" stroke="#b9a46a" strokeOpacity="1" />
        {[
          [130, 140],
          [410, 140],
          [130, 390],
          [410, 390],
        ].map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r="4" stroke="#b9a46a" strokeOpacity="1" fill="#252324" />
        ))}
        <text x="130" y="122" fill="#fefbf6" fillOpacity=".45" stroke="none" fontSize="10" fontFamily="var(--font-geist-mono)">
          {`REF-${String(kind + 1).padStart(2, "0")}`}
        </text>
        <text x="410" y="122" textAnchor="end" fill="#fefbf6" fillOpacity=".45" stroke="none" fontSize="10" fontFamily="var(--font-geist-mono)">
          SOLANA
        </text>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-[6%] text-center">
        <span className="text-[34px] font-semibold tracking-[-0.03em] text-cream">{label}</span>
        <span className="mt-2 font-mono text-[11px] uppercase tracking-[0.08em] text-cream/50">{caption}</span>
      </div>
    </div>
  );
}
