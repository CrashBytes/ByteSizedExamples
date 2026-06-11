/**
 * A validator with a Zod-compatible `parse` that throws on invalid input.
 * Any `z.object({...})` schema satisfies this interface, but so does a
 * hand-rolled guard — the orchestrator never imports Zod itself.
 */
export interface Validator<T> {
  parse(value: unknown): T
}

/** One unit of work handed to the orchestrator. */
export interface Task<Output> {
  /** Human-readable label, surfaced in results and logs. */
  readonly name: string
  /** Do the work. May call an LLM, hit a tool, or compute locally. */
  run(): Promise<Output>
  /**
   * Optional schema. When present, the orchestrator parses each attempt's
   * output through it and treats a parse failure as a retryable error — the
   * model gets another try to produce something that validates.
   */
  readonly validate?: Validator<Output>
}

/** The outcome of running a single task, after any retries. */
export interface Settled<Output> {
  readonly name: string
  readonly status: 'fulfilled' | 'rejected'
  readonly value?: Output
  readonly reason?: Error
  /** How many attempts were made (1 = succeeded on the first try). */
  readonly attempts: number
}

/** Tuning knobs shared by `parallel` and `pipeline`. */
export interface RunOptions {
  /** Extra attempts after the first failure. Default 2 (3 tries total). */
  readonly maxRetries?: number
  /** Maximum tasks/items in flight at once. Default 4. */
  readonly concurrency?: number
}
