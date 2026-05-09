import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinFlow – AI Expense Tracker",
  description: "Premium AI-powered expense tracker for the Hyderabad developer lifestyle.",
  manifest: "/manifest.json",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  interactiveWidget: "overlays-content",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg text-white app-screen">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
