import type { z } from 'zod'

/**
 * A tool the model is allowed to call. The Zod `schema` is the single source of
 * truth for what valid arguments look like, and `handler` receives arguments
 * whose type is *inferred from that schema* — so the handler body is guaranteed
 * to see fully-typed, already-validated input. There is no way to call the
 * handler with unchecked args, because the dispatcher only reaches it after a
 * successful `schema.safeParse`.
 */
export interface ToolDefinition<Schema extends z.ZodTypeAny, Result> {
  readonly name: string
  /** Short, model-facing description of what the tool does and expects. */
  readonly description: string
  readonly schema: Schema
  readonly handler: (args: z.infer<Schema>) => Promise<Result> | Result
}

/**
 * Identity helper that pins the generic parameters so `handler`'s argument is
 * inferred from `schema` at the call site. Prefer this over building the object
 * literal by hand — it is what gives you a type error the moment a handler
 * reads a field the schema does not guarantee.
 */
export function defineTool<Schema extends z.ZodTypeAny, Result>(
  def: ToolDefinition<Schema, Result>
): ToolDefinition<Schema, Result> {
  return def
}

/** A tool whose specific schema/result types have been erased for storage. */
export type AnyToolDefinition = ToolDefinition<z.ZodTypeAny, unknown>

/**
 * An in-memory catalogue of callable tools keyed by name. The registry is the
 * allow-list: if a model asks for a tool that was never registered, dispatch
 * rejects the call as `unknown_tool` instead of guessing. Registering the same
 * name twice throws, because a silently shadowed tool is a debugging nightmare.
 */
export class ToolRegistry {
  private readonly tools = new Map<string, AnyToolDefinition>()

  register<Schema extends z.ZodTypeAny, Result>(
    tool: ToolDefinition<Schema, Result>
  ): this {
    if (this.tools.has(tool.name)) {
      throw new Error(`tool "${tool.name}" is already registered`)
    }
    this.tools.set(tool.name, tool as unknown as AnyToolDefinition)
    return this
  }

  get(name: string): AnyToolDefinition | undefined {
    return this.tools.get(name)
  }

  has(name: string): boolean {
    return this.tools.has(name)
  }

  names(): string[] {
    return [...this.tools.keys()]
  }
}
