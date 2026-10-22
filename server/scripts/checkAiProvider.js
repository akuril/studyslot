// Checks that the AI provider settings in server/.env work, with ONE tiny request.
// Run from the server folder:  npm run check:ai
//
// Uses AI_PROVIDER (openrouter or groq), AI_MODEL, and AI_API_KEY. Never prints the key.
// Each run uses 1 request from your provider's free allowance.

import { config } from '../src/config/env.js';
import { buildChatRequest } from '../src/services/aiClient.js';

const TIMEOUT_MS = 25000;
const PROVIDER_NAMES = { openrouter: 'OpenRouter', groq: 'Groq' };

// A tiny schema, to confirm the model supports structured (JSON) output.
const CHECK_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['ok', 'message'],
  properties: {
    ok: { type: 'boolean' },
    message: { type: 'string' },
  },
};

// Helpful hints for common provider errors (shown on the server only).
function hintFor(provider, status, text) {
  if (status === 401 || status === 403) {
    return provider === 'groq'
      ? 'The API key was rejected. Re-copy AI_API_KEY from console.groq.com/keys.'
      : 'The API key was rejected. Re-copy AI_API_KEY from openrouter.ai/settings/keys.';
  }
  if (status === 402) return 'The account has a negative balance or the key hit its credit limit.';
  if (status === 404 && /data policy|guardrail|zdr/i.test(text)) {
    return 'No provider for this model matches your OpenRouter privacy settings. Review Settings > Privacy.';
  }
  if (status === 404) return 'Model not found. Check AI_MODEL is copied exactly.';
  if (status === 400 && /response_format|structured|json_schema/i.test(text)) {
    return 'This model does not support strict structured outputs. Pick one that does.';
  }
  if (status === 429) return 'Rate limited (free tier). Wait a minute and try again.';
  return 'Unexpected provider error. Try again, or pick another model.';
}

// Pulls the readable message out of the provider's error JSON.
function providerMessage(text) {
  try {
    const body = JSON.parse(text);
    const error = body.error || {};
    const details = error.metadata ? ` ${JSON.stringify(error.metadata)}` : '';
    return `${error.message || text}${details}`.slice(0, 600);
  } catch {
    return String(text).slice(0, 600);
  }
}

async function main() {
  // env.js has already stopped the script if AI_PROVIDER isn't supported.
  const { provider, model, apiKey, isConfigured } = config.ai;
  const providerName = PROVIDER_NAMES[provider];

  if (!isConfigured) {
    console.error('AI is not configured: set AI_MODEL and AI_API_KEY in server/.env.');
    process.exitCode = 1;
    return;
  }

  console.log(
    `Checking ${providerName} with model "${model}" (key: ${apiKey.length} characters, hidden)...`,
  );

  const { url, init } = buildChatRequest({
    provider,
    apiKey,
    model,
    messages: [
      { role: 'system', content: 'Reply with JSON only.' },
      { role: 'user', content: 'Return ok=true and a five-word friendly message.' },
    ],
    schema: CHECK_SCHEMA,
    schemaName: 'connection_check',
  });

  const startedAt = Date.now();
  let response;
  try {
    response = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (error) {
    console.error(
      error.name === 'TimeoutError'
        ? `No answer within ${TIMEOUT_MS / 1000}s. Free models can be slow or busy; try again.`
        : `Could not reach ${providerName} (${error.message}). Check your internet connection.`,
    );
    process.exitCode = 1;
    return;
  }

  const latencyMs = Date.now() - startedAt;
  const text = await response.text();

  if (!response.ok) {
    console.error(`${providerName} returned ${response.status} after ${latencyMs}ms.`);
    console.error(`Hint: ${hintFor(provider, response.status, text)}`);
    // The provider's own explanation (this script only runs on your computer and never
    // prints your key). The app itself never shows provider errors to users.
    console.error(`${providerName} said: ${providerMessage(text)}`);
    process.exitCode = 1;
    return;
  }

  let content;
  try {
    const body = JSON.parse(text);
    content = body.choices && body.choices[0] && body.choices[0].message.content;
    const parsed = JSON.parse(content);
    console.log(`OK in ${latencyMs}ms. Model replied with valid JSON:`, parsed);
    console.log('AI provider is configured correctly.');
  } catch {
    console.error(
      `Got a reply in ${latencyMs}ms, but it was not valid JSON: ${String(content).slice(0, 200)}`,
    );
    console.error('Hint: pick a model that supports strict structured outputs.');
    process.exitCode = 1;
  }
}

main();
