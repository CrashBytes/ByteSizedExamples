import type { Task, Validator } from './types.js'

/**
 * Anything that turns a prompt into completion text. Wrap your provider SDK
 * here — Anthropic, OpenAI, a local model, or a deterministic mock in tests.
 * Keeping the orchestrator behind this one-line interface is what makes it
 * provider-agnostic and trivially testable without network access.
 */
export type CompletionFn = (prompt: string) => Promise<string>

/**
 * Pull the first JSON object or array out of a (possibly fenced, possibly
 * prose-wrapped) completion. Models love to say "Sure! Here's the JSON:"
 * before the payload and add a closing remark after it; this finds the value.
 */
export function extractJson(text: string): string {
  const body = stripCodeFence(text)

  const start = firstIndexOf(body, '{', '[')
  if (start === -1) {
    throw new Error('no JSON value found in completion')
  }

  const open = body[start]
  const close = open === '{' ? '}' : ']'
  const end = body.lastIndexOf(close)
  if (end <= start) {
    throw new Error('unterminated JSON value in completion')
  }

  return body.slice(start, end + 1)
}

/**
 * Return the contents of the first ``` fenced block, or the whole string when
 * there is no fence. Plain string scanning, deliberately not a regex: a lazy
 * `[\s\S]*?` between two fences is exactly the backtracking shape that trips
 * ReDoS scanners, and there is no need for it here.
 */
function stripCodeFence(text: string): string {
  const open = text.indexOf('```')
  if (open === -1) {
    return text
  }
  // Skip the optional language tag (e.g. ```json) on the opening-fence line.
  const lineEnd = text.indexOf('\n', open)
  const contentStart = lineEnd === -1 ? open + 3 : lineEnd + 1
  const close = text.indexOf('```', contentStart)
  return close === -1 ? text.slice(contentStart) : text.slice(contentStart, close)
}

/** Index of whichever of `a`/`b` appears first, or -1 if neither is present. */
function firstIndexOf(text: string, a: string, b: string): number {
  const ia = text.indexOf(a)
  const ib = text.indexOf(b)
  if (ia === -1) return ib
  if (ib === -1) return ia
  return Math.min(ia, ib)
}

/**
 * Build a `Task` backed by an LLM completion.
 *
 * With a `validate` schema the completion is JSON-extracted and parsed, so a
 * malformed response surfaces as a retryable error (see `runTask`). Without a
 * schema the raw text is returned. Hand the resulting tasks to `parallel` to
 * run a fleet of subagents at once.
 */
export function llmTask<Output>(params: {
  name: string
  prompt: string
  complete: CompletionFn
  validate?: Validator<Output>
}): Task<Output> {
  const { name, prompt, complete, validate } = params
  return {
    name,
    validate,
    async run(): Promise<Output> {
      const text = await complete(prompt)
      if (!validate) {
        return text as unknown as Output
      }
      return JSON.parse(extractJson(text)) as Output
    },
  }
}
