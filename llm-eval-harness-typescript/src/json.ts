/**
 * Extract the first balanced JSON object or array from a string that may be
 * wrapped in a Markdown code fence or surrounded by prose.
 *
 * LLMs frequently answer "Sure! Here is the JSON: ```json { ... } ```" even
 * when told not to. A brittle `JSON.parse(raw)` blows up on that; this walks
 * the string, respecting string literals and escapes, and returns just the
 * JSON span so the caller can parse it.
 */
export function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const text = fenced ? fenced[1] : raw

  const start = text.search(/[{[]/)
  if (start === -1) throw new Error('no JSON object or array found in response')

  const open = text[start]
  const close = open === '{' ? '}' : ']'
  let depth = 0
  let inString = false
  let escaped = false

  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (inString) {
      if (escaped) escaped = false
      else if (ch === '\\') escaped = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') inString = true
    else if (ch === open) depth++
    else if (ch === close) {
      depth--
      if (depth === 0) return text.slice(start, i + 1)
    }
  }

  throw new Error('unbalanced JSON in response')
}
