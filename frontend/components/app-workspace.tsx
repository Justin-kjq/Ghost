import type { ReactNode } from "react";

/**
 * Product workspace: wide primary column + optional context rail.
 * Replaces the old centered “console dump” max-width stack.
 */
export function AppWorkspace({
  title,
  description,
  actions,
  children,
  rail,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  rail?: ReactNode;
}) {
  return (
    <div className="app-workspace mx-auto w-full max-w-[1120px]">
      <header className="flex flex-col gap-4 border-b border-ink/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 max-w-[54ch]">
          <h1 className="text-[32px] leading-[1.1] tracking-[-0.04em] text-ink sm:text-[40px]">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 text-[15px] font-normal leading-relaxed text-ink/60">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </header>

      <div
        className={
          rail
            ? "mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start xl:grid-cols-[minmax(0,1fr)_320px]"
            : "mt-8"
        }
      >
        <div className="min-w-0 space-y-6">{children}</div>
        {rail ? (
          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">{rail}</aside>
        ) : null}
      </div>
    </div>
  );
}

export function WorkspacePanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`border border-ink/12 bg-paper px-5 py-6 sm:px-7 sm:py-7 ${className}`}
    >
      {children}
    </section>
  );
}

export function RailBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border border-ink/12 bg-paper px-4 py-4">
      <h2 className="text-[13px] font-medium tracking-[-0.02em] text-ink/70">
        {title}
      </h2>
      <div className="mt-3 text-[13px] font-normal leading-relaxed text-ink/60">
        {children}
      </div>
    </section>
  );
}

export function StatusPill({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "ok" | "warn" | "off";
  children: ReactNode;
}) {
  const toneClass =
    tone === "ok"
      ? "border-ink/20 bg-sun/50 text-ink"
      : tone === "warn"
        ? "border-ink/20 bg-sand text-ink"
        : tone === "off"
          ? "border-ink/15 bg-cream text-ink/45"
          : "border-ink/15 bg-cream text-ink/70";
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[12px] ${toneClass}`}
    >
      <span
        className={`size-1.5 shrink-0 ${
          tone === "ok"
            ? "bg-ink"
            : tone === "warn"
              ? "bg-ink/50"
              : tone === "off"
                ? "bg-ink/25"
                : "bg-ink/40"
        }`}
        aria-hidden
      />
      {children}
    </span>
  );
}

export function formatUsdcRaw(raw: string | undefined | null): string {
  if (raw == null || raw === "" || raw === "?") return "—";
  const n = Number(raw);
  if (!Number.isFinite(n)) return "—";
  return (n / 1_000_000).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}
