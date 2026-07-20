# Streaming Partial-JSON Parser (TypeScript)

Companion code for the CrashBytes tutorial **[Parse Streaming JSON: A Tolerant
Partial-JSON Parser for LLM Structured
Outputs](https://www.crashbytes.com/articles/parse-streaming-json-llm-partial-parser-typescript-2026)**.

A small, **zero-dependency** TypeScript library that parses an *incomplete* JSON
buffer. When an LLM streams a JSON object token by token, `JSON.parse` throws on
every prefix until the closing brace arrives — so your UI has nothing to render.
This library repairs the partial buffer at each step and returns the best-effort
value so far, letting you show fields progressively as they stream in.

```ts
import { parsePartialJson, StreamingJsonAccumulator } from "streaming-partial-json-parser-typescript";

parsePartialJson('{"name":"Ada","age":3');   // => { name: "Ada", age: 3 }
parsePartialJson('{"msg":"hel');             // => { msg: "hel" }
parsePartialJson("[1,2,3");                   // => [1, 2, 3]

// Consume a token stream chunk by chunk:
const acc = new StreamingJsonAccumulator();
acc.push('{"na');            // => {}
acc.push('me":"Ada","ag');   // => { name: "Ada" }   (dangling "ag" key dropped)
acc.push('e":3}');           // => { name: "Ada", age: 3 }
```

## Run it

```bash
npm install
npm test        # the full Vitest suite — no network, deterministic
npm run demo    # watch a triage object stream in field by field
npm run typecheck
```

## How it works

Two passes, no `eval` and no `new Function`:

1. **Tokenizer** — a single left-to-right scan that tracks string and escape
   state precisely. A `\"` is never mistaken for a string terminator, and a
   string is never closed in the middle of a `\uXXXX` escape. The scanner marks
   the final token as incomplete if the buffer ran out mid-token.
2. **Tolerant parser** — walks the tokens with a container stack, then
   auto-closes every still-open object/array. The trailing incomplete token is
   incorporated or dropped based on its grammar position (key vs. value vs.
   element).

## Documented edge-case decisions

The article should call these out explicitly — they are the interesting design
choices, and each has a dedicated test:

| Input | Result | Rule |
| --- | --- | --- |
| `""` / whitespace only | `undefined` | Never throws; nothing to parse yet. |
| `{"msg":"hel` | `{ msg: "hel" }` | Incomplete string **value** is closed and kept. |
| `{"name":"Ada","ag` | `{ name: "Ada" }` | Incomplete **key** is dropped. |
| `{"done":tr` | `{ done: true }` | Unambiguous prefix of `true`/`false`/`null` is **resolved**. |
| `{"a":xyz` | `{}` | Non-literal garbage token is dropped. |
| `{"a":1.` / `{"a":1e` / `-` | key dropped / `undefined` | Incomplete **number** is ambiguous, so dropped. |
| `[1,2,3` | `[1, 2, 3]` | A bare, already-valid number at buffer end is kept. |
| `[1,2,` / `{"a":1,` | `[1, 2]` / `{ a: 1 }` | Trailing commas and dangling keys are ignored. |
| `"...\u00` (cut mid-escape) | escape trimmed | A string is never closed inside an incomplete escape. |

The literal-resolution choice is safe because `true`, `false`, and `null` have
distinct first letters, so any non-empty prefix maps to exactly one literal.
Numbers are treated differently because a valid-looking prefix (`12`, `1.`,
`1e`) is genuinely ambiguous about the final value, so the parser waits.

**Guarantee:** for *any* prefix of a valid JSON document, `parsePartialJson`
never throws — verified by a test that feeds every prefix length of several
documents through the parser.

## API

- `parsePartialJson(buffer: string): unknown` — parse a possibly-incomplete
  buffer, returning the best-effort value (or `undefined` for empty input).
- `class StreamingJsonAccumulator`
  - `push(chunk: string): unknown` — append a chunk, re-parse, return the value.
  - `get buffer(): string` — the accumulated text.
  - `get value(): unknown` — the most recent parsed value.
  - `reset(): void` — clear both.

MIT licensed. Part of [CrashBytes/ByteSizedExamples](https://github.com/CrashBytes/ByteSizedExamples).
