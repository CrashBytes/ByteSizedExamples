/**
 * A tolerant streaming partial-JSON parser for LLM structured outputs.
 *
 * When an LLM streams a JSON object token by token, you often want to render the
 * fields you already have instead of waiting for the closing brace. `JSON.parse`
 * throws on any incomplete prefix, so this module repairs the partial buffer and
 * returns the best-effort value parsed so far.
 *
 * The algorithm is a single left-to-right tokenizer followed by a tolerant,
 * auto-closing parser. There is no `eval` / `new Function`; the tokenizer tracks
 * string and escape state precisely so a `\"` is never mistaken for a string
 * terminator and a string is never closed in the middle of a `\uXXXX` escape.
 *
 * Documented behavior decisions
 * -----------------------------
 * - Empty or whitespace-only buffer -> `undefined` (never throws).
 * - An incomplete trailing *string value* is closed and kept: `{"msg":"hel`
 *   -> `{ msg: "hel" }`.
 * - An incomplete trailing *key* (a dangling string in key position) is dropped:
 *   `{"name":"Ada","ag` -> `{ name: "Ada" }`.
 * - An incomplete trailing *literal* that is an unambiguous prefix of
 *   `true` / `false` / `null` is resolved to that literal: `{"done":tr`
 *   -> `{ done: true }`. (Their first letters are distinct, so any non-empty
 *   prefix is unambiguous.)
 * - An incomplete trailing *number* (`-`, `1.`, `1e`, `1e+`) is ambiguous and is
 *   dropped along with its key/element: `{"n":1.` -> `{}`.
 * - A bare, already-valid number at the end of the buffer is kept as-is:
 *   `[1,2,3` -> `[1, 2, 3]`.
 * - Trailing commas and dangling keys are ignored: `[1,2,` -> `[1, 2]`,
 *   `{"a":` -> `{}`.
 * - For any prefix of a valid JSON document, this function never throws.
 */

type ObjectFrame = {
  type: "object";
  obj: Record<string, unknown>;
  currentKey: string | undefined;
  /** What the object expects to see next. */
  state: "key" | "colon" | "value" | "comma";
};

type ArrayFrame = {
  type: "array";
  arr: unknown[];
  /** What the array expects to see next. */
  state: "value" | "comma";
};

type Frame = ObjectFrame | ArrayFrame;

type Token =
  | { type: "{" | "}" | "[" | "]" | ":" | ","; complete: true }
  | { type: "string"; value: string; complete: boolean }
  | { type: "number"; value: number; complete: boolean }
  | { type: "true" | "false" | "null"; value: boolean | null; complete: true }
  | { type: "literal"; value: boolean | null; complete: false }
  | { type: "garbage"; complete: false };

const VALID_NUMBER = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/;
const NUMBER_CHAR = /[-+0-9.eE]/;
const HEX4 = /^[0-9a-fA-F]{4}$/;

/**
 * Scan a JSON string literal starting at `start` (where `s[start] === '"'`).
 *
 * Returns the *closed*, always-valid JSON string literal (including both quotes)
 * plus whether the original was terminated. If the buffer ends mid-escape (a lone
 * trailing backslash or a partial `\uXXXX`), the incomplete escape is trimmed so
 * the returned literal is still parseable.
 */
