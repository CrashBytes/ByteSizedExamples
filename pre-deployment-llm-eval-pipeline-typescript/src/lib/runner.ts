/**
 * The runner ties cases to graders and to the model under test.
 *
 * `loadCases` reads and validates the JSON case files from disk (a malformed
 * file blows up here, not mid-run). `runSuite` is intentionally SERIAL — eval
 * runs are not the place to chase concurrency; serial logs are readable when
 * something goes wrong, and providers rate-limit anyway. Parallelize at the
 * suite level (separate CI jobs), not the case level.
 */

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  parseEvalCase,
  type EvalCase,
  type EvalFamily,
  type EvalResult,
  type GraderFn,
} from './types.js';
import { gradeExact, gradeSubstring, gradeRegex } from './graders.js';
import { gradeRefusal } from './graders-safety.js';
import { gradeSnapshot } from './graders-snapshot.js';
import { gradeJsonShape } from './graders-json.js';
import { gradeJudge } from './graders-judge.js';
import type { Model } from './model.js';

export const GRADERS: Record<string, GraderFn> = {
  exact: gradeExact,
  substring: gradeSubstring,
  regex: gradeRegex,
  refusal: gradeRefusal,
  snapshot: gradeSnapshot,
  jsonShape: gradeJsonShape,
  judge: gradeJudge,
};

export async function loadCases(roots: string[]): Promise<EvalCase[]> {
  const cases: EvalCase[] = [];
  for (const root of roots) {
    let files: string[];
    try {
      files = (await readdir(root, { recursive: true })).map((f) => f.toString());
    } catch {
      continue; // a missing family directory is not fatal
    }
    for (const f of files) {
      if (!f.endsWith('.json')) continue;
      const raw = await readFile(join(root, f), 'utf8');
      cases.push(parseEvalCase(JSON.parse(raw)));
    }
  }
  cases.sort((a, b) => a.id.localeCompare(b.id));
  return cases;
}

export async function runSuite(cases: EvalCase[], model: Model): Promise<EvalResult[]> {
  const results: EvalResult[] = [];
  for (const c of cases) {
    const r = await model.runOnce(c.input.system, c.input.user);
    const grader = GRADERS[c.grader];
    const g = await grader(r.output, c.expected);
    results.push({
      caseId: c.id,
      family: c.family,
      grader: c.grader,
      passed: g.passed,
      latencyMs: r.latencyMs,
      inputTokens: r.inputTokens,
      outputTokens: r.outputTokens,
      rawOutput: r.output,
      graderNotes: g.notes,
    });
  }
  return results;
}

export interface FamilySummary {
  family: EvalFamily;
  total: number;
  passed: number;
  passRate: number;
}

/** Aggregate per-family pass rates from a completed run. */
export function aggregate(results: EvalResult[]): FamilySummary[] {
  const byFamily = new Map<EvalFamily, { total: number; passed: number }>();
  for (const r of results) {
    const acc = byFamily.get(r.family) ?? { total: 0, passed: 0 };
    acc.total += 1;
    if (r.passed) acc.passed += 1;
    byFamily.set(r.family, acc);
  }
  const order: EvalFamily[] = ['capability', 'safety', 'regression'];
  return order
    .filter((f) => byFamily.has(f))
    .map((family) => {
      const { total, passed } = byFamily.get(family)!;
      return { family, total, passed, passRate: total === 0 ? 1 : passed / total };
    });
}
