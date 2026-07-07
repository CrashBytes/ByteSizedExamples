/**
 * A raw tool/function call as emitted by an LLM: the tool name plus the
 * arguments exactly as the model wrote them. `rawArguments` is untrusted text —
 * it may be malformed JSON, be missing fields, carry wrong types, or invent
 * enum values. Nothing here has been validated yet.
 */
export interface ToolCall {
  readonly toolName: string
  /** The arguments exactly as the model emitted them — untrusted JSON text. */
  readonly rawArguments: string
}

/** Everything the model needs to correct a rejected tool call on a repair turn. */
export interface RepairRequest {
  readonly toolName: string
  /** A short description of the schema the args must satisfy. */
  readonly schemaDescription: string
  /** The argument text that just failed validation. */
  readonly previousArguments: string
  /** Human-readable, field-level validation errors from Zod. */
  readonly errors: string
  /** 1-based index of the repair turn (attempt 2 is the first repair). */
  readonly attempt: number
}

/**
 * The single seam between this layer and a real language model. When a tool
 * call fails validation, we hand the model the specific errors and ask for
 * corrected arguments. A deterministic mock implements this with canned
 * strings; production wraps a provider SDK. The core never imports an SDK.
 */
export interface ModelClient {
  repairToolCall(request: RepairRequest): Promise<string>
}

/** Why a tool call could not be resolved to valid, typed arguments. */
export type FailureReason = 'unknown_tool' | 'exhausted_attempts'

/** Discriminated outcome of resolving raw arguments to a validated value. */
export type ResolveResult<T> =
  | {
      readonly ok: true
      readonly toolName: string
      readonly args: T
      /** Attempts used. 1 means valid on the first pass, no repair needed. */
      readonly attempts: number
    }
  | {
      readonly ok: false
      readonly toolName: string
      readonly reason: FailureReason
      readonly attempts: number
      /** The last validation-error feedback, kept for logging. */
      readonly lastErrors: string
    }

/** Discriminated outcome of a full dispatch: resolve, then run the handler. */
export type DispatchResult<Result> =
  | {
      readonly ok: true
      readonly toolName: string
      readonly attempts: number
      readonly result: Result
    }
  | {
      readonly ok: false
      readonly toolName: string
      readonly attempts: number
      readonly reason: FailureReason
      readonly errors: string
    }

/** How a single dispatched call ended up, for metrics. */
export type CallOutcome = 'first_pass' | 'repaired' | 'failed'

/** An immutable read of the collector's counters plus derived rates. */
export interface MetricsSnapshot {
  readonly totalCalls: number
  readonly firstPassValid: number
  readonly repaired: number
  readonly failed: number
  readonly totalAttempts: number
  /** firstPassValid / totalCalls, in the range 0..1 (0 when no calls yet). */
  readonly firstPassValidRate: number
  /** repaired / totalCalls: calls that needed at least one repair but recovered. */
  readonly repairRate: number
  /** failed / totalCalls: calls that exhausted their attempts. */
  readonly failureRate: number
  /** Mean attempts per call — the direct cost of the repair loop. */
  readonly averageAttempts: number
}

/**
 * Counts the health of the tool-calling layer. `firstPassValidRate` is the
 * signal that matters most: it tells you how often the model gets the arguments
 * right without any repair, which is the cheapest and fastest path. A falling
 * first-pass rate is an early warning that a prompt, a schema, or a model
 * version has regressed.
 */
export class MetricsCollector {
  private totalCalls = 0
  private firstPassValid = 0
  private repaired = 0
  private failed = 0
  private totalAttempts = 0

  record(outcome: CallOutcome, attempts: number): void {
    this.totalCalls += 1
    this.totalAttempts += attempts
    if (outcome === 'first_pass') {
      this.firstPassValid += 1
    } else if (outcome === 'repaired') {
      this.repaired += 1
    } else {
      this.failed += 1
    }
  }

  snapshot(): MetricsSnapshot {
    const calls = this.totalCalls
    const safe = (n: number) => (calls === 0 ? 0 : n / calls)
    return {
      totalCalls: calls,
      firstPassValid: this.firstPassValid,
      repaired: this.repaired,
      failed: this.failed,
      totalAttempts: this.totalAttempts,
      firstPassValidRate: safe(this.firstPassValid),
      repairRate: safe(this.repaired),
      failureRate: safe(this.failed),
      averageAttempts: safe(this.totalAttempts),
    }
  }
}
