/**
 * Offline demo — no API key, no network. Run with `npm run demo`.
 *
 * It routes a mixed batch of prompts through the router against a fake in-memory
 * adapter and prints which model each was routed to, the per-call cost, the
 * running total, and — via the cost telemetry — how much the router saved
 * versus the all-Opus dumb baseline. The last request scripts the floor/mid
 * tiers to fail so you can watch the fallback ladder escalate to the frontier.
 */

import { ask, FakeAdapter, buildLogEntry } from '../src/index.js';
import type { PromptInput } from '../src/index.js';

const batch: PromptInput[] = [
  { task: 'extract', userPrompt: 'Find the email address: contact me at foo@bar.com today.' },
  { task: 'summarize', userPrompt: 'Summarize this release note: ' + 'lorem ipsum '.repeat(40) },
  { task: 'reason', userPrompt: 'Given revenues 1.2M, 1.4M, 1.1M, 1.6M, what is the trend?' },
  {
    task: 'agent',
    userPrompt: 'Audit this refactor and propose a migration plan.',
    highStakes: true,
  },
  { task: 'summarize', userPrompt: 'a'.repeat(800_000) /* ~200k tokens -> long-context */ },
];

function pad(s: string, n: number): string {
  return s.length >= n ? s : s + ' '.repeat(n - s.length);
}

async function main(): Promise<void> {
  const fake = new FakeAdapter(); // every model succeeds by default
  let runningCents = 0;
  let runningBaselineCents = 0;

  console.log('Cost-aware router — offline demo (fake adapter, no keys, no network)\n');
  console.log(
    `${pad('task', 10)}${pad('routed to', 24)}${pad('tier', 10)}${pad('cost¢', 10)}${pad(
      'running¢',
      12
    )}saved¢ vs all-Opus`
  );
  console.log('-'.repeat(84));

  for (const input of batch) {
    const result = await ask(input, { call: fake.call, log: () => {} });
    const entry = buildLogEntry(input, result);
    runningCents += result.actualCostCents;
    runningBaselineCents += entry.baselineCostCents;

    console.log(
      `${pad(input.task, 10)}${pad(result.modelUsed, 24)}${pad(result.decision.primary.tier, 10)}${pad(
        result.actualCostCents.toFixed(3),
        10
      )}${pad(runningCents.toFixed(3), 12)}${entry.savedCents.toFixed(3)}`
    );
  }

  const pct = ((1 - runningCents / runningBaselineCents) * 100).toFixed(1);
  console.log('-'.repeat(84));
  console.log(
    `\nRouted total: ${runningCents.toFixed(3)}¢   All-Opus baseline: ${runningBaselineCents.toFixed(
      3
    )}¢   Savings: ${pct}%`
  );

  // Now show the fallback ladder escalating on failure.
  console.log('\nFallback ladder demo — floor/mid tiers scripted to fail:');
  const flaky = new FakeAdapter({
    'claude-sonnet-4.6': { type: 'error', retryable: true, status: 429 },
    'gemini-3.1-pro': { type: 'error', retryable: true, status: 503 },
    'gpt-5.5-pro': { type: 'ok', text: 'audit complete' },
  });
  const escalated = await ask(
    { task: 'reason', userPrompt: 'Given revenues 1.2M, 1.4M, 1.1M, 1.6M, what is the trend?' },
    { call: flaky.call, log: () => {} }
  );
  console.log(`  ladder walked: ${flaky.calls.join(' -> ')}`);
  console.log(
    `  served by ${escalated.modelUsed} (tier ${escalated.decision.primary.tier} primary), ` +
      `after ${escalated.fallbacksAttempted} fallback(s)`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
