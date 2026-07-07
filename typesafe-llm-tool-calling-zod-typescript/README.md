# typesafe-llm-tool-calling-zod-typescript

A type-safe, provider-agnostic layer for handling LLM tool/function calls in
TypeScript. When a model emits a tool call, the arguments arrive as untyped,
often-malformed JSON that is unsafe to execute directly. This project:

1. Defines each tool as a **Zod schema + typed handler** in a registry
   (`toolRegistry.ts`).
2. **Parses and validates** the model's raw argument text against the schema
   (`validate.ts`), turning `ZodError`s into human-readable, field-level
   feedback.
3. On failure, runs a **bounded auto-repair loop** (`repair.ts`) — feeding the
   specific validation errors back to the model so it re-emits corrected
   arguments — with a hard `maxAttempts` cap.
4. **Safely dispatches** the validated, fully-typed args to the handler
   (`dispatch.ts`) and returns a typed result.
5. Tracks **repair-rate / first-pass-valid metrics** (`MetricsCollector` in
   `types.ts`).

Companion code for the CrashBytes tutorial *"Build a Type-Safe LLM Tool-Calling
Layer in TypeScript: Zod Validation and Auto-Repair."*

## Run it

```bash
npm install
npm run typecheck   # tsc --noEmit
npm test            # vitest run
npm run example     # tsx src/example.ts
```

Every test is deterministic and offline — the only "model" is `MockModelClient`,
which returns canned strings. No network, no API key.

## Layout

| File                   | Role                                                            |
| ---------------------- | -------------------------------------------------------------- |
| `src/toolRegistry.ts`  | `defineTool` + `ToolRegistry` (schema + typed handler)         |
| `src/validate.ts`      | JSON extraction, `parseAndValidate`, Zod-error feedback        |
| `src/repair.ts`        | `resolveArguments` — the bounded auto-repair loop              |
| `src/dispatch.ts`      | `dispatchTool` / `dispatchCall` — safe typed dispatch          |
| `src/types.ts`         | `ModelClient`, `ToolCall`, result unions, `MetricsCollector`   |
| `src/mockModelClient.ts` | Deterministic `ModelClient` for tests/example                |
| `src/example.ts`       | Wires `get_weather` / `create_invoice` through the full flow   |
| `src/index.ts`         | Barrel export                                                  |

## Wiring a real provider

`ModelClient.repairToolCall` is the only seam to a live model. Implement it
against your provider SDK (returning corrected argument text) and the rest of
the layer is unchanged.
