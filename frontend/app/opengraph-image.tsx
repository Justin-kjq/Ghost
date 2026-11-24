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
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <svg width="48" height="50" viewBox="0 0 19 20" fill="none">
            <path
              d="M2 9a7.5 7.5 0 0115 0v10.5l-2.5-2.2-2.5 2.2-2.5-2.2-2.5 2.2L4.5 17.3 2 19.5z"
              fill="#161412"
            />
            <rect x="6" y="7.5" width="2.4" height="4" rx="1.2" fill="#F7F4EF" />
            <rect x="10.6" y="7.5" width="2.4" height="4" rx="1.2" fill="#F7F4EF" />
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
            The fee that doesn&apos;t dox you.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
