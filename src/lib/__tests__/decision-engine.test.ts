import { afterEach, describe, expect, it, vi } from 'vitest';
import { getDecisionClient, isClefAvailable, isDecisionEngineAvailable } from '@/lib/ai/decision-engine';

const KEYS = ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_WORKERS_AI_TOKEN', 'CLOUDFLARE_API_TOKEN', 'TYPESAFE_API_KEY'] as const;
const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));

afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
  vi.unstubAllGlobals();
});

function clear() {
  for (const k of KEYS) delete process.env[k];
}

describe('decision engine', () => {
  it('is unavailable without Clef or Jev credentials', () => {
    clear();
    expect(isDecisionEngineAvailable()).toBe(false);
    expect(getDecisionClient()).toBeNull();
  });

  it('answers with Clef when Cloudflare credentials are set', async () => {
    clear();
    process.env.CLOUDFLARE_ACCOUNT_ID = 'acct';
    process.env.CLOUDFLARE_WORKERS_AI_TOKEN = 'tok';
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) =>
      new Response(JSON.stringify({ success: true, result: { model: 'clef-flash', answers: { ok: { type: 'noul', noul: 0.9 } } } })),
    );
    vi.stubGlobal('fetch', fetchMock);
    expect(isClefAvailable()).toBe(true);
    const res = (await getDecisionClient()!.systemOne({ state: 'x', questions: {} } as never)) as { answers: Record<string, { noul: number }> };
    expect(res.answers.ok.noul).toBe(0.9);
    expect(String(fetchMock.mock.calls[0][0])).toContain('/accounts/acct/ai/run/@cf/cloudflare/clef-flash');
  });

  it('reports a clear error when Clef fails and Jev is not configured', async () => {
    clear();
    process.env.CLOUDFLARE_ACCOUNT_ID = 'acct';
    process.env.CLOUDFLARE_WORKERS_AI_TOKEN = 'tok';
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"success":false,"errors":["boom"]}', { status: 500 })));
    await expect(getDecisionClient()!.systemOne({ state: 'x', questions: {} } as never)).rejects.toThrow(/TYPESAFE_API_KEY is not set/);
  });
});
