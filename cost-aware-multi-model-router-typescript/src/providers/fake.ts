/**
 * A scriptable in-memory provider adapter for tests and the offline demo.
 *
 * It implements the same `ProviderFn` signature the real adapters use, so you
 * can hand it to `ask(input, { call: fake.call })` and exercise the whole
 * router — classification, cheapest-capable selection, and the fallback ladder
 * — with no network and no API keys.
 *
 * Script per-model behavior: mark a model as `ok` (returns a completion) or
 * `error` (throws a `ProviderError`, retryable or not). Any model without an
 * explicit entry uses the default behavior (ok). Every call is recorded in
 * `calls` so tests can assert the exact escalation path the ladder took.
 */

import { ProviderError } from './index.js';
import type {
  CompletionRequest,
  CompletionResponse,
  ProviderFn,
} from './index.js';
import type { ModelSpec } from '../registry.js';

export type FakeBehavior =
  | { type: 'ok'; text?: string; outputTokens?: number }
  | { type: 'error'; retryable: boolean; status?: number };

const APPROX_CHARS_PER_TOKEN = 4;

export class FakeAdapter {
  /** Model ids in the order `call` was invoked — handy for assertions. */
  readonly calls: string[] = [];

  constructor(
    private readonly script: Record<string, FakeBehavior> = {},
    private readonly defaultBehavior: FakeBehavior = { type: 'ok' }
  ) {}

  readonly call: ProviderFn = async (
    model: ModelSpec,
    req: CompletionRequest
  ): Promise<CompletionResponse> => {
    this.calls.push(model.id);

    const behavior = this.script[model.id] ?? this.defaultBehavior;

    if (behavior.type === 'error') {
      throw new ProviderError(
        `fake adapter: ${model.id} returned a scripted error`,
        behavior.retryable,
        behavior.status
      );
    }

    const promptChars =
      (req.systemPrompt?.length ?? 0) + req.userPrompt.length;
    const inputTokens = Math.max(1, Math.ceil(promptChars / APPROX_CHARS_PER_TOKEN));
    const outputTokens = behavior.outputTokens ?? Math.min(req.maxOutputTokens, 200);

    return {
      text: behavior.text ?? `[fake ${model.id}] ok`,
      inputTokens,
      outputTokens,
    };
  };
}
