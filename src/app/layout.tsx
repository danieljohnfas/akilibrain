import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { AIChatPanel } from "@/components/ai/AIChatPanel";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildOrganizationSchema, buildWebSiteSchema } from "@/components/seo/schemas";
import { ClarityAnalytics } from "@/components/analytics/Clarity";
import { UmamiAnalytics } from "@/components/analytics/UmamiAnalytics";
import { ConsentProvider } from "@/components/consent/ConsentProvider";
import { ConsentBanner } from "@/components/consent/ConsentBanner";
import { AdSenseScript } from "@/components/consent/AdSenseScript";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import { ActivityTracker } from "@/components/analytics/ActivityTracker";
const inter = Inter({ subsets: ["latin"] });

const BASE_URL = "https://akilibrain.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "AkiliBrain | East Africa's Professional Intelligence Platform",
    template: "%s | AkiliBrain",
  },
  description: "East Africa's unified intelligence hub for curated government tenders, verified job openings, business compliance, and market salaries.",
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "1a6fa8804679f9060c20d8c1b2c56706",
  },
  keywords: [
    "government tenders Kenya",
    "procurement East Africa",
    "tenders Africa",
    "jobs Kenya",
    "jobs East Africa",
    "career opportunities Africa",
    "business compliance Kenya",
    "company registry East Africa",
    "public health data Africa",
    "salaries Kenya",
    "salary database East Africa",
    "Uganda tenders",
    "Tanzania procurement",
    "Rwanda jobs",
    "Africa business intelligence",
    "DHIS2 health data",
  ],
  openGraph: {
    type: "website",
    siteName: "AkiliBrain",
    title: "AkiliBrain | East Africa's Professional Intelligence Platform",
    description: "East Africa's unified intelligence hub for curated government tenders, verified job openings, business compliance, and market salaries.",
    url: BASE_URL,
    locale: "en_KE",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "AkiliBrain — East Africa's Professional Intelligence Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AkiliBrain | East Africa's Professional Intelligence Platform",
    description: "East Africa's unified intelligence hub for curated government tenders, verified job openings, business compliance, and market salaries.",
    images: ["/og.png"],
    site: "@akilibrain",
  },
  alternates: {
    // Do NOT set a global canonical here — Next.js auto-generates the correct
    // per-page canonical from metadataBase + the current route path.
    // A hardcoded canonical here would point ALL pages (including /jobs/123)
    // to the homepage, causing Google to de-index detail pages.
    types: {
      'application/rss+xml': `${BASE_URL}/feed.xml`,
    },
  },
  manifest: '/site.webmanifest',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-KE" suppressHydrationWarning>
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2501499631331261"
          crossOrigin="anonymous"
        />
        <JsonLd schema={buildOrganizationSchema()} />
        <JsonLd schema={buildWebSiteSchema()} />
      </head>
      <body className={inter.className}>
        <ConsentProvider>
        <AdSenseScript pubId={process.env.NEXT_PUBLIC_ADSENSE_PUB_ID || 'ca-pub-2501499631331261'} />
        <ClarityAnalytics />
        <UmamiAnalytics />
        <ActivityTracker />
        <PostHogProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Navbar />
            <main className="min-h-screen">
              {children}
            </main>
            <Footer />
            <AIChatPanel />
          </ThemeProvider>
        </PostHogProvider>
        <ConsentBanner />
        </ConsentProvider>
      </body>
    </html>
  );
}

