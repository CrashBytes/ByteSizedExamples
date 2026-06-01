import { randomUUID } from 'node:crypto'
import type { Embedder } from './embeddings.js'
import { estimateTokens } from './memory.js'
import type { MemoryRecord, MemoryStore } from './types.js'

export type Summarizer = (episodes: string[]) => Promise<string>

const SUMMARY_PROMPT = `You compress an AI agent's episodic memories into one
durable summary. Keep stable facts, preferences, decisions, and unresolved
threads. Drop pleasantries and transient status. Write terse third-person notes,
not prose. Under 120 words.`

export const llmSummarizer =
  (apiKey: string, model = 'gpt-4o-mini'): Summarizer =>
  async episodes => {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          { role: 'system', content: SUMMARY_PROMPT },
          { role: 'user', content: episodes.map((e, i) => `${i + 1}. ${e}`).join('\n') },
        ],
      }),
    })
    if (!res.ok) throw new Error(`summarize failed: ${res.status}`)
    const json = (await res.json()) as {
      choices: { message: { content: string } }[]
    }
    return json.choices[0].message.content.trim()
  }

export interface SummarizeOptions {
  /** Episodic token budget per scope before summarization fires. */
  episodicBudget: number
  /** How many of the oldest episodes to fold per pass. */
  clusterSize: number
}

export async function maybeSummarize(
  scope: string,
  store: MemoryStore,
  embed: Embedder,
  summarize: Summarizer,
  opts: SummarizeOptions
): Promise<MemoryRecord | null> {
  const all = await store.list(scope)
  const episodic = all
    .filter(r => r.kind === 'episodic')
    .sort((a, b) => a.createdAt - b.createdAt)

  const totalTokens = episodic.reduce((sum, r) => sum + r.tokens, 0)
  if (totalTokens <= opts.episodicBudget) return null

  const cluster = episodic.slice(0, opts.clusterSize)
  if (cluster.length < 2) return null

  const summaryText = await summarize(cluster.map(r => r.content))
  const [embedding] = await embed([summaryText])
  const now = Date.now()

  const summary: MemoryRecord = {
    id: randomUUID(),
    content: summaryText,
    embedding,
    kind: 'semantic',
    scope,
    // A summary inherits the max salience of its sources — it represents them.
    salience: Math.max(...cluster.map(c => c.salience)),
    tokens: estimateTokens(summaryText),
    createdAt: now,
    lastAccessedAt: now,
    accessCount: 0,
  }

  await store.put(summary)
  await store.markArchived(
    cluster.map(c => c.id),
    now
  )
  return summary
}
