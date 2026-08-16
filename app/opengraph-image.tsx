import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt =
  "PPC Keyword Utilities Suite - free browser-based keyword tools for Google Ads";

const MATCH_TYPES = [
  { label: "Broad", example: "running shoes", color: "#4b5567" },
  { label: "Phrase", example: '"running shoes"', color: "#0e6e5c" },
  { label: "Exact", example: "[running shoes]", color: "#7a3fc2" },
  { label: "BMM", example: "+running +shoes", color: "#8a6600" },
];

/**
 * Social card. Satori (which renders this) supports only a subset of CSS -
 * every element with more than one child needs an explicit `display: flex`,
 * and layout has to be flexbox rather than grid.
 */
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
          background: "#f7f8fa",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 52,
                height: 52,
                borderRadius: 14,
                background: "#0e6e5c",
                color: "#f7f8fa",
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: -1,
              }}
            >
              [P]
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 24,
                fontWeight: 700,
                color: "#14181f",
                letterSpacing: -0.4,
              }}
            >
              PPC Keyword Utilities Suite
            </div>
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 48,
              fontSize: 68,
              fontWeight: 800,
              color: "#14181f",
              letterSpacing: -2.5,
              lineHeight: 1.05,
            }}
          >
            Paste a list.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 68,
              fontWeight: 800,
              color: "#0e6e5c",
              letterSpacing: -2.5,
              lineHeight: 1.05,
            }}
          >
            Get Ads-Editor-ready output.
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 28,
              fontSize: 26,
              color: "#4b5567",
              lineHeight: 1.4,
            }}
          >
            Match-type formatting, list merging, and negative-keyword mining -
            free, no login.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: 12 }}>
            {MATCH_TYPES.map((type) => (
              <div
                key={type.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  padding: "16px 20px",
                  borderRadius: 16,
                  background: "#ffffff",
                  border: "1px solid #dde1e7",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: 10 }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      background: type.color,
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      fontSize: 17,
                      fontWeight: 600,
                      color: "#14181f",
                    }}
                  >
                    {type.label}
                  </div>
                </div>
                <div
                  style={{ display: "flex", fontSize: 16, color: "#65707d" }}
                >
                  {type.example}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 22px",
              borderRadius: 999,
              background: "#e4f3ef",
              color: "#0a5346",
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            Runs entirely in your browser
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