function scanString(s: string, start: number): { raw: string; end: number; complete: boolean } {
  let i = start + 1;
  // Exclusive end of the "safe" content scanned so far (chars that form valid
  // JSON string content). Advanced only past fully-consumed chars/escapes.
  let contentEnd = i;

  while (i < s.length) {
    const c = s[i];

    if (c === "\\") {
      const next = s[i + 1];
      if (next === undefined) {
        // Lone trailing backslash: drop it (incomplete escape).
        break;
      }
      if (next === "u") {
        const hex = s.slice(i + 2, i + 6);
        if (!HEX4.test(hex)) {
          // Incomplete \uXXXX escape at buffer end: drop the whole escape.
          break;
        }
        i += 6;
        contentEnd = i;
        continue;
      }
      // Simple escape (\" \\ \/ \b \f \n \r \t). Consume both chars; a `\"` is an
      // escaped quote, NOT a string terminator.
      i += 2;
      contentEnd = i;
      continue;
    }

    if (c === '"') {
      return { raw: s.slice(start, i + 1), end: i + 1, complete: true };
    }

    // Ordinary character.
    i += 1;
    contentEnd = i;
  }

  // Buffer ended before the closing quote: close the string at the last safe point.
  return { raw: s.slice(start, contentEnd) + '"', end: s.length, complete: false };
}

function scanNumber(s: string, start: number): { raw: string; end: number; complete: boolean } {
  let i = start;
  while (i < s.length && NUMBER_CHAR.test(s[i]!)) i += 1;
  const raw = s.slice(start, i);
  return { raw, end: i, complete: VALID_NUMBER.test(raw) };
}

const LITERALS = ["true", "false", "null"] as const;

function literalValue(name: "true" | "false" | "null"): boolean | null {
  return name === "true" ? true : name === "false" ? false : null;
}

function scanLiteral(s: string, start: number): { token: Token; end: number } {
  let i = start;
  while (i < s.length && /[a-z]/.test(s[i]!)) i += 1;
  const raw = s.slice(start, i);

  if (raw === "true" || raw === "false" || raw === "null") {
    return { token: { type: raw, value: literalValue(raw), complete: true }, end: i };
  }

  const match = LITERALS.find((l) => raw.length > 0 && l.startsWith(raw));
  if (match) {
    return { token: { type: "literal", value: literalValue(match), complete: false }, end: i };
  }

  return { token: { type: "garbage", complete: false }, end: i };
}

function tokenize(s: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < s.length) {
    const c = s[i]!;

    if (c === " " || c === "\t" || c === "\n" || c === "\r") {
      i += 1;
      continue;
    }

    if (c === "{" || c === "}" || c === "[" || c === "]" || c === ":" || c === ",") {
      tokens.push({ type: c, complete: true });
      i += 1;
      continue;
    }

    if (c === '"') {
      const r = scanString(s, i);
      // The closed raw literal is always valid JSON, so this never throws.
      tokens.push({ type: "string", value: JSON.parse(r.raw) as string, complete: r.complete });
      i = r.end;
      continue;
    }

    if (c === "-" || (c >= "0" && c <= "9")) {
      const r = scanNumber(s, i);
      tokens.push({
        type: "number",
        value: r.complete ? (JSON.parse(r.raw) as number) : Number.NaN,
        complete: r.complete,
      });
      i = r.end;
      continue;
    }

    if (c >= "a" && c <= "z") {
      const r = scanLiteral(s, i);
      tokens.push(r.token);
      i = r.end;
      continue;
    }

    // Unknown character: skip it (be tolerant).
    i += 1;
  }

  return tokens;
}

/**
 * Parse a possibly-incomplete JSON buffer, returning the best-effort value using
 * only the data available so far. See the module docblock for the exact
 * behavior of every edge case. Never throws for a prefix of valid JSON; returns
 * `undefined` for empty / whitespace-only input.
 */
export function parsePartialJson(buffer: string): unknown {
  try {
    return parseInternal(buffer);
  } catch {
    // Belt-and-suspenders: the never-throw guarantee holds even if an unforeseen
    // input reaches an internal `JSON.parse`.
    return undefined;
  }
}

