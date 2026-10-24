import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth/auth-context";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Steam Society",
    template: "%s · Steam Society",
  },
  description:
    "Mentorías para acercar a más mujeres a carreras STEAM en Perú y Latinoamérica.",
  applicationName: "Steam Society",
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#fbf7f4",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-dvh">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
