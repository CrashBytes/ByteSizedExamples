import { describe, it, expect } from 'vitest'
import {
  exactMatch,
  includes,
  regexMatch,
  similarity,
  jsonField,
  levenshtein,
} from '../src/scorers.js'
import type { TestCase } from '../src/types.js'

const tc = (input = 'q', expected?: string): TestCase => ({ id: 't', input, expected })

describe('deterministic scorers', () => {
  it('exactMatch is case-insensitive and trimmed by default', () => {
    expect(exactMatch().score({ output: ' Hello ', expected: 'hello', testCase: tc('q', 'hello') })).toBe(1)
    expect(
      exactMatch({ caseSensitive: true }).score({ output: 'Hello', expected: 'hello', testCase: tc('q', 'hello') }),
    ).toBe(0)
  })

  it('exactMatch returns 0 when there is no expected value', () => {
    expect(exactMatch().score({ output: 'anything', testCase: tc() })).toBe(0)
  })

  it('includes checks substring membership', () => {
    expect(includes().score({ output: 'the answer is 42', expected: '42', testCase: tc('q', '42') })).toBe(1)
    expect(includes().score({ output: 'nope', expected: '42', testCase: tc('q', '42') })).toBe(0)
  })

  it('regexMatch tests a format pattern', () => {
    expect(regexMatch(/^\d{3}-\d{4}$/).score({ output: '555-1234', testCase: tc() })).toBe(1)
    expect(regexMatch(/^\d{3}-\d{4}$/).score({ output: 'phone', testCase: tc() })).toBe(0)
  })

  it('similarity returns 1 for identical and a fraction for edits', () => {
    expect(similarity().score({ output: 'kitten', expected: 'kitten', testCase: tc('q', 'kitten') })).toBe(1)
    const partial = similarity().score({ output: 'kitten', expected: 'sitting', testCase: tc('q', 'sitting') }) as number
    expect(partial).toBeGreaterThan(0)
    expect(partial).toBeLessThan(1)
  })

  it('levenshtein computes classic edit distance', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3)
    expect(levenshtein('', 'abc')).toBe(3)
    expect(levenshtein('abc', 'abc')).toBe(0)
  })

  it('jsonField parses fenced JSON and compares one field', () => {
    const output = 'Here you go:\n```json\n{ "sentiment": "positive", "score": 0.9 }\n```'
    expect(jsonField('sentiment').score({ output, expected: 'positive', testCase: tc('q', 'positive') })).toBe(1)
    expect(jsonField('sentiment').score({ output, expected: 'negative', testCase: tc('q', 'negative') })).toBe(0)
  })

  it('jsonField returns 0 on unparseable output instead of throwing', () => {
    expect(jsonField('sentiment').score({ output: 'not json at all', expected: 'x', testCase: tc('q', 'x') })).toBe(0)
  })
})
