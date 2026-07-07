import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { defineTool, ToolRegistry } from '../src/toolRegistry.js'
import { dispatchCall, dispatchTool } from '../src/dispatch.js'
import { resolveArguments } from '../src/repair.js'
import { MetricsCollector, type ToolCall } from '../src/types.js'
import { MockModelClient } from '../src/mockModelClient.js'

const invoiceTool = defineTool({
  name: 'create_invoice',
  description: 'Create an invoice with a positive amount and a supported currency.',
  schema: z.object({
    customerId: z.string().min(1),
    amount: z.number().positive(),
    currency: z.enum(['USD', 'EUR', 'GBP']),
  }),
  handler: args => ({ ...args, status: 'created' as const }),
})

// A model that is never consulted — used for first-pass calls that must not repair.
const neverCalled = new MockModelClient(['{}'])

describe('dispatchTool', () => {
  it('dispatches a valid first-pass call without ever calling the model', async () => {
    const call: ToolCall = {
      toolName: 'create_invoice',
      rawArguments: '{"customerId":"cus_1","amount":42,"currency":"USD"}',
    }
    const model = new MockModelClient(['{}'])
    const out = await dispatchTool(invoiceTool, call, model, {})
    expect(out.ok).toBe(true)
    if (out.ok) {
      expect(out.attempts).toBe(1)
      expect(out.result).toEqual({
        customerId: 'cus_1',
        amount: 42,
        currency: 'USD',
        status: 'created',
      })
    }
    expect(model.requests).toHaveLength(0)
  })

  it('repairs a malformed-then-corrected call and runs the handler', async () => {
    const call: ToolCall = {
      toolName: 'create_invoice',
      rawArguments: '{"customerId":"cus_2","amount":"90","currency":"pounds"}',
    }
    const model = new MockModelClient([
      '{"customerId":"cus_2","amount":90,"currency":"GBP"}',
    ])
    const out = await dispatchTool(invoiceTool, call, model, {})
    expect(out.ok).toBe(true)
    if (out.ok) {
      expect(out.attempts).toBe(2)
      expect(out.result.currency).toBe('GBP')
    }
    // The model must have been shown the specific field errors it needed to fix.
    expect(model.requests).toHaveLength(1)
    expect(model.requests[0].errors).toContain('amount')
    expect(model.requests[0].errors).toContain('currency')
  })

  it('repairs an invalid enum value in particular', async () => {
    const call: ToolCall = {
      toolName: 'create_invoice',
      rawArguments: '{"customerId":"cus_3","amount":10,"currency":"YEN"}',
    }
    const model = new MockModelClient([
      '{"customerId":"cus_3","amount":10,"currency":"EUR"}',
    ])
    const out = await dispatchTool(invoiceTool, call, model, {})
    expect(out.ok).toBe(true)
    if (out.ok) expect(out.result.currency).toBe('EUR')
    expect(model.requests[0].errors).toContain('currency')
  })

  it('gives up with exhausted_attempts when the model never fixes it', async () => {
    const call: ToolCall = {
      toolName: 'create_invoice',
      rawArguments: '{"customerId":"cus_4","amount":-1,"currency":"USD"}',
    }
    // Always returns a still-negative amount, so no attempt can validate.
    const model = new MockModelClient([
      '{"customerId":"cus_4","amount":-1,"currency":"USD"}',
    ])
    const out = await dispatchTool(invoiceTool, call, model, { maxAttempts: 3 })
    expect(out.ok).toBe(false)
    if (!out.ok) {
      expect(out.reason).toBe('exhausted_attempts')
      expect(out.attempts).toBe(3)
    }
    // 3 attempts total means exactly 2 repair turns were requested.
    expect(model.requests).toHaveLength(2)
  })

  it('never asks for a repair it cannot use when maxAttempts is 1', async () => {
    const call: ToolCall = {
      toolName: 'create_invoice',
      rawArguments: '{"customerId":"cus_5","amount":-1,"currency":"USD"}',
    }
    const model = new MockModelClient(['{"customerId":"cus_5","amount":1,"currency":"USD"}'])
    const out = await dispatchTool(invoiceTool, call, model, { maxAttempts: 1 })
    expect(out.ok).toBe(false)
    expect(model.requests).toHaveLength(0)
  })
})

describe('dispatchCall (registry)', () => {
  const registry = new ToolRegistry().register(invoiceTool)

  it('rejects an unknown tool name without touching the model', async () => {
    const call: ToolCall = { toolName: 'launch_missiles', rawArguments: '{}' }
    const out = await dispatchCall(registry, call, neverCalled, {})
    expect(out.ok).toBe(false)
    if (!out.ok) expect(out.reason).toBe('unknown_tool')
  })

  it('routes a known tool through the full validated dispatch', async () => {
    const call: ToolCall = {
      toolName: 'create_invoice',
      rawArguments: '{"customerId":"cus_6","amount":5,"currency":"USD"}',
    }
    const out = await dispatchCall(registry, call, neverCalled, {})
    expect(out.ok).toBe(true)
  })
})

describe('resolveArguments guards', () => {
  it('throws when maxAttempts is below 1', async () => {
    const call: ToolCall = { toolName: 'create_invoice', rawArguments: '{}' }
    await expect(
      resolveArguments(invoiceTool, call, neverCalled, { maxAttempts: 0 })
    ).rejects.toThrow(/at least 1/)
  })
})
