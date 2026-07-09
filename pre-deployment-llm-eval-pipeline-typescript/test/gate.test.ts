import { describe, it, expect } from 'vitest';
import { evaluateGate, DEFAULT_POLICY, type GatePolicy } from '../src/lib/gate.js';
import type { EvalResult } from '../src/lib/types.js';

function result(family: EvalResult['family'], passed: boolean, i: number): EvalResult {
  return {
    caseId: `${family}-${i}`,
    family,
    grader: 'exact',
    passed,
    latencyMs: 1,
    inputTokens: 1,
    outputTokens: 1,
    rawOutput: '',
  };
}

describe('evaluateGate', () => {
  it('passes when every family clears its threshold', () => {
    const results = [
      result('capability', true, 1),
      result('capability', true, 2),
      result('safety', true, 1),
      result('regression', true, 1),
      result('regression', true, 2),
    ];
    const outcome = evaluateGate(results, DEFAULT_POLICY);
    expect(outcome.passed).toBe(true);
    expect(outcome.lines.every((l) => l.ok)).toBe(true);
  });

  it('fails when a single capability case fails (zero-tolerance)', () => {
    const results = [
      result('capability', true, 1),
      result('capability', false, 2), // one fail -> 50% < 100%
      result('safety', true, 1),
    ];
    const outcome = evaluateGate(results, DEFAULT_POLICY);
    expect(outcome.passed).toBe(false);
    const cap = outcome.lines.find((l) => l.family === 'capability')!;
    expect(cap.ok).toBe(false);
    expect(cap.passRate).toBe(0.5);
  });

  it('tolerates regression slack below 100% but above the 95% floor', () => {
    // 19/20 = 0.95 -> exactly at the floor, should pass.
    const results = Array.from({ length: 20 }, (_, i) => result('regression', i !== 0, i));
    const outcome = evaluateGate(results, DEFAULT_POLICY);
    const reg = outcome.lines.find((l) => l.family === 'regression')!;
    expect(reg.passRate).toBeCloseTo(0.95, 5);
    expect(reg.ok).toBe(true);
    expect(outcome.passed).toBe(true);
  });

  it('fails regression when drift pushes it below the floor', () => {
    // 18/20 = 0.90 < 0.95 -> fail.
    const results = Array.from({ length: 20 }, (_, i) => result('regression', i > 1, i));
    const outcome = evaluateGate(results, DEFAULT_POLICY);
    expect(outcome.passed).toBe(false);
  });

  it('respects a custom, stricter policy', () => {
    const strict: GatePolicy = {
      capability: { minPassRate: 1.0 },
      safety: { minPassRate: 1.0 },
      regression: { minPassRate: 1.0 },
    };
    const results = Array.from({ length: 20 }, (_, i) => result('regression', i !== 0, i));
    expect(evaluateGate(results, strict).passed).toBe(false);
  });
});
