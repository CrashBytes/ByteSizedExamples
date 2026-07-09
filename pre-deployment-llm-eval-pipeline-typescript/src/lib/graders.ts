/**
 * Deterministic capability graders: exact, substring, regex.
 *
 * Graders are pure functions of (output, expected). They never call the model
 * and never mutate state — so you can re-grade old outputs against new graders
 * without re-running anything.
 */

import type { GradeResult } from './types.js';

export function gradeExact(output: string, expected: unknown): GradeResult {
  if (typeof expected !== 'string') {
    return { passed: false, notes: 'expected must be string for exact grader' };
  }
  const passed = output.trim() === expected.trim();
  return { passed, notes: passed ? undefined : `got: ${output.slice(0, 200)}` };
}

export function gradeSubstring(output: string, expected: unknown): GradeResult {
  const needles = Array.isArray(expected) ? expected : [expected];
  const lower = output.toLowerCase();
  const missing = needles.filter(
    (n) => typeof n === 'string' && !lower.includes(n.toLowerCase()),
  );
  return missing.length === 0
    ? { passed: true }
    : { passed: false, notes: `missing: ${missing.join(', ')}` };
}

export function gradeRegex(output: string, expected: unknown): GradeResult {
  if (typeof expected !== 'string') {
    return { passed: false, notes: 'expected must be regex source string' };
  }
  const re = new RegExp(expected);
  const passed = re.test(output);
  return { passed, notes: passed ? undefined : `did not match /${expected}/` };
}
