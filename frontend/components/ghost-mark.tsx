import { cn } from "@/lib/utils";

/** Geometric keyhole-arch mark. Reads at 16px. */
export function GhostMark({
  className,
  title = "Ghost",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-7 shrink-0", className)}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" />
      <path
        d="M16 8.2c-3.7 0-6.3 2.8-6.3 6.4 0 2.5 1.35 4.35 3.35 6.45L16 24.6l2.95-3.55c2-2.1 3.35-3.95 3.35-6.45 0-3.6-2.6-6.4-6.3-6.4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function GhostWordmark({
  className,
  markClassName,
  inverted = false,
}: {
  className?: string;
  markClassName?: string;
  inverted?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 text-foreground",
        inverted && "text-login-text",
        className,
      )}
    >
      <GhostMark className={cn("size-7", markClassName)} />
      <span className="font-serif text-[1.35rem] leading-none tracking-tight">Ghost</span>
    </span>
  );
}
