/**
 * Cost telemetry. The most important step and the one most teams skip: if you
 * cannot prove the router saved money, the router does not exist.
 *
 * The trick is `baselineCostCents` — what every request WOULD have cost on the
 * all-Opus dumb baseline, computed for free from the same token counts the real
 * call returned. That lets you answer "how much did the router save?" with a
 * one-line aggregation over these log rows.
 */

import type { PromptInput } from './classifier.js';
import type { RouterResult } from './index.js';

export interface RoutingLogEntry {
  ts: string;
  task: string;
  modelUsed: string;
  modelTier: string;
  fallbacksAttempted: number;
  estimatedCostCents: number;
  actualCostCents: number;
  inputTokens: number;
  outputTokens: number;
  // What the dumb baseline would have cost: every call to Opus 4.7.
  baselineCostCents: number;
  savedCents: number;
}

const OPUS_INPUT_PER_MILLION = 15.0;
const OPUS_OUTPUT_PER_MILLION = 75.0;

/** Build the structured telemetry row for a routed request. */
export function buildLogEntry(
  input: PromptInput,
  result: RouterResult
): RoutingLogEntry {
  const baselineCostCents =
    ((result.inputTokens / 1_000_000) * OPUS_INPUT_PER_MILLION +
      (result.outputTokens / 1_000_000) * OPUS_OUTPUT_PER_MILLION) *
    100;

  return {
    ts: new Date().toISOString(),
    task: input.task,
    modelUsed: result.modelUsed,
    modelTier: result.decision.primary.tier,
    fallbacksAttempted: result.fallbacksAttempted,
    estimatedCostCents: result.decision.estimatedCostCents,
    actualCostCents: result.actualCostCents,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    baselineCostCents: Math.round(baselineCostCents * 1000) / 1000,
    savedCents:
      Math.round((baselineCostCents - result.actualCostCents) * 1000) / 1000,
  };
}

export function logRouting(input: PromptInput, result: RouterResult): void {
  // In production: write to your metrics pipeline (DataDog, Honeycomb,
  // OpenTelemetry). Here: stdout JSON, parseable by anything.
  console.log(JSON.stringify(buildLogEntry(input, result)));
}
