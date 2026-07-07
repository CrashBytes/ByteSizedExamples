import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { extractJson, formatZodError, parseAndValidate } from '../src/validate.js'

describe('extractJson', () => {
  it('pulls a bare JSON object straight through', () => {
    expect(extractJson('{"a":1}')).toBe('{"a":1}')
  })

  it('strips conversational prose and a code fence', () => {
    const noisy = 'Sure! Here are the arguments:\n```json\n{"city":"Austin"}\n```\nLet me know!'
    expect(JSON.parse(extractJson(noisy))).toEqual({ city: 'Austin' })
  })

  it('throws when there is no JSON value at all', () => {
    expect(() => extractJson('I cannot help with that.')).toThrow(/no JSON value/)
  })
})

describe('formatZodError', () => {
  it('renders field-path-prefixed, numbered feedback', () => {
    const schema = z.object({ amount: z.number(), currency: z.enum(['USD', 'EUR']) })
    const parsed = schema.safeParse({ amount: 'ten', currency: 'dollars' })
    expect(parsed.success).toBe(false)
    if (parsed.success) return
    const feedback = formatZodError(parsed.error)
    expect(feedback).toContain('amount:')
    expect(feedback).toContain('currency:')
  })
})

describe('parseAndValidate', () => {
  const schema = z.object({ city: z.string(), units: z.enum(['celsius', 'fahrenheit']) })

  it('accepts valid JSON that matches the schema', () => {
    const result = parseAndValidate(schema, '{"city":"Austin","units":"celsius"}')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toEqual({ city: 'Austin', units: 'celsius' })
  })

  it('reports invalid JSON as a root-level error', () => {
    const result = parseAndValidate(schema, '{"city":"Austin", units:}')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors).toContain('not valid JSON')
  })

  it('reports a schema violation with the offending field', () => {
    const result = parseAndValidate(schema, '{"city":"Austin","units":"kelvin"}')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors).toContain('units:')
  })
})
