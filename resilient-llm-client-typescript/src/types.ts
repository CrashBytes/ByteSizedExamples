/**
 * Core types shared across the resilient client.
 *
 * The whole library is built around one small interface — `Provider` — so that
 * every resilience concern (timeout, retry, circuit breaking, failover) is
 * provider-agnostic. You implement `Provider` once per upstream (Anthropic,
 * OpenAI, a local model, a deterministic fake for tests) and the client wraps
 * any list of them.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  /** Optional model hint; each provider maps this to its own model id. */
  model?: string;
  maxTokens?: number;
}

export interface ChatResponse {
  /** The assistant's text output. */
  text: string;
  /** The concrete model id that produced the response. */
  model: string;
  /** The name of the provider that served the request. */
  provider: string;
  /** The raw upstream payload, for callers that need more than the text. */
  raw?: unknown;
}

/**
 * A single upstream LLM. Implementations must honor the `AbortSignal`: when it
 * fires, the in-flight request should be cancelled and the promise rejected.
 * Honoring the signal is what lets the timeout layer actually free the socket
 * instead of leaving a doomed request running in the background.
 */
export interface Provider {
  readonly name: string;
  chat(request: ChatRequest, signal: AbortSignal): Promise<ChatResponse>;
}
