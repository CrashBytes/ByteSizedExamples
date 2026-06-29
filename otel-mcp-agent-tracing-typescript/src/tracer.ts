/**
 * Tracer access plus the semantic-convention attribute keys this library sets
 * on spans.
 *
 * Where the OpenTelemetry semantic-conventions package already defines a stable
 * constant we re-export its value (so the keys stay in lockstep with the spec).
 * GenAI keys currently live in the *incubating* entrypoint of
 * `@opentelemetry/semantic-conventions`; MCP keys are not in the package yet, so
 * we define them here against the published MCP/OTel conventions.
 */

import { type Span, type Tracer, SpanStatusCode, trace } from '@opentelemetry/api';
import {
  ATTR_GEN_AI_OPERATION_NAME,
  ATTR_GEN_AI_REQUEST_MODEL,
  ATTR_GEN_AI_SYSTEM,
  ATTR_GEN_AI_TOOL_NAME,
  ATTR_GEN_AI_USAGE_INPUT_TOKENS,
  ATTR_GEN_AI_USAGE_OUTPUT_TOKENS,
  GEN_AI_OPERATION_NAME_VALUE_CHAT,
  GEN_AI_OPERATION_NAME_VALUE_EXECUTE_TOOL,
} from '@opentelemetry/semantic-conventions/incubating';

/** Instrumentation/library name reported on every span this library emits. */
export const INSTRUMENTATION_NAME = 'otel-mcp-agent-tracing-typescript';
/** Instrumentation/library version reported on every span this library emits. */
export const INSTRUMENTATION_VERSION = '1.0.0';

/**
 * GenAI semantic-convention attribute keys (the `gen_ai.*` namespace).
 *
 * Values come from `@opentelemetry/semantic-conventions/incubating` so they
 * track the spec exactly. Kept as a small, stable object so call sites read
 * `GEN_AI.REQUEST_MODEL` instead of importing a dozen long constant names.
 */
export const GEN_AI = {
  /** `gen_ai.system` — the model provider/system, e.g. `"fake"`. */
  SYSTEM: ATTR_GEN_AI_SYSTEM,
  /** `gen_ai.request.model` — the requested model id. */
  REQUEST_MODEL: ATTR_GEN_AI_REQUEST_MODEL,
  /** `gen_ai.operation.name` — the operation, e.g. `"chat"`. */
  OPERATION_NAME: ATTR_GEN_AI_OPERATION_NAME,
  /** `gen_ai.usage.input_tokens` — prompt token count. */
  USAGE_INPUT_TOKENS: ATTR_GEN_AI_USAGE_INPUT_TOKENS,
  /** `gen_ai.usage.output_tokens` — completion token count. */
  USAGE_OUTPUT_TOKENS: ATTR_GEN_AI_USAGE_OUTPUT_TOKENS,
  /** `gen_ai.tool.name` — the tool name when modeling a tool execution. */
  TOOL_NAME: ATTR_GEN_AI_TOOL_NAME,
} as const;

/** Stable values for the `gen_ai.operation.name` attribute. */
export const GEN_AI_OPERATION = {
  /** `"chat"` — a chat-completion call. */
  CHAT: GEN_AI_OPERATION_NAME_VALUE_CHAT,
  /** `"execute_tool"` — a tool execution. */
  EXECUTE_TOOL: GEN_AI_OPERATION_NAME_VALUE_EXECUTE_TOOL,
} as const;

/**
 * MCP (Model Context Protocol) semantic-convention attribute keys.
 *
 * These are not yet shipped in `@opentelemetry/semantic-conventions`, so they
 * are defined here against the MCP wire protocol / OTel MCP conventions. The
 * literal key strings are what land on the span and what the tutorial quotes.
 */
export const MCP = {
  /** `mcp.tool.name` — the invoked MCP tool's name. */
  TOOL_NAME: 'mcp.tool.name',
  /** `mcp.method.name` — the JSON-RPC method, e.g. `"tools/call"`. */
  METHOD_NAME: 'mcp.method.name',
} as const;

/** Stable values for the `mcp.method.name` attribute. */
export const MCP_METHOD = {
  /** `"tools/call"` — the MCP method that invokes a tool. */
  TOOLS_CALL: 'tools/call',
  /** `"tools/list"` — the MCP method that lists available tools. */
  TOOLS_LIST: 'tools/list',
} as const;

/** Agent-level attribute keys this library sets on the root span. */
export const AGENT = {
  /** `agent.steps` — number of loop iterations the agent ran. */
  STEPS: 'agent.steps',
  /** `agent.task` — the task string the agent was asked to perform. */
  TASK: 'agent.task',
} as const;

/**
 * Returns the tracer for this library, named and versioned so spans are
 * attributable to `otel-mcp-agent-tracing-typescript`. Cheap to call repeatedly
 * — the SDK caches tracers by name+version.
 */
export function getTracer(): Tracer {
  return trace.getTracer(INSTRUMENTATION_NAME, INSTRUMENTATION_VERSION);
}

/**
 * Marks a span as failed: sets its status to ERROR (with the error message) and
 * records the exception as a span event. Accepts `unknown` so it can be called
 * straight from a `catch` block without narrowing first.
 */
export function recordError(span: Span, err: unknown): void {
  const error = err instanceof Error ? err : new Error(String(err));
  span.recordException(error);
  span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
}
