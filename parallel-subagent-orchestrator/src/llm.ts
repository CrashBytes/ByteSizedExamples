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
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const body = fenced ? fenced[1] : text

  const start = body.search(/[[{]/)
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
