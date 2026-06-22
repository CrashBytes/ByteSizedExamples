/**
 * Offline demo — no API key, no network. Run with `npm run demo`.
 *
 * It builds a two-provider chain where the primary is "down" and watches the
 * client retry, fail over, and (after enough failures) trip the primary's
 * circuit breaker so later calls skip it entirely.
 */

import { ResilientClient, FakeProvider, ServerError } from '../src/index.js';

async function main(): Promise<void> {
  const primary = new FakeProvider('primary', [
    // Always fails — simulates a provider outage.
    { type: 'error', error: new ServerError('primary is having a bad day', 503) },
  ]);
  const secondary = new FakeProvider('secondary', [{ type: 'ok', text: 'Hello from the backup model.' }]);

  const client = new ResilientClient({
    providers: [primary, secondary],
    timeoutMs: 5_000,
    retry: { maxAttempts: 2, baseDelayMs: 50 },
    breaker: { failureThreshold: 2, cooldownMs: 10_000 },
    onProviderError: ({ provider, error }) =>
      console.log(`  ✗ ${provider} failed: ${(error as Error).message}`),
    onFailover: ({ from, to }) => console.log(`  → failing over ${from} → ${to}`),
  });

  for (let i = 1; i <= 3; i++) {
    console.log(`\nRequest ${i} (primary circuit: ${client.breakerState('primary')})`);
    const res = await client.chat({ messages: [{ role: 'user', content: 'Say hello.' }] });
    console.log(`  ✓ served by ${res.provider}: ${JSON.stringify(res.text)}`);
  }

  console.log(`\nFinal primary circuit state: ${client.breakerState('primary')}`);
  console.log('Notice request 3 skips the primary entirely — its breaker is open.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
