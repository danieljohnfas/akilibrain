import type { Metadata } from 'next';
import AmazonAdsCentralDashboard from '@/app/admin/(dashboard)/amazon-ads/page';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Amazon Associates Central Ad Engine (photoid03-20) | Portfolio Analytics',
  description:
    'Live online analytics & dynamic product management for Amazon Associates ID photoid03-20 across all 6 eligible websites.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AmazonPhotoid0320Page() {
  return <AmazonAdsCentralDashboard />;
}
