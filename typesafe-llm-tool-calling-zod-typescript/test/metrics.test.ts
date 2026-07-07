import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { defineTool } from '../src/toolRegistry.js'
import { dispatchTool } from '../src/dispatch.js'
import { MetricsCollector, type ToolCall } from '../src/types.js'
import { MockModelClient } from '../src/mockModelClient.js'

const tool = defineTool({
  name: 'set_flag',
  description: 'Set a named boolean flag.',
  schema: z.object({ name: z.string().min(1), value: z.boolean() }),
  handler: args => args,
})

describe('MetricsCollector', () => {
  it('starts at zero with safe (0) rates', () => {
    const snap = new MetricsCollector().snapshot()
    expect(snap.totalCalls).toBe(0)
    expect(snap.firstPassValidRate).toBe(0)
    expect(snap.averageAttempts).toBe(0)
  })

  it('tracks first-pass, repaired, and failed calls with correct rates', async () => {
    const metrics = new MetricsCollector()

    // First-pass valid.
    await dispatchTool(
      tool,
      { toolName: 'set_flag', rawArguments: '{"name":"a","value":true}' } satisfies ToolCall,
      new MockModelClient(['{}']),
      { metrics }
    )

    // Repaired: bad on the first pass, fixed on the repair turn.
    await dispatchTool(
      tool,
      { toolName: 'set_flag', rawArguments: '{"name":"b","value":"yes"}' } satisfies ToolCall,
      new MockModelClient(['{"name":"b","value":true}']),
      { metrics }
    )

    // Failed: never validates.
    await dispatchTool(
      tool,
      { toolName: 'set_flag', rawArguments: '{"name":"c","value":"nope"}' } satisfies ToolCall,
      new MockModelClient(['{"name":"c","value":"still-bad"}']),
      { metrics, maxAttempts: 2 }
    )

    const snap = metrics.snapshot()
    expect(snap.totalCalls).toBe(3)
    expect(snap.firstPassValid).toBe(1)
    expect(snap.repaired).toBe(1)
    expect(snap.failed).toBe(1)
    expect(snap.firstPassValidRate).toBeCloseTo(1 / 3, 5)
    expect(snap.repairRate).toBeCloseTo(1 / 3, 5)
    expect(snap.failureRate).toBeCloseTo(1 / 3, 5)
    // attempts: 1 (first-pass) + 2 (repaired) + 2 (failed) = 5 over 3 calls.
    expect(snap.totalAttempts).toBe(5)
    expect(snap.averageAttempts).toBeCloseTo(5 / 3, 5)
  })
})
