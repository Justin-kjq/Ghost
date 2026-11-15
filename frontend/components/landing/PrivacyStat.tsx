"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "./Schematics";

/*
  Privacy card: one big number and a crowd of dots.
  The pool holds up to 1,024 deposits (a depth-10 tree). As the counter climbs,
  the dots fill in, so "more deposits, better cover" reads at a glance.
*/

const TOTAL = 1024;
const COLS = 64;
const ROWS = TOTAL / COLS; // 16
const MINE = 9 * COLS + 41; // your deposit, somewhere in the crowd
const GAP = 6;

export function PrivacyStat() {
  const ref = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          setReduced(true);
          return;
        }
        const start = performance.now();
        const tick = (t: number) => {
          // rAF's timestamp can land a hair before `start`, so clamp at 0
          const p = Math.min(Math.max((t - start) / 2400, 0), 1);
          // ease out, so the last deposits land slowly
          setCount(Math.round(TOTAL * (1 - Math.pow(1 - p, 3))));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  const shown = reduced ? TOTAL : count;
  const mx = (MINE % COLS) * GAP + 3;
  const my = Math.floor(MINE / COLS) * GAP + 3;

  return (
    <Card
      code="01"
      title="Hiding in a crowd"
      specs={[["Pool holds", "1,024 deposits"], ["Who paid whom", "Hidden"], ["Your cover", "Grows with use"]]}
      bodyClass="md:aspect-[440/300]"
    >
      <div ref={ref} className="flex flex-col justify-between gap-6 p-6 md:absolute md:inset-0 md:p-7">
        <p className="text-[10px] uppercase tracking-[0.1em] text-cream/50">Chance anyone guesses which deposit is yours</p>

        <div>
          <p className="flex items-baseline gap-3 leading-none tracking-[-0.04em]" aria-label="1 in 1,024">
            <span className="text-[clamp(28px,3vw,40px)] text-cream/55">1 in</span>
            <span className="text-[clamp(56px,6vw,84px)] tabular-nums text-cream">{shown.toLocaleString("en-US")}</span>
          </p>
          <p className="mt-3 max-w-[340px] text-[13px] leading-[1.45] text-cream/70">
            in a full pool. Every deposit added makes the guess harder, so the more people use Ghost, the better everyone hides.
          </p>
        </div>

        {/* one dot per possible deposit */}
        <svg viewBox={`0 0 ${COLS * GAP} ${ROWS * GAP + 18}`} className="w-full" aria-hidden="true">
          {Array.from({ length: TOTAL }, (_, i) => {
            const x = (i % COLS) * GAP + 3;
            const y = Math.floor(i / COLS) * GAP + 3;
            const on = i < shown;
            return i === MINE ? null : (
              <circle key={i} cx={x} cy={y} r="1.5" fill="#fefbf6" fillOpacity={on ? 0.55 : 0.1} />
            );
          })}
          {/* yours: only you know which */}
          <circle cx={mx} cy={my} r="2.2" fill="#ffec88" />
          <circle cx={mx} cy={my} r="4.6" fill="none" stroke="#ffec88" strokeWidth=".8" className="pulse" />
          <text x={mx + 8} y={ROWS * GAP + 14} fontSize="10" fill="#ffec88">
            yours · only you know which
          </text>
          <path d={`M${mx} ${my + 5}V${ROWS * GAP + 10.5}H${mx + 5}`} fill="none" stroke="#ffec88" strokeWidth=".7" />
        </svg>
      </div>
    </Card>
  );
}
