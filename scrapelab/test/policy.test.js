import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isBlocked, parseRobots, robotsAllows, waitForDomain } from '../src/policy.js';

test('blocklist matches host and subdomains only', () => {
  assert.equal(isBlocked('https://www.glassdoor.com/x', ['glassdoor.com']), true);
  assert.equal(isBlocked('https://notglassdoor.com/x', ['glassdoor.com']), false);
});

test('robots: specific agent group beats *, longest match wins', () => {
  const txt = `User-agent: *\nDisallow: /\n\nUser-agent: scrapelab\nDisallow: /private\nAllow: /private/ok\n`;
  const rules = parseRobots(txt, 'scrapelab/0.1');
  assert.equal(robotsAllows(rules, '/jobs'), true);
  assert.equal(robotsAllows(rules, '/private/x'), false);
  assert.equal(robotsAllows(rules, '/private/ok/1'), true);
  assert.equal(robotsAllows(parseRobots(txt, 'otherbot'), '/jobs'), false);
});

test('robots: empty file allows everything', () => {
  assert.equal(robotsAllows(parseRobots('', 'x'), '/a'), true);
});

test('rate limit spaces requests to the same host', async () => {
  const t0 = Date.now();
  await Promise.all([waitForDomain('https://a.test/1', 100), waitForDomain('https://a.test/2', 100)]);
  assert.ok(Date.now() - t0 >= 95);
});
