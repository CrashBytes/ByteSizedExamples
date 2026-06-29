/**
 * Offline demo: instruments a tool-using agent run end to end and prints the
 * resulting span tree via the console exporter.
 *
 * Run it with:  npm run demo
 *
 * No API keys, no network: the agent is driven by {@link FakeLLM} over two fake
 * MCP tools, so the output is fully deterministic. Set
 * `OTEL_EXPORTER_OTLP_ENDPOINT` to ship the same spans to a real collector
 * instead of the console.
 */

import { Agent } from '../src/agent.js';
import { FakeLLM } from '../src/llm.js';
import { createDefaultToolRegistry } from '../src/mcp-tools.js';
import { setupTelemetry } from '../src/telemetry.js';

async function main(): Promise<void> {
  // Boots tracing. With no OTEL_EXPORTER_OTLP_ENDPOINT set this uses the console
  // exporter, so finished spans print below.
  const telemetry = setupTelemetry({ serviceName: 'otel-mcp-agent-demo' });
  console.log(`[demo] telemetry exporter = ${telemetry.exporter}\n`);

  const agent = new Agent({
    llm: new FakeLLM(),
    tools: createDefaultToolRegistry(),
  });

  const task = "What's the weather in Paris, and cite the docs?";
  console.log(`[demo] task: ${task}\n`);

  const result = await agent.run(task);

  console.log(`\n[demo] final answer: ${result.answer}`);
  console.log(`[demo] steps taken: ${result.steps}\n`);

  // Flush + shut down so any batched spans are exported before we exit.
  await telemetry.shutdown();
}

main().catch((err) => {
  console.error('[demo] failed:', err);
  process.exitCode = 1;
});
