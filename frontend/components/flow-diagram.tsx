export function FlowDiagram() {
  const steps = [
    { n: "01", t: "Deposit", d: "1 USDC into the vault" },
    { n: "02", t: "Merkle tree", d: "Leaf written on-chain" },
    { n: "03", t: "Proof", d: "Groth16 in the browser" },
    { n: "04", t: "Relayer", d: "Pays Solana fees" },
    { n: "05", t: "Fresh address", d: "0.997 USDC, 0 SOL" },
  ];
  return (
    <div className="mt-12">
      <svg
        viewBox="0 0 1000 8"
        className="mb-8 hidden h-2 w-full text-stone md:block"
        aria-hidden
      >
        <line x1="40" y1="4" x2="960" y2="4" stroke="currentColor" strokeWidth="1" />
      </svg>
      <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
        {steps.map((s) => (
          <li key={s.n} className="border-t border-hairline pt-4">
            <p className="font-mono text-[11px] tracking-[0.16em] text-gold">{s.n}</p>
            <p className="mt-2 font-serif text-2xl">{s.t}</p>
            <p className="mt-2 max-w-[28ch] text-[15px] leading-relaxed text-muted-foreground">
              {s.d}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
