import type { Metadata } from "next";
import { Geist, Manrope, JetBrains_Mono } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ToastViewport } from "@/components/shared/Toast";
import "./globals.css";

// Geist rather than Inter for body text: Inter is the default of so many
// dashboards that it reads as "unstyled", and Geist's tighter apertures and
// squarer terminals sit closer to the mono/bracket character of this suite.
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
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
    // The generated `opengraph-image` is 1200x630, which needs the large card -
    // a plain `summary` would crop it to a square thumbnail.
    card: "summary_large_image",
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
        className={`${geist.variable} ${manrope.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {/*
          First focusable thing in the document. The negative-keyword finder
          puts a file input, a dropzone and four n-gram controls between the
          header and the frequency table, so a keyboard user landing on a tool
          page otherwise tabs through the whole chrome before reaching the
          textarea they came for.
        */}
        <a
          href="#main-content"
          className="sr-only rounded-md bg-signal text-sm font-medium text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:px-4 focus:shadow-float focus:outline-none focus:ring-2 focus:ring-signal focus:ring-offset-2 focus:ring-offset-paper"
        >
          Skip to content
        </a>
        <div aria-hidden="true" className="page-grain" />
        <div className="flex min-h-dvh flex-col">
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
