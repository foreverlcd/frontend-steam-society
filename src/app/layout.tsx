import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { CookieNotice } from "@/components/layout/cookie-notice";
import { AuthProvider } from "@/lib/auth/auth-context";
import {
  SITE_DESCRIPTION,
  SITE_LOCALE,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
} from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} · ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "mentoría STEAM",
    "mentoras STEM",
    "mujeres en ciencia",
    "mujeres en tecnología",
    "orientación vocacional",
    "Perú",
    "Latinoamérica",
  ],
  category: "education",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    title: `${SITE_NAME} · ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME}: ${SITE_TAGLINE}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} · ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: ["/og"],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#fbf7f4",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-PE">
      <body className="min-h-dvh">
        <AuthProvider>{children}</AuthProvider>
        <CookieNotice />
      </body>
    </html>
  );
}
