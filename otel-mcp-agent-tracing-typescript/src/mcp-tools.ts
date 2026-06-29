/**
 * MCP-style tools and the {@link ToolRegistry} that runs them inside spans.
 *
 * Each tool invocation is wrapped in a span named `mcp.tool/<name>` carrying the
 * MCP semantic-convention attributes `mcp.tool.name` and
 * `mcp.method.name = "tools/call"`, plus the GenAI `gen_ai.tool.name`. Successful
 * calls record a `mcp.tool.result` attribute; failures are marked ERROR and the
 * exception is recorded before being rethrown.
 */

import { SpanKind } from '@opentelemetry/api';
import {
  GEN_AI,
  GEN_AI_OPERATION,
  MCP,
  MCP_METHOD,
  getTracer,
  recordError,
} from './tracer.js';

/** A callable MCP tool. */
export interface Tool {
  /** Unique tool name (matched against {@link ToolCall.name}). */
  name: string;
  /** Human-readable description (surfaced via {@link ToolRegistry.list}). */
  description: string;
  /** Executes the tool against a JSON-object argument bag. */
  execute(args: Record<string, unknown>): Promise<unknown>;
}

/** The attribute key under which a tool's stringified result is recorded. */
export const ATTR_MCP_TOOL_RESULT = 'mcp.tool.result';

/**
 * A registry of {@link Tool}s. `call()` looks a tool up by name and runs it
 * inside an instrumented span, so every tool invocation in the agent shows up as
 * a child span with MCP attributes.
 */
export class ToolRegistry {
  private readonly tools = new Map<string, Tool>();

  /** Registers a tool. Throws if a tool with the same name already exists. */
  register(tool: Tool): this {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool already registered: ${tool.name}`);
    }
    this.tools.set(tool.name, tool);
    return this;
  }

  /** Lists the registered tools (name + description), for prompting/discovery. */
  list(): Array<{ name: string; description: string }> {
    return [...this.tools.values()].map((t) => ({
      name: t.name,
      description: t.description,
    }));
  }

  /** Whether a tool with this name is registered. */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Invokes the named tool inside a span `mcp.tool/<name>`.
   *
   * On success, records the result as `mcp.tool.result` and returns it. On
   * failure (unknown tool or the tool throwing), marks the span ERROR, records
   * the exception, then rethrows so the caller still sees the error.
   */
  async call(name: string, args: Record<string, unknown>): Promise<unknown> {
    const tracer = getTracer();
    return tracer.startActiveSpan(
      `mcp.tool/${name}`,
      { kind: SpanKind.CLIENT },
      async (span) => {
        span.setAttribute(MCP.TOOL_NAME, name);
        span.setAttribute(MCP.METHOD_NAME, MCP_METHOD.TOOLS_CALL);
        span.setAttribute(GEN_AI.TOOL_NAME, name);
        span.setAttribute(GEN_AI.OPERATION_NAME, GEN_AI_OPERATION.EXECUTE_TOOL);

        try {
          const tool = this.tools.get(name);
          if (!tool) {
            throw new Error(`Unknown tool: ${name}`);
          }
          const result = await tool.execute(args);
          span.setAttribute(ATTR_MCP_TOOL_RESULT, stringifyResult(result));
          return result;
        } catch (err) {
          recordError(span, err);
          throw err;
        } finally {
          span.end();
        }
      },
    );
  }
}

/** Stringifies a tool result for a span attribute (attributes must be scalars). */
function stringifyResult(result: unknown): string {
  if (typeof result === 'string') return result;
  return JSON.stringify(result);
}

/**
 * `get_weather` — returns a deterministic forecast for a `city` argument. The
 * forecast is derived from the city string so it is stable but varies per city.
 * Throws on a missing/blank `city` so the error-path test has something to hit.
 */
export const weatherTool: Tool = {
  name: 'get_weather',
  description: 'Get the current forecast for a city. Args: { city: string }.',
  async execute(args: Record<string, unknown>): Promise<unknown> {
    const city = typeof args.city === 'string' ? args.city.trim() : '';
    if (!city) {
      throw new Error('get_weather requires a non-empty "city" argument');
    }
    // Deterministic pseudo-forecast: pick from a fixed table by city-length parity.
    const conditions = ['sunny', 'partly cloudy', 'light rain', 'clear'];
    const condition = conditions[city.length % conditions.length] ?? 'clear';
    const tempC = 15 + (city.length % 10);
    return {
      city,
      condition,
      temperatureC: tempC,
      summary: `The weather in ${city} is ${condition} at ${tempC}°C.`,
    };
  },
};

/**
 * `search_docs` — returns a deterministic documentation snippet for a `query`
 * argument. Throws on a missing/blank `query`.
 */
export const searchDocsTool: Tool = {
  name: 'search_docs',
  description: 'Search the docs and return a relevant snippet. Args: { query: string }.',
  async execute(args: Record<string, unknown>): Promise<unknown> {
    const query = typeof args.query === 'string' ? args.query.trim() : '';
    if (!query) {
      throw new Error('search_docs requires a non-empty "query" argument');
    }
    return {
      query,
      snippet:
        'OpenTelemetry models an agent run as a trace: one root span per ' +
        'invocation with child spans for each model call and tool call.',
      source: 'docs/opentelemetry-genai.md',
    };
  },
};

/**
 * Builds a {@link ToolRegistry} pre-loaded with the two demo tools. Convenience
 * factory used by the demo and tests.
 */
export function createDefaultToolRegistry(): ToolRegistry {
  return new ToolRegistry().register(weatherTool).register(searchDocsTool);
}
