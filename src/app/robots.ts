import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: 'Mediapartners-Google',
        allow: '/',
      },
      {
        userAgent: '*',
        allow: [
          '/',
          '/api/docs',
        ],
        disallow: [
          // Auth and Account pages
          '/login',
          '/signup',
          '/forgot-password',
          '/account',
          // Outbound redirect tracker
          '/api/out',
          // Affiliate redirects & internal analytics
          '/api/go/',
          '/api/amazon-ads/',
          '/amazon-photoid03-20',
          // Search/filter state URLs that duplicate listing pages
          '/jobs?*',
          '/tenders?*',
          '/salaries?*',
          '/health?*',
          '/compliance?*',
          '/guides?*',
        ],
      },
    ],
    sitemap: 'https://akilibrain.com/sitemap.xml',
  };
}
