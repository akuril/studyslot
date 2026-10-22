// Talks to the AI provider's chat-completions API. This is the ONLY file that knows
// how to call a provider. Both supported providers use the same OpenAI-style API,
// so they differ only in the address and a few request settings (see PROVIDERS).
//
// It returns the model's raw text, or throws an AiProviderError with a short `kind`.
// Provider error messages are NEVER passed on to users: callers only see the kind.

// Free models typically answer in 8-14 s (tested Step 30), so 25 s leaves headroom.
// Anything slower uses the keyword fallback instead of making the parent wait.
export const DEFAULT_AI_TIMEOUT_MS = 25000;

export const PROVIDERS = Object.freeze({
  openrouter: Object.freeze({
    url: 'https://openrouter.ai/api/v1/chat/completions',
    extraHeaders: { 'X-Title': 'StudySlot' },
    // Reasoning models spend part of the token budget "thinking" before the JSON
    // answer, so it must be much larger than the answer itself (~300 tokens).
    tokenLimit: (tokens) => ({ max_tokens: tokens }),
    defaultMaxTokens: 4000,
    // Ask for a short think (faster). Only the final answer (`content`) is read.
    reasoning: { reasoning: { effort: 'low' } },
  }),
  groq: Object.freeze({
    url: 'https://api.groq.com/openai/v1/chat/completions',
    extraHeaders: {},
    tokenLimit: (tokens) => ({ max_completion_tokens: tokens }),
    // Smaller budget: Groq's free tier counts tokens per minute.
    defaultMaxTokens: 2000,
    // Supported by the gpt-oss models we use on Groq.
    reasoning: { reasoning_effort: 'low' },
  }),
});

export const SUPPORTED_AI_PROVIDERS = Object.keys(PROVIDERS);

export class AiProviderError extends Error {
  /**
   * @param {'timeout'|'network'|'auth'|'rate_limit'|'unavailable'|'provider'|'empty'} kind
   * @param {number} [status]  the provider's HTTP status, for server logs only
   * @param {object} [diagnostics]  counts and codes only (never text), for server logs
   */
  constructor(kind, status, diagnostics) {
    super(`AI provider error: ${kind}${status ? ` (${status})` : ''}`);
    this.name = 'AiProviderError';
    this.kind = kind;
    this.status = status;
    this.diagnostics = diagnostics;
  }
}

function kindForStatus(status) {
  if (status === 401 || status === 403) return 'auth';
  if (status === 429) return 'rate_limit';
  // 404 usually means the model id is wrong, or (OpenRouter) no provider is allowed
  // by the account's privacy settings.
  if (status === 404 || status === 402 || status >= 500) return 'unavailable';
  return 'provider';
}

/**
 * Builds the HTTP request for a provider (used by the client and by `npm run check:ai`).
 * @returns {{ url: string, init: RequestInit }}  `init` has no `signal`; callers add one.
 */
export function buildChatRequest({
  provider,
  apiKey,
  model,
  messages,
  schema,
  schemaName = 'response',
  maxTokens,
}) {
  const settings = PROVIDERS[provider];
  if (!settings) {
    throw new Error(`Unsupported AI provider "${provider}"`);
  }

  const body = {
    model,
    messages,
    temperature: 0.2, // low = more consistent, less "creative" answers
    ...settings.tokenLimit(maxTokens ?? settings.defaultMaxTokens),
    ...settings.reasoning,
  };
  if (schema) {
    body.response_format = {
      type: 'json_schema',
      json_schema: { name: schemaName, strict: true, schema },
    };
  }

  return {
    url: settings.url,
    init: {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...settings.extraHeaders,
      },
      body: JSON.stringify(body),
    },
  };
}

/**
 * Sends one chat request and returns the model's reply text.
 *
 * @param {object} options
 * @param {string} options.provider    "openrouter" or "groq"
 * @param {string} options.apiKey
 * @param {string} options.model
 * @param {Array<{role: string, content: string}>} options.messages
 * @param {object} [options.schema]      JSON schema the reply must follow (structured outputs)
 * @param {string} [options.schemaName]
 * @param {number} [options.maxTokens]
 * @param {number} [options.timeoutMs]
 * @param {typeof fetch} [options.fetchImpl]  lets tests pass a fake fetch
 * @returns {Promise<string>}
 */
export async function requestChatCompletion({
  timeoutMs = DEFAULT_AI_TIMEOUT_MS,
  fetchImpl = fetch,
  ...requestOptions
}) {
  const { url, init } = buildChatRequest(requestOptions);

  let response;
  try {
    response = await fetchImpl(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      throw new AiProviderError('timeout');
    }
    throw new AiProviderError('network');
  }

  if (!response.ok) {
    throw new AiProviderError(kindForStatus(response.status), response.status);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new AiProviderError('provider', response.status);
  }

  const choice = data?.choices?.[0];
  const content = choice?.message?.content;
  if (typeof content !== 'string' || content.trim() === '') {
    // Why was it empty? e.g. finish=length means the token budget ran out while thinking.
    throw new AiProviderError('empty', response.status, {
      finish: choice?.finish_reason ?? 'none',
      completionTokens: data?.usage?.completion_tokens ?? 'n/a',
      reasoningTokens: data?.usage?.completion_tokens_details?.reasoning_tokens ?? 'n/a',
      hasReasoning: typeof choice?.message?.reasoning === 'string',
    });
  }
  return content;
}
