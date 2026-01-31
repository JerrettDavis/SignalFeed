import type { Metadata } from "next";
import { Cormorant_Garamond, Space_Grotesk } from "next/font/google";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";

const displayFont = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const bodyFont = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SightSignal",
  description: "Map-first signals for local sightings, events, and hazards.",
  manifest: "/manifest.json",
  themeColor: "#0078ff",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SightSignal",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0078ff" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').then(
                  registration => console.log('[SW] Registered:', registration.scope),
                  error => console.error('[SW] Registration failed:', error)
                );
              });
            }
          `
        }} />
      </body>
    </html>
  );
}
