/**
 * Snapshot (regression) grader.
 *
 * At a known-good commit you freeze the model output as a baseline. On every
 * subsequent run the grader diffs the current output against that baseline with
 * a coarse Jaccard token similarity — coarse on purpose, so you catch DIRECTION
 * changes, not punctuation drift. `EVAL_UPDATE_SNAPSHOTS=1` is the documented
 * escape hatch: re-baseline and commit the new snapshot in the same PR that
 * justifies the behavior change.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { GradeResult } from './types.js';

export const DRIFT_THRESHOLD = 0.85;

function snapshotRoot(): string {
  return process.env.EVAL_SNAPSHOT_ROOT ?? 'src/eval/regression';
}

export function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export function jaccard(a: string[], b: string[]): number {
  const A = new Set(a);
  const B = new Set(b);
  const inter = [...A].filter((x) => B.has(x)).length;
  const union = new Set([...A, ...B]).size;
  return union === 0 ? 1 : inter / union;
}

export async function gradeSnapshot(output: string, expected: unknown): Promise<GradeResult> {
  if (typeof expected !== 'string') {
    return { passed: false, notes: 'snapshot path required' };
  }
  const path = join(snapshotRoot(), expected);
  if (process.env.EVAL_UPDATE_SNAPSHOTS === '1') {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, output, 'utf8');
    return { passed: true, notes: 'snapshot updated' };
  }
  let baseline: string;
  try {
    baseline = await readFile(path, 'utf8');
  } catch {
    return {
      passed: false,
      notes: `no snapshot at ${path}. Run with EVAL_UPDATE_SNAPSHOTS=1 to create.`,
    };
  }
  const sim = jaccard(tokenize(baseline), tokenize(output));
  return sim >= DRIFT_THRESHOLD
    ? { passed: true, notes: `similarity ${sim.toFixed(3)}` }
    : { passed: false, notes: `drift ${sim.toFixed(3)} < ${DRIFT_THRESHOLD}` };
}
