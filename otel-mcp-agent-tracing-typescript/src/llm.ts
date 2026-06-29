/**
 * The LLM interface, a deterministic offline {@link FakeLLM}, and
 * {@link tracedChat} — the helper that wraps a single model call in a
 * GenAI-conventions span.
 */

import { SpanKind } from '@opentelemetry/api';
import type { ChatMessage, LLMResponse } from './types.js';
import { GEN_AI, GEN_AI_OPERATION, getTracer } from './tracer.js';

/** A chat model: takes a message history, returns one {@link LLMResponse}. */
export interface LLM {
  /** The model identifier (used for span names + `gen_ai.request.model`). */
  readonly model: string;
  /** The provider/system identifier (used for `gen_ai.system`). */
  readonly system: string;
  /** Runs one chat turn over the supplied message history. */
  chat(messages: ChatMessage[]): Promise<LLMResponse>;
}

/**
 * Estimates a token count for a string. Deliberately crude (~4 chars/token) but
 * deterministic, so token-usage span attributes are stable across runs and the
 * demo needs no real tokenizer or API.
 */
export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

/**
 * A deterministic, offline {@link LLM}.
 *
 * Decision logic is plain keyword routing over the latest user task:
 *   - mentions "weather" and a tool result isn't in the history yet -> call `get_weather`
 *   - mentions "docs"/"cite"/"search" and that result isn't in yet -> call `search_docs`
 *   - otherwise -> emit a final answer that stitches the gathered tool results
 *     into a sentence.
 *
 * Because routing depends only on message content, the same task always
 * produces the same span tree, which is what makes the tests reproducible.
 */
export class FakeLLM implements LLM {
  readonly model: string;
  readonly system = 'fake';

  constructor(model = 'fake-router-v1') {
    this.model = model;
  }

  async chat(messages: ChatMessage[]): Promise<LLMResponse> {
    const task = this.latestTask(messages);
    const lower = task.toLowerCase();
    const toolResults = this.collectToolResults(messages);

    const wantsWeather = lower.includes('weather');
    const wantsDocs =
      lower.includes('docs') || lower.includes('cite') || lower.includes('search');

    // Route to a tool the task asks for whose result we don't have yet.
    if (wantsWeather && !toolResults.has('get_weather')) {
      return this.respond({
        kind: 'tool_call',
        toolCall: { name: 'get_weather', args: { city: this.extractCity(task) } },
      });
    }
    if (wantsDocs && !toolResults.has('search_docs')) {
      return this.respond({
        kind: 'tool_call',
        toolCall: { name: 'search_docs', args: { query: task } },
      });
    }

    // No outstanding tool calls -> compose a final answer from what we gathered.
    return this.respond({ kind: 'final', finalAnswer: this.compose(task, toolResults) });
  }

  /** Wraps a partial response with the model id + deterministic token usage. */
  private respond(partial: Pick<LLMResponse, 'kind' | 'toolCall' | 'finalAnswer'>): LLMResponse {
    const outputText = partial.finalAnswer ?? JSON.stringify(partial.toolCall ?? {});
    return {
      ...partial,
      model: this.model,
      usage: {
        inputTokens: estimateTokens(outputText) + 8,
        outputTokens: estimateTokens(outputText),
      },
    };
  }

  /** The content of the most recent `user` message, or `''` if there is none. */
  private latestTask(messages: ChatMessage[]): string {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m && m.role === 'user') return m.content;
    }
    return '';
  }

  /** Maps each already-run tool's name to the text result we got back. */
  private collectToolResults(messages: ChatMessage[]): Map<string, string> {
    const results = new Map<string, string>();
    for (const m of messages) {
      if (m.role === 'tool' && m.toolName) results.set(m.toolName, m.content);
    }
    return results;
  }

  /** Pulls a city name out of the task, defaulting to Paris for the demo. */
  private extractCity(task: string): string {
    const match = task.match(/in\s+([a-z][a-z\s]*?)(?:[,.?!]|\s+and\b|$)/i);
    return (match?.[1] ?? 'Paris').trim();
  }

  /** Builds the final answer string from the collected tool results. */
  private compose(task: string, toolResults: Map<string, string>): string {
    if (toolResults.size === 0) {
      return `I don't have any tools to consult for: "${task}". Here is my best direct answer.`;
    }
    const parts: string[] = [];
    const weather = toolResults.get('get_weather');
    const docs = toolResults.get('search_docs');
    if (weather) parts.push(weather);
    if (docs) parts.push(`Per the docs: ${docs}`);
    return parts.join(' ');
  }
}

/**
 * Runs one chat turn inside a CLIENT span named `chat <model>`, populated with
 * the GenAI semantic-convention attributes the tutorial calls out:
 * `gen_ai.operation.name`, `gen_ai.system`, `gen_ai.request.model`, and (on
 * completion) `gen_ai.usage.input_tokens` / `gen_ai.usage.output_tokens`.
 *
 * The span is a child of whatever span is active in the current context, so
 * calling this from inside the agent's root span nests it correctly.
 */
export async function tracedChat(llm: LLM, messages: ChatMessage[]): Promise<LLMResponse> {
  const tracer = getTracer();
  return tracer.startActiveSpan(
    `chat ${llm.model}`,
    { kind: SpanKind.CLIENT },
    async (span) => {
      try {
        span.setAttribute(GEN_AI.OPERATION_NAME, GEN_AI_OPERATION.CHAT);
        span.setAttribute(GEN_AI.SYSTEM, llm.system);
        span.setAttribute(GEN_AI.REQUEST_MODEL, llm.model);

        const response = await llm.chat(messages);

        span.setAttribute(GEN_AI.USAGE_INPUT_TOKENS, response.usage.inputTokens);
        span.setAttribute(GEN_AI.USAGE_OUTPUT_TOKENS, response.usage.outputTokens);
        return response;
      } finally {
        span.end();
      }
    },
  );
}
