# Instrument an MCP Agent with OpenTelemetry Tracing (TypeScript)

Companion code for the CrashBytes tutorial. Trace an MCP-style, tool-using AI
agent end to end with OpenTelemetry: one root span per agent invocation, nested
child spans for every LLM call and every MCP tool call, all using the
OpenTelemetry GenAI (`gen_ai.*`) and MCP (`mcp.*`) semantic conventions. The
whole thing is deterministic and runs offline with **zero API keys** — a
`FakeLLM` and two fake MCP tools stand in for the real ones, so the demo and
tests are fully reproducible.

> **Tutorial:** [Instrument an MCP Agent with OpenTelemetry Distributed Tracing in TypeScript](https://crashbytes.com/tutorials/instrument-mcp-agent-opentelemetry-tracing-typescript-2026)

```ts
import { Agent, FakeLLM, createDefaultToolRegistry, setupTelemetry } from 'otel-mcp-agent-tracing-typescript';

const telemetry = setupTelemetry();              // console exporter by default
const agent = new Agent({ llm: new FakeLLM(), tools: createDefaultToolRegistry() });

const result = await agent.run("What's the weather in Paris, and cite the docs?");
console.log(result.answer);                      // -> stitched answer from both tools

await telemetry.shutdown();                       // flush spans
```

## What You'll Learn

- How to model an agent run as a **single trace**: a root `agent.invoke` span
  with nested `chat <model>` and `mcp.tool/<name>` child spans, correlated by a
  shared trace id and parent/child span ids.
- How to apply the OpenTelemetry **GenAI semantic conventions** (`gen_ai.system`,
  `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`) and the
  **MCP attributes** (`mcp.tool.name`, `mcp.method.name`) so your traces are
  portable across backends.
- How to use `tracer.startActiveSpan` for correct context propagation so child
  spans nest automatically without manual context plumbing.
- How to record errors on a span (status `ERROR` + `recordException`) so a
  failing tool call is visible in the trace.
- How to swap exporters — **console** for local dev, **OTLP/HTTP** for a real
  collector, **in-memory** for deterministic assertions in tests — behind one
  `setupTelemetry()` call.

## Prerequisites

- **Node.js 20+** (works on 20 and 22).
- Basic familiarity with TypeScript and `async/await`.
- No API keys and no running collector required for the demo or the tests.
- Optional: an OpenTelemetry collector if you want to export over OTLP/HTTP.

## Quick Start

```bash
git clone https://github.com/CrashBytes/ByteSizedExamples.git
cd ByteSizedExamples/otel-mcp-agent-tracing-typescript
npm install
npm run demo      # runs the agent offline and prints the console-exported span tree
```

Then explore:

```bash
npm run test          # vitest unit suite — no network, no API key
npm run type-check    # tsc --noEmit
npm run build         # emit dist/
```

## Project Structure

```
otel-mcp-agent-tracing-typescript/
├── src/
│   ├── telemetry.ts     # setupTelemetry(): provider + exporter wiring, TelemetryHandle
│   ├── tracer.ts        # getTracer(), recordError(), GEN_AI / MCP attribute-key constants
│   ├── llm.ts           # LLM interface, deterministic FakeLLM, tracedChat() helper
│   ├── mcp-tools.ts     # Tool interface, ToolRegistry (spans per call), get_weather / search_docs
│   ├── agent.ts         # Agent: the instrumented tool-using loop (agent.invoke root span)
│   ├── types.ts         # ChatMessage, LLMResponse, ToolCall, AgentResult, TokenUsage
│   └── index.ts         # public re-exports
├── examples/
│   └── demo.ts          # offline end-to-end run -> console span tree
├── test/
│   ├── agent.test.ts    # nested span-tree assertions (root + children, shared trace id)
│   ├── tracer.test.ts   # gen_ai.* attribute keys/values on the chat span
│   └── mcp-tools.test.ts# success result attr + ERROR span + rethrow on tool failure
├── .env.example
├── tsconfig.json
├── vitest.config.ts
├── LICENSE
└── README.md
```

## Configuration

All configuration is optional. With nothing set, the demo uses the console
exporter and a default service name, fully offline.

| Variable | Default | Effect |
| --- | --- | --- |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | _(unset)_ | When set, `setupTelemetry()` auto-selects the OTLP/HTTP exporter and ships spans to this collector endpoint (e.g. `http://localhost:4318`). |
| `OTEL_SERVICE_NAME` | `otel-mcp-agent` | The `service.name` resource attribute on every span. Overridden by the `serviceName` option if passed. |

The `exporter` option to `setupTelemetry({ exporter })` takes precedence over the
env var: `'console'` (default), `'otlp'`, or `'memory'`.

## Available Scripts

| Script | Command | Description |
| --- | --- | --- |
| `npm run demo` | `tsx examples/demo.ts` | Run the agent offline and print the console-exported span tree. |
| `npm run dev` | `tsx watch examples/demo.ts` | Re-run the demo on file changes. |
| `npm test` | `vitest run` | Run the unit suite once (no network, no API key). |
| `npm run test:watch` | `vitest` | Run the suite in watch mode. |
| `npm run type-check` | `tsc --noEmit` | Type-check without emitting. |
| `npm run build` | `tsc` | Compile to `dist/`. |

## Architecture

One agent invocation is one trace. The root `agent.invoke` span opens a loop;
each turn creates a child `chat <model>` span (the LLM call), and when the model
asks for a tool, a child `mcp.tool/<name>` span runs it. Every span is created
inside the active `agent.invoke` context, so they nest automatically and share a
single trace id.

```
Trace: agent.invoke                       (SpanKind.INTERNAL)
│   agent.task   = "What's the weather in Paris, and cite the docs?"
│   agent.steps  = 3
│
├── chat fake-router-v1                    (SpanKind.CLIENT)   step 1: route -> get_weather
│     gen_ai.operation.name     = "chat"
│     gen_ai.system             = "fake"
│     gen_ai.request.model      = "fake-router-v1"
│     gen_ai.usage.input_tokens / gen_ai.usage.output_tokens
│
├── mcp.tool/get_weather                   (SpanKind.CLIENT)
│     mcp.tool.name             = "get_weather"
│     mcp.method.name           = "tools/call"
│     gen_ai.tool.name          = "get_weather"
│     gen_ai.operation.name     = "execute_tool"
│     mcp.tool.result           = "{...forecast...}"
│
├── chat fake-router-v1                    (step 2: route -> search_docs)
│
├── mcp.tool/search_docs                   (SpanKind.CLIENT)
│     mcp.tool.name             = "search_docs"
│     mcp.method.name           = "tools/call"
│
└── chat fake-router-v1                    (step 3: final answer)
```

A failing tool call (e.g. `get_weather` with a blank `city`) sets the
`mcp.tool/<name>` span's status to `ERROR`, records the exception as a span
event, and rethrows — so the failure is visible in the trace and to the caller.

## Testing

The suite is fully deterministic and offline. Tests use
`setupTelemetry({ exporter: 'memory' })`, which captures finished spans via
`InMemorySpanExporter`, then assert against the span tree:

- **`agent.test.ts`** — one `agent.invoke` root with nested `chat ...` and
  `mcp.tool/...` children; verifies parent/child via span ids and a shared
  trace id, plus the `agent.steps` attribute.
- **`tracer.test.ts`** — the `gen_ai.*` attribute keys and values on the chat
  span.
- **`mcp-tools.test.ts`** — a successful tool span records its result attribute;
  a failing call yields an `ERROR` span with a recorded exception and rethrows.

```bash
npm test
```

> Because the OpenTelemetry global tracer provider is process-wide singleton
> state, `vitest.config.ts` runs the test files in a single fork so each test's
> `setupTelemetry()` owns the provider for its duration.

## Related

- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/)
- [OpenTelemetry JS](https://opentelemetry.io/docs/languages/js/)
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- [CrashBytes/ByteSizedExamples](https://github.com/CrashBytes/ByteSizedExamples)

## License

MIT — see [LICENSE](./LICENSE).