function parseInternal(buffer: string): unknown {
  const tokens = tokenize(buffer);

  const stack: Frame[] = [];
  let root: unknown;
  let hasRoot = false;

  // Only the final token can be incomplete (the scanner stops at buffer end).
  const last = tokens[tokens.length - 1];
  const tail = last && last.complete === false ? last : undefined;
  const mainCount = tail ? tokens.length - 1 : tokens.length;

  const attachValue = (v: unknown): void => {
    const top = stack[stack.length - 1];
    if (!top) {
      root = v;
      hasRoot = true;
      return;
    }
    if (top.type === "array") {
      top.arr.push(v);
      top.state = "comma";
    } else {
      top.obj[top.currentKey as string] = v;
      top.currentKey = undefined;
      top.state = "comma";
    }
  };

  const attachClosed = (v: unknown): void => {
    if (stack.length === 0) {
      root = v;
      hasRoot = true;
      return;
    }
    const top = stack[stack.length - 1]!;
    if (top.type === "array") {
      top.arr.push(v);
      top.state = "comma";
    } else {
      top.obj[top.currentKey as string] = v;
      top.currentKey = undefined;
      top.state = "comma";
    }
  };

  for (let k = 0; k < mainCount; k++) {
    const tok = tokens[k]!;
    switch (tok.type) {
      case "{":
        stack.push({ type: "object", obj: {}, currentKey: undefined, state: "key" });
        break;
      case "[":
        stack.push({ type: "array", arr: [], state: "value" });
        break;
      case "}":
      case "]": {
        const frame = stack.pop();
        if (frame) attachClosed(frame.type === "array" ? frame.arr : frame.obj);
        break;
      }
      case ":": {
        const top = stack[stack.length - 1];
        if (top && top.type === "object") top.state = "value";
        break;
      }
      case ",": {
        const top = stack[stack.length - 1];
        if (top) top.state = top.type === "object" ? "key" : "value";
        break;
      }
      case "string": {
        const top = stack[stack.length - 1];
        if (top && top.type === "object" && top.state === "key") {
          top.currentKey = tok.value;
          top.state = "colon";
        } else {
          attachValue(tok.value);
        }
        break;
      }
      case "number":
      case "true":
      case "false":
      case "null":
        attachValue(tok.value);
        break;
      default:
        // "literal" / "garbage" are never complete, so they only ever appear as
        // the tail token and are handled below.
        break;
    }
  }

  // Incorporate the trailing incomplete token according to grammar position.
  if (tail) {
    const top = stack[stack.length - 1];
    if (!top) {
      if (!hasRoot && (tail.type === "string" || tail.type === "literal")) {
        root = tail.value;
        hasRoot = true;
      }
    } else if (top.type === "object") {
      if (top.state === "value" && (tail.type === "string" || tail.type === "literal")) {
        top.obj[top.currentKey as string] = tail.value;
        top.currentKey = undefined;
        top.state = "comma";
      }
      // state "key": incomplete key -> drop. Incomplete number/garbage -> drop.
    } else {
      // array
      if (top.state === "value" && (tail.type === "string" || tail.type === "literal")) {
        top.arr.push(tail.value);
        top.state = "comma";
      }
    }
  }

  // Auto-close every still-open container from the innermost outward.
  while (stack.length > 0) {
    const frame = stack.pop()!;
    attachClosed(frame.type === "array" ? frame.arr : frame.obj);
  }

  return hasRoot ? root : undefined;
}

/**
 * Accumulates streamed chunks (e.g. LLM tokens) and re-parses the growing buffer
 * on every `push`, so a UI can render partial structured output as it arrives.
 */
export class StreamingJsonAccumulator {
  #buffer = "";
  #value: unknown = undefined;

  /** Append a chunk and return the best-effort parse of the full buffer so far. */
  push(chunk: string): unknown {
    this.#buffer += chunk;
    this.#value = parsePartialJson(this.#buffer);
    return this.#value;
  }

  /** The raw text accumulated so far. */
  get buffer(): string {
    return this.#buffer;
  }

  /** The most recent best-effort parsed value. */
  get value(): unknown {
    return this.#value;
  }

  /** Clear the buffer and parsed value. */
  reset(): void {
    this.#buffer = "";
    this.#value = undefined;
  }
}
