// Talks to OpenRouter's chat-completions API. This is the ONLY file that knows how
// to call the AI provider, so switching providers later means changing one file.
//
// It returns the model's raw text, or throws an AiProviderError with a short `kind`.
// Provider error messages are NEVER passed on to users: callers only see the kind.

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
export const DEFAULT_AI_TIMEOUT_MS = 15000;

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
  // 404 here usually means "no provider allowed by the account's privacy settings".
  if (status === 404 || status === 402 || status >= 500) return 'unavailable';
  return 'provider';
}

/**
 * Sends one chat request and returns the model's reply text.
 *
 * @param {object} options
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
  apiKey,
  model,
  messages,
  schema,
  schemaName = 'response',
  // Reasoning models spend part of this budget "thinking" before the JSON answer,
  // so it must be much larger than the answer itself (~300 tokens).
  maxTokens = 4000,
  timeoutMs = DEFAULT_AI_TIMEOUT_MS,
  fetchImpl = fetch,
}) {
  const body = {
    model,
    messages,
    max_tokens: maxTokens,
    temperature: 0.2, // low = more consistent, less "creative" answers
    // Reasoning models "think" before answering. Ask for a short think (faster).
    // We only read the final answer (`content`); any reasoning text is ignored.
    reasoning: { effort: 'low' },
  };
  if (schema) {
    body.response_format = {
      type: 'json_schema',
      json_schema: { name: schemaName, strict: true, schema },
    };
  }

  let response;
  try {
    response = await fetchImpl(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'StudySlot',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
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
