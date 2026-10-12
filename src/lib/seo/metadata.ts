import { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://akilihub.com';
const SITE_NAME = 'AkiliHub';

export interface MetadataOptions {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: 'website' | 'article';
  keywords?: string[];
  noIndex?: boolean;
}

/**
 * Standard Next.js Metadata Generator for AkiliHub pages.
 * Handles canonical URLs, Open Graph, Twitter Cards, and robots directives.
 */
export function constructMetadata({
  title,
  description,
  path = '',
  image = '/og-image.png',
  type = 'website',
  keywords = [],
  noIndex = false,
}: MetadataOptions): Metadata {
  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const fullTitle = `${title} | ${SITE_NAME}`;

  return {
    title: fullTitle,
    description,
    keywords: [
      ...keywords,
      'East Africa',
      'Kenya',
      'Tanzania',
      'Uganda',
      'Rwanda',
      'Ethiopia',
      'Jobs',
      'Tenders',
      'Compliance',
      'Salaries',
    ],
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      images: [
        {
          url: image.startsWith('http') ? image : `${BASE_URL}${image}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image.startsWith('http') ? image : `${BASE_URL}${image}`],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  };
}