import type { Metadata } from "next";
import { Inter, Manrope, JetBrains_Mono } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ToastViewport } from "@/components/shared/Toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

// Set NEXT_PUBLIC_SITE_URL once a production domain exists - this only
// affects absolute URL resolution for Open Graph/Twitter cards and the
// sitemap, not routing, so it's safe to leave as a localhost fallback until
// hosting is set up.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  // No title.template: every route (including this default) already sets
  // its own complete, branded title string - a template would double up
  // the suite name on top of those.
  title: "PPC Keyword Utilities Suite",
  description:
    "Free, browser-based PPC keyword tools - match type formatting, merge & match, and negative keyword mining. All processing happens client-side.",
  openGraph: {
    type: "website",
    siteName: "PPC Keyword Utilities Suite",
    title: "PPC Keyword Utilities Suite",
    description:
      "Free, browser-based PPC keyword tools - match type formatting, merge & match, and negative keyword mining.",
  },
  twitter: {
    card: "summary",
    title: "PPC Keyword Utilities Suite",
    description:
      "Free, browser-based PPC keyword tools - match type formatting, merge & match, and negative keyword mining.",
  },
};

// Chromium-only progressive enhancement: prerenders the suite's other routes
// on hover so switching tools via the header nav feels instant. Firefox/
// Safari silently ignore an unrecognized script type - never a regression.
const SPECULATION_RULES = JSON.stringify({
  prerender: [{ where: { href_matches: "/*" }, eagerness: "moderate" }],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${manrope.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <div className="flex min-h-screen flex-col">
          <Header />
          <div className="flex-1">{children}</div>
          <Footer />
        </div>
        <ToastViewport />
        <script
          type="speculationrules"
          dangerouslySetInnerHTML={{ __html: SPECULATION_RULES }}
        />
      </body>
    </html>
  );
}
