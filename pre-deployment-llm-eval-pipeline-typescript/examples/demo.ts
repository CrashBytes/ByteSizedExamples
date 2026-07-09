/**
 * Offline demo — no API key, no network. Run with `npm run demo`.
 *
 * It runs the full four-family eval suite (capability, safety, regression) twice
 * against a deterministic fake model — once with a healthy "good" deployment and
 * once with a "regressed" one — and prints the scorecard plus the PASS/FAIL gate
 * verdict for each, so you can see the gate both green-light and block a deploy.
 */

import { FakeModel } from '../src/index.js';
import { runGate } from '../src/index.js';
import { renderScorecard } from '../src/index.js';

async function main(): Promise<void> {
  console.log('Scenario 1: a healthy deployment — the gate should PASS.\n');
  const good = await runGate(new FakeModel('good'));
  console.log(renderScorecard(good.modelName, good.results, good.outcome));

  console.log('\n\nScenario 2: a regressed deployment (broken prompt / worse model).');
  console.log('The gate should FAIL and, in CI, exit non-zero to block the deploy.\n');
  const bad = await runGate(new FakeModel('regressed'));
  console.log(renderScorecard(bad.modelName, bad.results, bad.outcome));

  console.log('\n' + '='.repeat(48));
  console.log(
    `Summary: good deployment -> ${good.outcome.passed ? 'PASS (exit 0)' : 'FAIL (exit 1)'}, ` +
      `regressed deployment -> ${bad.outcome.passed ? 'PASS (exit 0)' : 'FAIL (exit 1)'}.`,
  );
  console.log('Run `npm run gate` to execute the real deploy-blocking gate (exits non-zero on FAIL).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
