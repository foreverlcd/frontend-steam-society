import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

const size = { width: 1200, height: 630 };

/**
 * Social card (1200×630). A plain route, not `opengraph-image`: the file
 * convention would also attach it to dynamic private routes and block their
 * prerender. The root layout points `openGraph.images` here.
 */
export function GET() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background:
          "linear-gradient(135deg, #3f1b7a 0%, #7431e0 60%, #f97362 100%)",
        color: "#ffffff",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: "#ffffff",
            color: "#7431e0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 44,
            fontWeight: 900,
          }}
        >
          S
        </div>
        <div style={{ fontSize: 40, fontWeight: 700 }}>{SITE_NAME}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.05 }}>
          Mentorías 1 a 1 con mujeres que ya recorrieron el camino STEAM.
        </div>
        <div style={{ fontSize: 30, opacity: 0.85 }}>
          Ciencia · Tecnología · Ingeniería · Arte · Matemáticas · Perú y
          Latinoamérica
        </div>
      </div>
    </div>,
    size,
  );
}
