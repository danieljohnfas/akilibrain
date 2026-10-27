"use client";

import Script from "next/script";

interface UmamiAnalyticsProps {
  websiteId?: string;
  src?: string;
}

/**
 * Umami is a cookieless, lightweight (2KB), privacy-preserving analytics tool.
 * Complies with GDPR/CCPA out of the box and operates cleanly without cookie popups.
 */
export function UmamiAnalytics({
  websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
  src = process.env.NEXT_PUBLIC_UMAMI_SRC || "https://cloud.umami.is/script.js"
}: UmamiAnalyticsProps) {
  if (!websiteId) return null;

  return (
    <Script
      defer
      src={src}
      data-website-id={websiteId}
      strategy="afterInteractive"
    />
  );
}
