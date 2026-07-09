/**
 * The gate entrypoint — `npm run gate` (alias `npm run eval`).
 *
 * Runs the full case suite against the fake model (offline, no keys) and applies
 * the gate policy. It prints the scorecard and, crucially, EXITS NON-ZERO when
 * the gate fails — this is the deploy-blocking behavior. In CI you run this as
 * the final step so a failing gate fails the check and blocks the merge.
 *
 *   npm run gate                          # passing suite  -> exit 0
 *   EVAL_MODEL_MODE=regressed npm run gate # regressed model -> exit 1
 *   npm run gate -- --fail                 # same, via a flag
 */

import { FakeModel, type FakeMode } from './lib/fake-model.js';
import { runGate } from './lib/harness.js';
import { renderScorecard } from './lib/report.js';

async function main(): Promise<void> {
  const forceFail = process.argv.includes('--fail');
  const mode: FakeMode =
    forceFail || process.env.EVAL_MODEL_MODE === 'regressed' ? 'regressed' : 'good';

  const model = new FakeModel(mode);
  const { modelName, results, outcome } = await runGate(model);

  console.log(renderScorecard(modelName, results, outcome));

  process.exit(outcome.passed ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
