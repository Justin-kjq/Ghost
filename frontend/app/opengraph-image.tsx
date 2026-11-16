import { ImageResponse } from "next/og";

export const alt = "Ghost: private USDC on Solana";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#F7F4EF",
          color: "#161412",
          padding: "64px 72px",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="56" height="56" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke="#161412" strokeWidth="2" />
            <path
              d="M16 8.2c-3.7 0-6.3 2.8-6.3 6.4 0 2.5 1.35 4.35 3.35 6.45L16 24.6l2.95-3.55c2-2.1 3.35-3.95 3.35-6.45 0-3.6-2.6-6.4-6.3-6.4Z"
              stroke="#161412"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
          <div style={{ fontSize: 36, letterSpacing: "-0.02em" }}>Ghost</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 72,
              lineHeight: 1.04,
              letterSpacing: "-0.03em",
              maxWidth: 820,
            }}
          >
            Privacy is not a feature. It&apos;s a right.
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 22,
              fontFamily: "ui-sans-serif, system-ui",
              color: "#5A544E",
            }}
          >
            Shielded USDC on Solana.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
