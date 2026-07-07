import type { z } from 'zod'

/**
 * Pull the first JSON object or array out of a (possibly fenced, possibly
 * prose-wrapped) model completion. Models routinely wrap tool arguments in
 * "Sure! Here are the arguments:" prose and a ```json fence; this locates the
 * actual value so `JSON.parse` gets clean input. It is a locator, not a parser.
 */
export function extractJson(text: string): string {
  const body = stripCodeFence(text)

  const start = firstIndexOf(body, '{', '[')
  if (start === -1) {
    throw new Error('no JSON value found in tool arguments')
  }

  const open = body[start]
  const close = open === '{' ? '}' : ']'
  const end = body.lastIndexOf(close)
  if (end <= start) {
    throw new Error('unterminated JSON value in tool arguments')
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
  return close === -1
    ? text.slice(contentStart)
    : text.slice(contentStart, close)
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
 * Turn a `ZodError` into numbered, field-path-prefixed feedback the model can
 * act on. The path matters: telling the model `amount: expected number,
 * received string` is far more actionable than a generic "validation failed",
 * and it is what makes the repair loop converge in one turn instead of five.
 */
export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map(issue => {
      const path = issue.path.length > 0 ? issue.path.join('.') : '(root)'
      return `- ${path}: ${issue.message}`
    })
    .join('\n')
}

/** The result of validating raw argument text against a tool's schema. */
export type ValidationResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly errors: string }

/**
 * Parse raw tool-call argument text and validate it against `schema`. Two
 * distinct failure modes collapse into one shape here: text that is not valid
 * JSON at all, and JSON that parses but violates the schema. Both come back as
 * `{ ok: false, errors }` with human-readable feedback, so the repair loop
 * treats "you sent me garbage" and "you sent me the wrong shape" identically.
 */
export function parseAndValidate<Schema extends z.ZodTypeAny>(
  schema: Schema,
  rawArguments: string
): ValidationResult<z.infer<Schema>> {
  let json: unknown
  try {
    json = JSON.parse(extractJson(rawArguments))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ok: false, errors: `- (root): arguments were not valid JSON (${message})` }
  }

  const parsed = schema.safeParse(json)
  if (parsed.success) {
    return { ok: true, value: parsed.data }
  }
  return { ok: false, errors: formatZodError(parsed.error) }
}
