/**
 * LLM-as-judge grader — STUBBED with a deterministic fake.
 *
 * The tutorial deliberately leaves LLM-as-judge out of the core gate (it
 * introduces its own drift). We include a deterministic stand-in so the pattern
 * is wired end to end without a network call: instead of asking a model to
 * grade the output, we score the presence of expected "signals" and pass when
 * the ratio clears `minScore`. In production you swap this body for a real
 * model call — the grader interface does not change.
 */

import type { GradeResult } from './types.js';

export function gradeJudge(output: string, expected: unknown): GradeResult {
  if (typeof expected !== 'object' || expected === null) {
    return { passed: false, notes: 'judge "expected" must be an object' };
  }
  const spec = expected as { signals?: unknown; minScore?: unknown };
  const signals = Array.isArray(spec.signals)
    ? spec.signals.filter((s): s is string => typeof s === 'string')
    : [];
  const minScore = typeof spec.minScore === 'number' ? spec.minScore : 0.5;
  if (signals.length === 0) {
    return { passed: false, notes: 'judge "expected.signals" must be a non-empty string[]' };
  }
  const lower = output.toLowerCase();
  const hits = signals.filter((s) => lower.includes(s.toLowerCase()));
  const score = hits.length / signals.length;
  return score >= minScore
    ? { passed: true, notes: `judge score ${score.toFixed(2)} (${hits.length}/${signals.length})` }
    : {
        passed: false,
        notes: `judge score ${score.toFixed(2)} < ${minScore} (matched: ${hits.join(', ') || 'none'})`,
      };
}
