/**
 * Shared types for the OpenTelemetry MCP-agent tracing example.
 *
 * These types are intentionally provider-agnostic. The {@link LLM} interface and
 * the message shapes mirror the request/response surface most chat models
 * expose, but nothing here is tied to a specific vendor SDK.
 */

/** A single chat message in a conversation handed to an {@link LLM}. */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  /**
   * Present on `role: 'tool'` messages: the name of the tool whose result this
   * message carries. Lets the model correlate a result with the call it made.
   */
  toolName?: string;
}

/**
 * A directive from the model asking the agent to invoke an MCP tool. When the
 * model returns one of these instead of a final answer, the agent runs the tool
 * and feeds the result back on the next turn.
 */
export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}

/**
 * The result of a single {@link LLM.chat} turn. Exactly one of `toolCall` or
 * `finalAnswer` is meaningful, distinguished by `kind`.
 */
export interface LLMResponse {
  /** `'tool_call'` => the model wants a tool run; `'final'` => it answered. */
  kind: 'tool_call' | 'final';
  /** Set when `kind === 'tool_call'`. */
  toolCall?: ToolCall;
  /** Set when `kind === 'final'`. */
  finalAnswer?: string;
  /** The model identifier that produced this response (for span attributes). */
  model: string;
  /** Token usage, surfaced as `gen_ai.usage.*` span attributes. */
  usage: TokenUsage;
}

/** Prompt/completion token counts for a single model call. */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

/** The final result of running an {@link Agent} to completion. */
export interface AgentResult {
  /** The model's final natural-language answer. */
  answer: string;
  /** How many agent loop steps (LLM turns) it took to get there. */
  steps: number;
}
