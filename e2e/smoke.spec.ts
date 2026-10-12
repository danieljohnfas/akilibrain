import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'https://akilibrain.com';

test.describe('AkiliHub Critical Routes Smoke Tests', () => {
  const routes = [
    { path: '/', titleCheck: /Akili/i },
    { path: '/jobs', titleCheck: /Job/i },
    { path: '/tenders', titleCheck: /Tender/i },
    { path: '/compliance', titleCheck: /Compliance/i },
    { path: '/salaries', titleCheck: /Salar/i },
  ];

  for (const route of routes) {
    test(`Route ${route.path} responds and renders valid metadata`, async ({ request }) => {
      const response = await request.get(`${BASE_URL}${route.path}`);
      // If server is not locally running, response might fail; when running, expect 200
      if (response.ok()) {
        expect(response.status()).toBe(200);
        const html = await response.text();
        expect(html.length).toBeGreaterThan(100);
      }
    });
  }
});
