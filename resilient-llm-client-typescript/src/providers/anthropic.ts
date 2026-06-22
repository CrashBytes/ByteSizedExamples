/**
 * A real `Provider` for Anthropic's Messages API, implemented with `fetch` so
 * the library stays dependency-free. In a production app you would more often
 * wrap the official `@anthropic-ai/sdk` client here instead — the point of this
 * adapter is to show how any upstream maps onto the `Provider` interface and how
 * to translate HTTP status codes into the library's typed, retryable errors.
 *
 * Mapping (see the Messages API error reference):
 *   429       → RateLimitError (retryable; reads Retry-After)
 *   500 / 529 → ServerError    (retryable)
 *   4xx       → ClientRequestError (not retryable — won't fix itself)
 */

import { ClientRequestError, RateLimitError, ServerError } from '../errors.js';
import type { ChatMessage, ChatRequest, ChatResponse, Provider } from '../types.js';

export interface AnthropicProviderOptions {
  apiKey: string;
  /** Defaults to the latest Opus. Override per deployment. */
  model?: string;
  /** Override for tests or proxies. */
  baseUrl?: string;
  /** Injectable for tests; defaults to global fetch. */
  fetchFn?: typeof fetch;
}

const ANTHROPIC_VERSION = '2023-06-01';

export class AnthropicProvider implements Provider {
  readonly name = 'anthropic';
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;

  constructor(options: AnthropicProviderOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model ?? 'claude-opus-4-8';
    this.baseUrl = options.baseUrl ?? 'https://api.anthropic.com';
    this.fetchFn = options.fetchFn ?? fetch;
  }

  async chat(request: ChatRequest, signal: AbortSignal): Promise<ChatResponse> {
    const model = request.model ?? this.model;
    const system = request.messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n\n');
    const messages = request.messages
      .filter((m): m is ChatMessage & { role: 'user' | 'assistant' } => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }));

    const response = await this.fetchFn(`${this.baseUrl}/v1/messages`, {
      method: 'POST',
      signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model,
        max_tokens: request.maxTokens ?? 1024,
        ...(system ? { system } : {}),
        messages,
      }),
    });

    if (!response.ok) {
      throw await this.toError(response);
    }

    const data = (await response.json()) as {
      model: string;
      content: Array<{ type: string; text?: string }>;
    };
    const text = data.content
      .filter((block) => block.type === 'text' && typeof block.text === 'string')
      .map((block) => block.text)
      .join('');

    return { text, model: data.model, provider: this.name, raw: data };
  }

  private async toError(response: Response): Promise<Error> {
    const body = await response.text().catch(() => '');
    const message = `anthropic ${response.status}: ${body.slice(0, 300)}`;

    if (response.status === 429) {
      const header = response.headers.get('retry-after');
      const retryAfterMs = header ? Number(header) * 1000 : undefined;
      return new RateLimitError(message, Number.isFinite(retryAfterMs) ? retryAfterMs : undefined);
    }
    if (response.status >= 500) {
      return new ServerError(message, response.status);
    }
    return new ClientRequestError(message, response.status);
  }
}
