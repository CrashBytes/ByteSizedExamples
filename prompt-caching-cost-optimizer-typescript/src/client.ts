/**
 * A thin caching-aware wrapper around the Anthropic Messages API.
 *
 * `CachingClient.ask` ties the three pieces together: it plans the request
 * (placing the cache breakpoint), sends it, and computes realized savings from
 * the response's `usage`. The Anthropic client is DEPENDENCY-INJECTED via a
 * minimal structural interface (`MessagesCreator`) so the whole flow is unit-
 * testable offline with a fake — no network, no API key.
 */

import type { CachePlan, PlanInput, UsageLike } from "./types.js";
import { planRequest } from "./cache-planner.js";
import { computeSavings, type SavingsReport } from "./savings.js";

/**
 * The minimal surface this client needs from an Anthropic SDK client. A real
 * `@anthropic-ai/sdk` `Anthropic` instance satisfies this structurally, so you
 * can pass the real client in production and a fake recorder in tests.
 */
export interface MessagesCreator {
  messages: {
    create(
      body: Record<string, unknown>,
    ): Promise<{ usage: UsageLike; content: unknown }>;
  };
}

export interface CachingClientOptions {
  /** The Anthropic client (or any `MessagesCreator`-shaped fake). */
  anthropic: MessagesCreator;
  /** Default model for `ask` calls that don't specify one. */
  model?: string;
  /** Default `max_tokens` for completions. */
  maxTokens?: number;
}

const DEFAULT_MODEL = "claude-opus-4-8";
const DEFAULT_MAX_TOKENS = 1024;

export class CachingClient {
  private readonly anthropic: MessagesCreator;
  private readonly model: string;
  private readonly maxTokens: number;

  constructor(opts: CachingClientOptions) {
    this.anthropic = opts.anthropic;
    this.model = opts.model ?? DEFAULT_MODEL;
    this.maxTokens = opts.maxTokens ?? DEFAULT_MAX_TOKENS;
  }

  /**
   * Plan, send, and analyze a single cached request.
   *
   * Returns the raw `response`, the `plan` that was sent (so callers can
   * inspect `plan.warnings` — e.g. a below-minimum prefix that silently won't
   * cache), and the `savings` computed from the response's `usage`.
   *
   * The request body maps 1:1 to the Messages API: the planner's
   * `cache_control`-annotated `system` blocks, the passed-through `tools`, and
   * the volatile `messages` all go on the wire exactly as planned.
   */
  async ask(
    input: Omit<PlanInput, "model"> & { model?: string },
  ): Promise<{
    response: { usage: UsageLike; content: unknown };
    plan: CachePlan;
    savings: SavingsReport;
  }> {
    const model = input.model ?? this.model;
    const plan = planRequest({ ...input, model });

    const response = await this.anthropic.messages.create({
      model,
      max_tokens: this.maxTokens,
      system: plan.system,
      tools: plan.tools,
      messages: plan.messages,
    });

    const savings = computeSavings(model, response.usage, input.ttl);
    return { response, plan, savings };
  }
}
