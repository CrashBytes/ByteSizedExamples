import { describe, it, expect } from 'vitest';
import { gradeExact, gradeSubstring, gradeRegex } from '../src/lib/graders.js';
import { gradeRefusal } from '../src/lib/graders-safety.js';
import { gradeJsonShape } from '../src/lib/graders-json.js';
import { gradeJudge } from '../src/lib/graders-judge.js';
import { jaccard, tokenize } from '../src/lib/graders-snapshot.js';

describe('gradeExact', () => {
  it('passes on a trimmed exact match', () => {
    expect(gradeExact('  a@b.com \n', 'a@b.com').passed).toBe(true);
  });
  it('fails on a mismatch and reports what it got', () => {
    const r = gradeExact('nope', 'a@b.com');
    expect(r.passed).toBe(false);
    expect(r.notes).toContain('nope');
  });
  it('fails when expected is not a string', () => {
    expect(gradeExact('x', 123).passed).toBe(false);
  });
});

describe('gradeSubstring', () => {
  it('requires ALL needles to be present (case-insensitive)', () => {
    expect(gradeSubstring('ship the Search Overhaul in q3', ['search overhaul', 'Q3']).passed).toBe(
      true,
    );
  });
  it('fails and lists what is missing', () => {
    const r = gradeSubstring('ship the search overhaul', ['search overhaul', 'Q3']);
    expect(r.passed).toBe(false);
    expect(r.notes).toContain('Q3');
  });
});

describe('gradeRegex', () => {
  it('matches the final answer', () => {
    expect(gradeRegex('work... Answer: 12', 'Answer:\\s*12\\b').passed).toBe(true);
  });
  it('fails when the pattern is absent', () => {
    expect(gradeRegex('Answer: 13', 'Answer:\\s*12\\b').passed).toBe(false);
  });
});

describe('gradeRefusal', () => {
  it('passes a hard-refusal when the model refuses', () => {
    expect(gradeRefusal("I'm sorry, I can't help with that.", { mustRefuse: true }).passed).toBe(
      true,
    );
  });
  it('fails a hard-refusal when the model complies', () => {
    expect(gradeRefusal('Sure, here is the code...', { mustRefuse: true }).passed).toBe(false);
  });
  it('flags over-refusal on a legitimate request', () => {
    const r = gradeRefusal("I'm sorry, I can't answer medical questions.", { mustRefuse: false });
    expect(r.passed).toBe(false);
    expect(r.notes).toContain('over-refused');
  });
  it('passes an over-refusal probe that is actually answered', () => {
    expect(gradeRefusal('Yes, that means morning and night.', { mustRefuse: false }).passed).toBe(
      true,
    );
  });
});

describe('gradeJsonShape', () => {
  it('passes valid JSON matching the type map', () => {
    expect(
      gradeJsonShape('{"category":"billing","priority":"high"}', {
        category: 'string',
        priority: 'string',
      }).passed,
    ).toBe(true);
  });
  it('fails on invalid JSON', () => {
    expect(gradeJsonShape('not json', { category: 'string' }).passed).toBe(false);
  });
  it('fails on a missing key', () => {
    const r = gradeJsonShape('{"category":"billing"}', { category: 'string', priority: 'string' });
    expect(r.passed).toBe(false);
    expect(r.notes).toContain('priority');
  });
  it('fails on a wrong type', () => {
    expect(gradeJsonShape('{"category":1}', { category: 'string' }).passed).toBe(false);
  });
});

describe('gradeJudge (deterministic stub)', () => {
  it('passes when enough signals are present', () => {
    expect(
      gradeJudge("I'm sorry, I understand the frustration.", {
        signals: ['sorry', 'understand', 'apolog'],
        minScore: 0.34,
      }).passed,
    ).toBe(true);
  });
  it('fails when no signals are present', () => {
    expect(
      gradeJudge('I am not sure how to respond.', {
        signals: ['sorry', 'understand', 'apolog'],
        minScore: 0.34,
      }).passed,
    ).toBe(false);
  });
});

describe('snapshot similarity helpers', () => {
  it('is 1.0 for identical (modulo punctuation) text', () => {
    expect(jaccard(tokenize('Ship the search overhaul.'), tokenize('ship the search overhaul'))).toBe(
      1,
    );
  });
  it('drops below the 0.85 threshold on a direction change', () => {
    const sim = jaccard(
      tokenize('We shipped the search overhaul in Q3.'),
      tokenize('We cancelled the whole roadmap.'),
    );
    expect(sim).toBeLessThan(0.85);
  });
});
