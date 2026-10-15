// Clef-first System One client for one-off scripts (the app uses src/lib/ai/decision-engine.ts).
// Run scripts that import it with: node --env-file=.env.local scripts/<script>.mjs
import { TypeSafeClient } from '@typesafe-ai/sdk';

// Initialize Typesafe Jev client for fallback
const jevClient = process.env.TYPESAFE_API_KEY 
  ? new TypeSafeClient({
      apiKey: process.env.TYPESAFE_API_KEY.trim(),
      defaultModel: process.env.TYPESAFE_MODEL?.trim() || 'jev-preview',
      defaultHeaders: {
        'TypeSafe-Danger-Zone-Images': 'true',
      },
    })
  : null;

/**
 * Drop-in replacement for jev.systemOne using Cloudflare Clef-flash with Jev fallback
 */
export async function systemOne(request, options = {}) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_WORKERS_AI_TOKEN || process.env.CLOUDFLARE_API_TOKEN;
  
  let cloudflareError = null;

  // 1. Try Cloudflare Workers AI first
  if (accountId && token) {
    try {
      const endpointModel = request.model === 'clef' ? '@cf/cloudflare/clef' : '@cf/cloudflare/clef-flash';
      const bodyModel = request.model === 'clef' ? 'clef' : 'clef-flash';
      const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${endpointModel}`;
      
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: bodyModel,
          state: request.state,
          questions: request.questions
        }),
        signal: options.signal || (options.timeout ? AbortSignal.timeout(options.timeout) : undefined)
      });

      const responseText = await res.text();
      
      if (!res.ok) {
        throw new Error(`Cloudflare HTTP ${res.status}: ${responseText}`);
      }

      const data = JSON.parse(responseText);
      if (!data.success) {
        throw new Error(`Cloudflare API Error: ${JSON.stringify(data.errors)}`);
      }

      return data.result;
    } catch (e) {
      console.warn(`[Fallback] Cloudflare Clef failed: ${e.message}. Falling back to Jev...`);
      cloudflareError = e;
    }
  }

  // 2. Fallback to Typesafe API (Jev)
  if (!jevClient) {
    throw new Error(`No fallback available. Cloudflare failed (${cloudflareError?.message || 'Missing credentials'}) and TYPESAFE_API_KEY is not set.`);
  }

  // Make sure we pass the correct model name for Typesafe (or let it use its default jev-latest)
  // If the original request strictly asked for 'clef', Typesafe won't understand it, so we strip it.
  const fallbackRequest = {
    ...request,
    model: process.env.TYPESAFE_MODEL?.trim() || 'jev-preview' // Jev 1.14.0
  };

  const res = await jevClient.systemOne(fallbackRequest, options);
  
  // The SDK returns { answers, usage, model } natively, we just need to return it as is, 
  // but let's make sure it matches the structure expected by our scripts. 
  // Actually, Typesafe SDK returns the full result object, same as Cloudflare.
  return res;
}
