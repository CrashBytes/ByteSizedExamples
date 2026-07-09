/**
 * Core types for the eval harness plus a load-time validator.
 *
 * The tutorial defines these with `zod`. To keep the companion project
 * dependency-free (and identical in toolchain to the reference project) we
 * hand-roll the same shapes as TypeScript types and validate case files with
 * `parseEvalCase`, which mirrors zod's "blow up at load time, not three minutes
 * into a run" behavior — including validating `expected` against the grader.
 */

export type EvalFamily = 'capability' | 'safety' | 'regression';

export type GraderName =
  | 'exact'
  | 'substring'
  | 'regex'
  | 'refusal'
  | 'jsonShape'
  | 'snapshot'
  | 'judge';

export const GRADER_NAMES: readonly GraderName[] = [
  'exact',
  'substring',
  'regex',
  'refusal',
  'jsonShape',
  'snapshot',
  'judge',
];

export interface EvalCase {
  id: string;
  family: EvalFamily;
  capability?: string;
  input: {
    system?: string;
    user: string;
  };
  grader: GraderName;
  /**
   * Shape depends on the grader (a string for `exact`, an array for
   * `substring`, an object for `jsonShape`, a path for `snapshot`, ...). It is
   * validated against the grader by `parseEvalCase` at load time.
   */
  expected: unknown;
  tags: string[];
}

export interface EvalResult {
  caseId: string;
  family: EvalFamily;
  grader: GraderName;
  passed: boolean;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  rawOutput: string;
  graderNotes?: string;
}

/** The `{ passed, notes? }` contract every grader returns. */
export interface GradeResult {
  passed: boolean;
  notes?: string;
}

export type GraderFn = (
  output: string,
  expected: unknown,
) => GradeResult | Promise<GradeResult>;

const FAMILIES: readonly EvalFamily[] = ['capability', 'safety', 'regression'];

function fail(id: string | undefined, msg: string): never {
  throw new Error(`invalid eval case${id ? ` "${id}"` : ''}: ${msg}`);
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Validate a parsed-JSON value into a typed `EvalCase`, throwing a descriptive
 * error on any malformed field. This is the declarative "closed enum of
 * graders, expected checked against grader" discipline from the tutorial.
 */
export function parseEvalCase(raw: unknown): EvalCase {
  if (!isPlainObject(raw)) fail(undefined, 'case must be an object');
  const obj = raw as Record<string, unknown>;
  const id = obj.id;
  if (typeof id !== 'string' || id.length === 0) fail(undefined, 'id must be a non-empty string');

  const family = obj.family;
  if (typeof family !== 'string' || !FAMILIES.includes(family as EvalFamily)) {
    fail(id, `family must be one of ${FAMILIES.join(', ')}`);
  }

  if (!isPlainObject(obj.input)) fail(id, 'input must be an object');
  const input = obj.input as Record<string, unknown>;
  if (typeof input.user !== 'string' || input.user.length === 0) {
    fail(id, 'input.user must be a non-empty string');
  }
  if (input.system !== undefined && typeof input.system !== 'string') {
    fail(id, 'input.system must be a string when present');
  }

  const grader = obj.grader;
  if (typeof grader !== 'string' || !GRADER_NAMES.includes(grader as GraderName)) {
    fail(id, `grader must be one of ${GRADER_NAMES.join(', ')}`);
  }

  const g = grader as GraderName;
  const expected = obj.expected;
  validateExpected(id, g, expected);

  let tags: string[] = [];
  if (obj.tags !== undefined) {
    if (!Array.isArray(obj.tags) || !obj.tags.every((t) => typeof t === 'string')) {
      fail(id, 'tags must be an array of strings');
    }
    tags = obj.tags as string[];
  }

  return {
    id,
    family: family as EvalFamily,
    capability: typeof obj.capability === 'string' ? obj.capability : undefined,
    input: {
      system: input.system as string | undefined,
      user: input.user,
    },
    grader: g,
    expected,
    tags,
  };
}

function validateExpected(id: string, grader: GraderName, expected: unknown): void {
  switch (grader) {
    case 'exact':
    case 'regex':
    case 'snapshot':
      if (typeof expected !== 'string') {
        fail(id, `grader "${grader}" requires "expected" to be a string`);
      }
      break;
    case 'substring':
      if (
        typeof expected !== 'string' &&
        !(Array.isArray(expected) && expected.every((e) => typeof e === 'string'))
      ) {
        fail(id, 'grader "substring" requires "expected" to be a string or string[]');
      }
      break;
    case 'refusal':
    case 'jsonShape':
    case 'judge':
      if (!isPlainObject(expected)) {
        fail(id, `grader "${grader}" requires "expected" to be an object`);
      }
      break;
  }
}
