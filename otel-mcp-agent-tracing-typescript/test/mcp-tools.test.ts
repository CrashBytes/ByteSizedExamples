/**
 * Verifies the ToolRegistry span behavior: successful calls record their result
 * attribute with MCP keys, and failing calls produce an ERROR span with a
 * recorded exception while still rethrowing.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SpanStatusCode } from '@opentelemetry/api';
import {
  ATTR_MCP_TOOL_RESULT,
  createDefaultToolRegistry,
  weatherTool,
} from '../src/mcp-tools.js';
import { setupTelemetry, type TelemetryHandle } from '../src/telemetry.js';

let telemetry: TelemetryHandle;

beforeEach(() => {
  telemetry = setupTelemetry({ exporter: 'memory', serviceName: 'tools-test' });
});

afterEach(async () => {
  await telemetry.shutdown();
});

describe('ToolRegistry tracing', () => {
  it('records a successful tool call with MCP attributes and the result', async () => {
    const registry = createDefaultToolRegistry();

    const result = (await registry.call('get_weather', { city: 'Paris' })) as {
      summary: string;
    };
    expect(result.summary).toContain('Paris');

    const span = telemetry.getFinishedSpans().find((s) => s.name === 'mcp.tool/get_weather');
    expect(span).toBeDefined();

    const attrs = span!.attributes;
    expect(attrs['mcp.tool.name']).toBe('get_weather');
    expect(attrs['mcp.method.name']).toBe('tools/call');
    expect(attrs['gen_ai.tool.name']).toBe('get_weather');
    expect(attrs['gen_ai.operation.name']).toBe('execute_tool');
    expect(String(attrs[ATTR_MCP_TOOL_RESULT])).toContain('Paris');

    // A success leaves the span status unset (UNSET = 0), not ERROR.
    expect(span!.status.code).not.toBe(SpanStatusCode.ERROR);
  });

  it('marks the span ERROR, records the exception, and rethrows on tool failure', async () => {
    const registry = createDefaultToolRegistry();

    // weatherTool throws on a blank city.
    await expect(registry.call('get_weather', { city: '' })).rejects.toThrow(
      /non-empty "city"/,
    );

    const span = telemetry.getFinishedSpans().find((s) => s.name === 'mcp.tool/get_weather');
    expect(span).toBeDefined();
    expect(span!.status.code).toBe(SpanStatusCode.ERROR);

    // The exception was recorded as a span event.
    const exceptionEvents = span!.events.filter((e) => e.name === 'exception');
    expect(exceptionEvents.length).toBeGreaterThanOrEqual(1);
    expect(String(exceptionEvents[0]!.attributes?.['exception.message'])).toContain(
      'city',
    );
  });

  it('rethrows for an unknown tool and marks the span ERROR', async () => {
    const registry = createDefaultToolRegistry();
    await expect(registry.call('does_not_exist', {})).rejects.toThrow(/Unknown tool/);

    const span = telemetry.getFinishedSpans().find((s) => s.name === 'mcp.tool/does_not_exist');
    expect(span).toBeDefined();
    expect(span!.status.code).toBe(SpanStatusCode.ERROR);
  });

  it('lists registered tools and reports membership', () => {
    const registry = createDefaultToolRegistry();
    const names = registry.list().map((t) => t.name);
    expect(names).toContain('get_weather');
    expect(names).toContain('search_docs');
    expect(registry.has(weatherTool.name)).toBe(true);
    expect(registry.has('nope')).toBe(false);
  });
});
