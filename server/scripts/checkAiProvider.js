// Checks that the AI provider settings in server/.env work, with ONE tiny request.
// Run from the server folder:  npm run check:ai
//
// Uses AI_PROVIDER, AI_MODEL, and AI_API_KEY. Never prints the key.
// Each run uses 1 of your free daily requests.

import { config } from '../src/config/env.js';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const TIMEOUT_MS = 20000;

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
function hintFor(status, text) {
  if (status === 401)
    return 'The API key was rejected. Re-copy AI_API_KEY from openrouter.ai/settings/keys.';
  if (status === 402) return 'The account has a negative balance or the key hit its credit limit.';
  if (status === 404 && /data policy/i.test(text)) {
    return 'No provider for this model matches your OpenRouter privacy settings. Pick another model or review Settings > Privacy.';
  }
  if (status === 404)
    return 'Model not found. Check AI_MODEL is copied exactly (free models end in ":free").';
  if (status === 400 && /response_format|structured|json_schema/i.test(text)) {
    return 'This model does not support structured outputs. Pick one from the structured_outputs filter.';
  }
  if (status === 429) return 'Rate limited (free models: 20/minute, 50/day). Wait and try again.';
  return 'Unexpected provider error. Try again, or pick another free model.';
}

// Pulls the readable message out of OpenRouter's error JSON.
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
  const { provider, model, apiKey, isConfigured } = config.ai;

  if (provider !== 'openrouter') {
    console.error(`AI_PROVIDER is "${provider}". This check supports "openrouter".`);
    process.exitCode = 1;
    return;
  }
  if (!isConfigured) {
    console.error('AI is not configured: set AI_MODEL and AI_API_KEY in server/.env.');
    process.exitCode = 1;
    return;
  }

  console.log(
    `Checking OpenRouter with model "${model}" (key: ${apiKey.length} characters, hidden)...`,
  );
  const startedAt = Date.now();

  let response;
  try {
    response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'StudySlot',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'Reply with JSON only.' },
          { role: 'user', content: 'Return ok=true and a five-word friendly message.' },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'connection_check', strict: true, schema: CHECK_SCHEMA },
        },
        max_tokens: 60,
        temperature: 0,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    console.error(
      error.name === 'TimeoutError'
        ? `No answer within ${TIMEOUT_MS / 1000}s. Free models can be slow or busy; try again or pick another.`
        : `Could not reach OpenRouter (${error.message}). Check your internet connection.`,
    );
    process.exitCode = 1;
    return;
  }

  const latencyMs = Date.now() - startedAt;
  const text = await response.text();

  if (!response.ok) {
    console.error(`OpenRouter returned ${response.status} after ${latencyMs}ms.`);
    console.error(`Hint: ${hintFor(response.status, text)}`);
    // OpenRouter's own explanation (this script only runs on your computer; it never
    // contains your key). The app itself never shows provider errors to users.
    console.error(`OpenRouter said: ${providerMessage(text)}`);
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
    console.error('Hint: pick a model listed with structured_outputs support.');
    process.exitCode = 1;
  }
}

main();
