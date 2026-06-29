/**
 * Public entry point: re-exports the full surface of the
 * `otel-mcp-agent-tracing-typescript` example.
 */

// Telemetry bootstrap + lifecycle handle.
export {
  setupTelemetry,
  type TelemetryHandle,
  type TelemetryOptions,
  type ExporterKind,
} from './telemetry.js';

// Tracer access + semantic-convention attribute keys + error helper.
export {
  getTracer,
  recordError,
  GEN_AI,
  GEN_AI_OPERATION,
  MCP,
  MCP_METHOD,
  AGENT,
  INSTRUMENTATION_NAME,
  INSTRUMENTATION_VERSION,
} from './tracer.js';

// LLM interface, deterministic fake, and the traced-chat helper.
export { type LLM, FakeLLM, tracedChat, estimateTokens } from './llm.js';

// MCP tools + registry.
export {
  type Tool,
  ToolRegistry,
  weatherTool,
  searchDocsTool,
  createDefaultToolRegistry,
  ATTR_MCP_TOOL_RESULT,
} from './mcp-tools.js';

// The agent.
export { Agent, type AgentOptions } from './agent.js';

// Shared types.
export type {
  ChatMessage,
  ToolCall,
  LLMResponse,
  TokenUsage,
  AgentResult,
} from './types.js';
