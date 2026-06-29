/**
 * Verifies the agent produces the expected nested span tree: one `agent.invoke`
 * root with `chat ...` and `mcp.tool/...` children, all sharing a trace id.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ReadableSpan } from '@opentelemetry/sdk-trace-base';
import { Agent } from '../src/agent.js';
import { FakeLLM } from '../src/llm.js';
import { createDefaultToolRegistry } from '../src/mcp-tools.js';
import { setupTelemetry, type TelemetryHandle } from '../src/telemetry.js';
import { AGENT } from '../src/tracer.js';

let telemetry: TelemetryHandle;

beforeEach(() => {
  telemetry = setupTelemetry({ exporter: 'memory', serviceName: 'agent-test' });
});

afterEach(async () => {
  await telemetry.shutdown();
});

function byName(spans: ReadableSpan[], name: string): ReadableSpan[] {
  return spans.filter((s) => s.name === name);
}

describe('Agent tracing', () => {
  it('produces one agent.invoke root with nested chat and tool child spans sharing a trace', async () => {
    const agent = new Agent({ llm: new FakeLLM(), tools: createDefaultToolRegistry() });

    const result = await agent.run("What's the weather in Paris, and cite the docs?");

    expect(result.answer).toContain('Paris');
    expect(result.answer.toLowerCase()).toContain('docs');

    const spans = telemetry.getFinishedSpans();

    // Exactly one root.
    const roots = byName(spans, 'agent.invoke');
    expect(roots).toHaveLength(1);
    const root = roots[0]!;
    expect(root.parentSpanContext?.spanId).toBeUndefined();

    // The agent called both tools and chatted at least 3 times
    // (weather turn, docs turn, final-answer turn).
    const chatSpans = spans.filter((s) => s.name.startsWith('chat '));
    const weatherSpans = byName(spans, 'mcp.tool/get_weather');
    const docsSpans = byName(spans, 'mcp.tool/search_docs');
    expect(chatSpans.length).toBeGreaterThanOrEqual(3);
    expect(weatherSpans).toHaveLength(1);
    expect(docsSpans).toHaveLength(1);

    // Every non-root span is a child of the root, and they share one trace id.
    const traceId = root.spanContext().traceId;
    const rootSpanId = root.spanContext().spanId;
    const children = [...chatSpans, ...weatherSpans, ...docsSpans];
    for (const child of children) {
      expect(child.spanContext().traceId).toBe(traceId);
      expect(child.parentSpanContext?.spanId).toBe(rootSpanId);
    }

    // The root records how many steps it took.
    expect(root.attributes[AGENT.STEPS]).toBe(result.steps);
    expect(root.attributes[AGENT.TASK]).toContain('Paris');
  });

  it('respects maxSteps and still returns an answer', async () => {
    // A registry with no tools forces the weather route to never be satisfied;
    // cap steps so the loop terminates with the fallback.
    const agent = new Agent({
      llm: new FakeLLM(),
      tools: createDefaultToolRegistry(),
      maxSteps: 2,
    });
    const result = await agent.run("What's the weather in Berlin, and cite the docs?");
    expect(result.steps).toBeLessThanOrEqual(2);
    expect(typeof result.answer).toBe('string');
    expect(result.answer.length).toBeGreaterThan(0);
  });
});
