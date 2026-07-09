/**
 * jsonShape grader — asserts the output is valid JSON whose keys match an
 * expected type map, e.g. { "category": "string", "priority": "string" }.
 *
 * This is the deterministic path for structured-output tasks (classification,
 * tool-arg extraction) where "is it well-formed and are the fields the right
 * type" is exactly the contract you want to gate on.
 */

import type { GradeResult } from './types.js';

type TypeName = 'string' | 'number' | 'boolean' | 'object' | 'array';

function typeOf(v: unknown): TypeName | 'null' | 'undefined' {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  const t = typeof v;
  if (t === 'string' || t === 'number' || t === 'boolean' || t === 'object') return t;
  return 'undefined';
}

export function gradeJsonShape(output: string, expected: unknown): GradeResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(output);
  } catch {
    return { passed: false, notes: `output is not valid JSON: ${output.slice(0, 120)}` };
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { passed: false, notes: 'expected a JSON object' };
  }
  if (typeof expected !== 'object' || expected === null) {
    return { passed: false, notes: 'jsonShape "expected" must be a type map object' };
  }
  const shape = expected as Record<string, unknown>;
  const obj = parsed as Record<string, unknown>;
  const problems: string[] = [];
  for (const [key, wantType] of Object.entries(shape)) {
    if (!(key in obj)) {
      problems.push(`missing key "${key}"`);
      continue;
    }
    const got = typeOf(obj[key]);
    if (typeof wantType === 'string' && got !== wantType) {
      problems.push(`"${key}" is ${got}, expected ${wantType}`);
    }
  }
  return problems.length === 0
    ? { passed: true }
    : { passed: false, notes: problems.join('; ') };
}
