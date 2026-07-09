/**
 * The orchestrator — what your application code actually calls.
 *
 * `ask()` classifies the prompt, routes it to the cheapest capable model, and
 * walks the fallback ladder (one model per higher tier) on retryable failures.
 * The provider call and the telemetry sink are both injectable dependencies so
 * the whole thing runs offline in tests and the demo against a fake adapter.
 */

import { classify, type PromptInput } from './classifier.js';
import { route, type RoutingDecision } from './router.js';
import {
  callProvider,
  ProviderError,
  type CompletionResponse,
  type ProviderFn,
} from './providers/index.js';
import { logRouting } from './telemetry.js';

export interface RouterResult extends CompletionResponse {
  decision: RoutingDecision;
  modelUsed: string;
  actualCostCents: number;
  fallbacksAttempted: number;
}

export interface AskDeps {
  /** Provider fan-out. Defaults to the real `callProvider`; pass a fake to run offline. */
  call?: ProviderFn;
  /** Telemetry sink. Defaults to `logRouting` (stdout JSON). */
  log?: (input: PromptInput, result: RouterResult) => void;
}

export async function ask(
  input: PromptInput,
  deps: AskDeps = {}
): Promise<RouterResult> {
  const call = deps.call ?? callProvider;
  const log = deps.log ?? logRouting;

  const requirement = classify(input);
  const decision = route(requirement);

  const ladder = [decision.primary, ...decision.fallbacks];
  let lastError: unknown;

  for (let i = 0; i < ladder.length; i++) {
    const model = ladder[i];
    try {
      const completion = await call(model, {
        systemPrompt: input.systemPrompt,
        userPrompt: input.userPrompt,
        maxOutputTokens: requirement.estimatedOutputTokens,
      });

      const actualCostCents =
        ((completion.inputTokens / 1_000_000) * model.inputCostPerMillion +
          (completion.outputTokens / 1_000_000) * model.outputCostPerMillion) *
        100;

      const result: RouterResult = {
        ...completion,
        decision,
        modelUsed: model.id,
        actualCostCents: Math.round(actualCostCents * 1000) / 1000,
        fallbacksAttempted: i,
      };
      log(input, result);
      return result;
    } catch (error) {
      lastError = error;
      if (error instanceof ProviderError && !error.retryable) {
        throw error;
      }
    }
  }

  throw lastError;
}

// Public API barrel.
export {
  classify,
  type PromptInput,
  type RoutingRequirement,
} from './classifier.js';
export {
  route,
  estimatedCostCents,
  type RoutingDecision,
} from './router.js';
export {
  MODELS,
  type ModelSpec,
  type Capability,
} from './registry.js';
export {
  callProvider,
  ProviderError,
  FakeAdapter,
  type FakeBehavior,
  type CompletionRequest,
  type CompletionResponse,
  type ProviderFn,
} from './providers/index.js';
export {
  logRouting,
  buildLogEntry,
  type RoutingLogEntry,
} from './telemetry.js';
