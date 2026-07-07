import { z } from 'zod'
import { defineTool, ToolRegistry } from './toolRegistry.js'
import { dispatchCall } from './dispatch.js'
import { MetricsCollector, type ToolCall } from './types.js'
import { MockModelClient } from './mockModelClient.js'

/**
 * Two sample tools. Each pairs a Zod schema with a handler whose argument type
 * is inferred from that schema — the handler body cannot read a field the
 * schema does not guarantee.
 */
const getWeather = defineTool({
  name: 'get_weather',
  description: 'Look up the current weather for a city. { city: string, units: "celsius" | "fahrenheit" }',
  schema: z.object({
    city: z.string().min(1),
    units: z.enum(['celsius', 'fahrenheit']),
  }),
  handler: args => `Weather for ${args.city} in ${args.units}: 22 degrees, clear.`,
})

const createInvoice = defineTool({
  name: 'create_invoice',
  description:
    'Create an invoice. { customerId: string, amount: number (>0), currency: "USD" | "EUR" | "GBP" }',
  schema: z.object({
    customerId: z.string().min(1),
    amount: z.number().positive(),
    currency: z.enum(['USD', 'EUR', 'GBP']),
  }),
  handler: args =>
    `Invoice for ${args.customerId}: ${args.amount.toFixed(2)} ${args.currency} created.`,
})

const registry = new ToolRegistry().register(getWeather).register(createInvoice)

async function main(): Promise<void> {
  const metrics = new MetricsCollector()

  // 1) A clean first-pass call: the model got it right, no repair needed.
  const weatherCall: ToolCall = {
    toolName: 'get_weather',
    rawArguments: '{"city":"Austin","units":"celsius"}',
  }
  const weather = await dispatchCall(registry, weatherCall, new MockModelClient(['{}']), {
    metrics,
  })
  console.log('get_weather:', weather)

  // 2) A malformed call that repairs. The model first emits a wrong enum value
  //    and a stringified amount; shown the errors, it re-emits valid arguments.
  const invoiceCall: ToolCall = {
    toolName: 'create_invoice',
    rawArguments:
      'Sure! Here are the arguments:\n```json\n{"customerId":"cus_42","amount":"120.5","currency":"dollars"}\n```',
  }
  const repairModel = new MockModelClient([
    '{"customerId":"cus_42","amount":120.5,"currency":"USD"}',
  ])
  const invoice = await dispatchCall(registry, invoiceCall, repairModel, { metrics })
  console.log('create_invoice:', invoice)

  // 3) A call the model can never fix: it keeps returning a negative amount.
  const badCall: ToolCall = {
    toolName: 'create_invoice',
    rawArguments: '{"customerId":"cus_9","amount":-5,"currency":"USD"}',
  }
  const stubborn = new MockModelClient(['{"customerId":"cus_9","amount":-5,"currency":"USD"}'])
  const failed = await dispatchCall(registry, badCall, stubborn, { metrics, maxAttempts: 3 })
  console.log('create_invoice (unfixable):', failed)

  console.log('\nmetrics:', metrics.snapshot())
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
