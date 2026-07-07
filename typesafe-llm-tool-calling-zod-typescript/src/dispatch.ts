import type { z } from 'zod'
import { resolveArguments, type RepairOptions } from './repair.js'
import type { AnyToolDefinition, ToolDefinition, ToolRegistry } from './toolRegistry.js'
import type {
  DispatchResult,
  MetricsCollector,
  ModelClient,
  ToolCall,
} from './types.js'

export interface DispatchOptions extends RepairOptions {
  /** Optional collector; when present, every dispatch records its outcome. */
  readonly metrics?: MetricsCollector
}

/**
 * Safely dispatch a raw tool call to a single, statically-known tool. This is
 * the fully-typed path: `resolveArguments` guarantees `handler` only ever runs
 * on arguments that satisfied the schema, so inside the handler `args` has the
 * exact inferred type and no `any` leaks through. A failed resolution never
 * touches the handler — it returns an `ok: false` result the caller must handle.
 */
export async function dispatchTool<Schema extends z.ZodTypeAny, Result>(
  tool: ToolDefinition<Schema, Result>,
  call: ToolCall,
  model: ModelClient,
  options: DispatchOptions = {}
): Promise<DispatchResult<Result>> {
  const resolved = await resolveArguments(tool, call, model, options)

  if (!resolved.ok) {
    options.metrics?.record('failed', resolved.attempts)
    return {
      ok: false,
      toolName: tool.name,
      attempts: resolved.attempts,
      reason: resolved.reason,
      errors: resolved.lastErrors,
    }
  }

  options.metrics?.record(resolved.attempts === 1 ? 'first_pass' : 'repaired', resolved.attempts)
  const result = await tool.handler(resolved.args)
  return { ok: true, toolName: tool.name, attempts: resolved.attempts, result }
}

/**
 * Dispatch a raw tool call through a registry. The tool name comes from the
 * model and is therefore untrusted: if it names a tool that was never
 * registered, we reject with `unknown_tool` instead of throwing or guessing.
 * Result types are erased to `unknown` on this path — that is the price of
 * dispatching by a runtime string; use `dispatchTool` when you know the tool.
 */
export async function dispatchCall(
  registry: ToolRegistry,
  call: ToolCall,
  model: ModelClient,
  options: DispatchOptions = {}
): Promise<DispatchResult<unknown>> {
  const tool: AnyToolDefinition | undefined = registry.get(call.toolName)
  if (!tool) {
    options.metrics?.record('failed', 0)
    return {
      ok: false,
      toolName: call.toolName,
      attempts: 0,
      reason: 'unknown_tool',
      errors: `no tool named "${call.toolName}" is registered`,
    }
  }
  return dispatchTool(tool, call, model, options)
}
