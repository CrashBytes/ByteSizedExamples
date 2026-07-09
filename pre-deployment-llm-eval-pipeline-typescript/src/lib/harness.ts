/**
 * Convenience wiring used by both the CLI and the demo: load every case family
 * from disk, run them against a model, and apply the gate policy.
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadCases, runSuite } from './runner.js';
import { evaluateGate, DEFAULT_POLICY, type GatePolicy, type GateOutcome } from './gate.js';
import type { EvalResult } from './types.js';
import type { Model } from './model.js';

/** The three case-family roots that ship with this repo. */
export function defaultCaseRoots(): string[] {
  const here = dirname(fileURLToPath(import.meta.url)); // src/lib
  const evalRoot = join(here, '..', 'eval'); // src/eval
  return [
    join(evalRoot, 'capability'),
    join(evalRoot, 'safety'),
    join(evalRoot, 'regression'),
  ];
}

export interface HarnessRun {
  modelName: string;
  results: EvalResult[];
  outcome: GateOutcome;
}

export async function runGate(
  model: Model,
  policy: GatePolicy = DEFAULT_POLICY,
  roots: string[] = defaultCaseRoots(),
): Promise<HarnessRun> {
  const cases = await loadCases(roots);
  const results = await runSuite(cases, model);
  const outcome = evaluateGate(results, policy);
  return { modelName: model.name, results, outcome };
}
