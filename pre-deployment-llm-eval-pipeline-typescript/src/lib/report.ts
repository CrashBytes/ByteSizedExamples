/**
 * Human-readable scorecard. In CI this is what gets rendered into the sticky PR
 * comment; locally it is what `npm run demo` / `npm run gate` print. It reports
 * the per-family pass rates, the individual failures (with grader notes), and
 * the final PASS/FAIL verdict.
 */

import type { EvalResult } from './types.js';
import type { GateOutcome } from './gate.js';

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export function renderScorecard(
  modelName: string,
  results: EvalResult[],
  outcome: GateOutcome,
): string {
  const lines: string[] = [];
  lines.push('LLM Pre-Deployment Eval Gate');
  lines.push('='.repeat(48));
  lines.push(`model:  ${modelName}`);
  lines.push(`cases:  ${results.length}`);
  lines.push('');

  for (const l of outcome.lines) {
    const flag = l.ok ? 'PASS' : 'FAIL';
    lines.push(
      `  ${l.family.padEnd(12)} ${pct(l.passRate).padStart(6)} ` +
        `(${l.passed}/${l.total}, need ${pct(l.minPassRate)})  ${flag}`,
    );
  }

  const failures = results.filter((r) => !r.passed);
  if (failures.length > 0) {
    lines.push('');
    lines.push(`Failing cases (${failures.length}):`);
    for (const f of failures) {
      lines.push(`  - [${f.family}] ${f.caseId} (${f.grader}): ${f.graderNotes ?? 'failed'}`);
    }
  }

  const totalTokens = results.reduce((s, r) => s + r.inputTokens + r.outputTokens, 0);
  const totalLatency = results.reduce((s, r) => s + r.latencyMs, 0);
  lines.push('');
  lines.push(`tokens: ${totalTokens}   latency: ${totalLatency}ms`);
  lines.push('-'.repeat(48));
  lines.push(`GATE: ${outcome.passed ? 'PASS — safe to deploy' : 'FAIL — deploy blocked'}`);
  return lines.join('\n');
}
