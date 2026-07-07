import type { z } from 'zod'
import type { ToolDefinition } from './toolRegistry.js'
import type { ModelClient, ResolveResult, ToolCall } from './types.js'
import { parseAndValidate } from './validate.js'

const DEFAULT_MAX_ATTEMPTS = 3

export interface RepairOptions {
  /**
   * Total attempts allowed, including the first pass. Must be at least 1. A
   * value of 1 disables repair entirely (validate once, then give up). Default
   * is 3: the first pass plus two repair turns.
   */
  readonly maxAttempts?: number
  /** Optional schema description fed to the model on repair. Defaults to the tool's own description. */
  readonly schemaDescription?: string
}

/**
 * Resolve a raw tool call to validated, fully-typed arguments, running a
 * BOUNDED auto-repair loop on failure.
 *
 * The loop is the heart of the layer. On each attempt we parse and validate the
 * current argument text. On success we return the typed value and the attempt
 * count. On failure we feed the *specific* Zod errors back to the model and ask
 * it to re-emit corrected arguments — but only while attempts remain. The hard
 * cap is what separates a self-healing layer from an infinite, token-burning
 * loop: a model that cannot satisfy the schema will fail the same way forever,
 * so we stop and settle as `exhausted_attempts` rather than asking again.
 */
export async function resolveArguments<Schema extends z.ZodTypeAny, Result>(
  tool: ToolDefinition<Schema, Result>,
  call: ToolCall,
  model: ModelClient,
  options: RepairOptions = {}
): Promise<ResolveResult<z.infer<Schema>>> {
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS
  if (maxAttempts < 1) {
    throw new Error('maxAttempts must be at least 1')
  }
  const schemaDescription = options.schemaDescription ?? tool.description

  let current = call.rawArguments
  let lastErrors = ''

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = parseAndValidate(tool.schema, current)
    if (result.ok) {
      return { ok: true, toolName: tool.name, args: result.value, attempts: attempt }
    }
    lastErrors = result.errors

    // Do not ask for a repair we have no attempt left to validate — that would
    // burn a model call whose result we could never use.
    if (attempt >= maxAttempts) {
      break
    }

    current = await model.repairToolCall({
      toolName: tool.name,
      schemaDescription,
      previousArguments: current,
      errors: lastErrors,
      attempt: attempt + 1,
    })
  }

  return {
    ok: false,
    toolName: tool.name,
    reason: 'exhausted_attempts',
    attempts: maxAttempts,
    lastErrors,
  }
}
