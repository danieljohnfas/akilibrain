import { TypeSafeClient } from '@typesafe-ai/sdk';

/**
 * Structured "System One" decisions (choice / score / noul questions) with two engines:
 *
 *  1. Clef (Cloudflare Workers AI, `@cf/cloudflare/clef-flash`) when CLOUDFLARE_ACCOUNT_ID and
 *     CLOUDFLARE_WORKERS_AI_TOKEN (or CLOUDFLARE_API_TOKEN) are set.
 *  2. Jev (TypeSafe AI, TYPESAFE_API_KEY) as the fallback, or on its own when Clef is not set up.
 *
 * Both accept the same request (questions built with the SDK's choice/score/noul helpers) and
 * return the same `answers` shape, so callers do not need to know which engine answered.
 */

type SystemOne = TypeSafeClient['systemOne'];

export interface DecisionClient {
  systemOne: SystemOne;
}

const CLEF_MODEL = '@cf/cloudflare/clef-flash';
const DEFAULT_TIMEOUT_MS = 10_000;

function clefCredentials(): { accountId: string; token: string } | null {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const token = (process.env.CLOUDFLARE_WORKERS_AI_TOKEN || process.env.CLOUDFLARE_API_TOKEN)?.trim();
  return accountId && token ? { accountId, token } : null;
}

export function isClefAvailable(): boolean {
  return clefCredentials() !== null;
}

export function isTypeSafeJevAvailable(): boolean {
  return Boolean(process.env.TYPESAFE_API_KEY?.trim());
}

export function isDecisionEngineAvailable(): boolean {
  return isClefAvailable() || isTypeSafeJevAvailable();
}

let jevClient: TypeSafeClient | null = null;

/** The TypeSafe (Jev) client, or null when TYPESAFE_API_KEY is not set. */
export function getJevClient(): TypeSafeClient | null {
  if (!isTypeSafeJevAvailable()) return null;
  if (!jevClient) {
    try {
      jevClient = new TypeSafeClient({
        apiKey: process.env.TYPESAFE_API_KEY!.trim(),
        defaultModel: process.env.TYPESAFE_MODEL?.trim() || 'jev-preview',
        defaultHeaders: {
          'TypeSafe-Danger-Zone-Images': 'true',
        },
        timeout: DEFAULT_TIMEOUT_MS,
      });
    } catch (err) {
      console.warn('[Jev] Failed to initialize TypeSafeClient:', err);
      return null;
    }
  }
  return jevClient;
}

async function runClef(
  creds: { accountId: string; token: string },
  request: unknown,
  timeoutMs: number,
): Promise<unknown> {
  const { state, questions } = request as { state: unknown; questions: unknown };
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${creds.accountId}/ai/run/${CLEF_MODEL}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${creds.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'clef-flash', state, questions }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const data = (await res.json().catch(() => null)) as { success?: boolean; result?: unknown; errors?: unknown } | null;
  if (!res.ok || !data?.success || !data.result) {
    throw new Error(`Clef HTTP ${res.status}: ${JSON.stringify(data?.errors ?? data)}`.slice(0, 300));
  }
  return data.result;
}

const systemOne = (async (request: unknown, options?: { timeout?: number }) => {
  const timeoutMs = options?.timeout ?? DEFAULT_TIMEOUT_MS;
  const creds = clefCredentials();
  let clefError: unknown = null;

  if (creds) {
    try {
      return await runClef(creds, request, timeoutMs);
    } catch (err) {
      clefError = err;
      console.warn('[Clef] failed, falling back to Jev:', err instanceof Error ? err.message : err);
    }
  }

  const client = getJevClient();
  if (!client) {
    throw new Error(
      `No decision engine available: Clef ${clefError ? 'failed' : 'is not configured'} and TYPESAFE_API_KEY is not set`,
    );
  }
  return client.systemOne(request as never, options);
}) as unknown as SystemOne;

/** A client exposing `systemOne`, or null when neither Clef nor Jev is configured. */
export function getDecisionClient(): DecisionClient | null {
  return isDecisionEngineAvailable() ? { systemOne } : null;
}
