import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { extractJson, llmTask } from '../src/llm.js'
import { parallel, runTask } from '../src/orchestrator.js'

describe('extractJson', () => {
  it('pulls JSON out of a fenced block', () => {
    const text = 'Sure!\n```json\n{"label":"bug","severity":3}\n```\nHope that helps.'
    expect(JSON.parse(extractJson(text))).toEqual({ label: 'bug', severity: 3 })
  })

  it('handles raw JSON with surrounding prose', () => {
    const text = 'The result is ["a","b"] in priority order.'
    expect(JSON.parse(extractJson(text))).toEqual(['a', 'b'])
  })

  it('throws when there is no JSON value', () => {
    expect(() => extractJson('no json here')).toThrow()
  })
})

describe('llmTask', () => {
  it('returns raw text when no schema is given', async () => {
    const task = llmTask({
      name: 'summary',
      prompt: 'summarize the ticket',
      complete: async () => 'a short summary',
    })
    const settled = await runTask(task)
    expect(settled.value).toBe('a short summary')
  })

  it('parses and validates structured output with a real Zod schema', async () => {
    const Ticket = z.object({ label: z.string(), priority: z.number().int() })
    const task = llmTask({
      name: 'classify',
      prompt: 'classify this ticket',
      complete: async () => '```json\n{"label":"billing","priority":2}\n```',
      validate: Ticket,
    })
    const settled = await runTask(task)
    expect(settled.status).toBe('fulfilled')
    expect(settled.value).toEqual({ label: 'billing', priority: 2 })
  })

  it('fans many subagents out through parallel()', async () => {
    const Label = z.object({ label: z.string() })
    const labels = ['billing', 'outage', 'feature-request']
    const tasks = labels.map((label) =>
      llmTask({
        name: `classify:${label}`,
        prompt: `classify ticket as ${label}`,
        complete: async () => `{"label":"${label}"}`,
        validate: Label,
      }),
    )
    const settled = await parallel(tasks, { concurrency: 2 })
    expect(settled.every((s) => s.status === 'fulfilled')).toBe(true)
    expect(settled.map((s) => s.value?.label)).toEqual(labels)
  })
})
