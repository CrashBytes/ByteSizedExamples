import { MemoryLayer } from './memory.js'
import { maybeSummarize, type Summarizer, type SummarizeOptions } from './summarize.js'
import { evict, type EvictionPolicy } from './eviction.js'
import type { Embedder } from './embeddings.js'
import type { MemoryStore } from './types.js'

export interface TurnDeps {
  store: MemoryStore
  embed: Embedder
  summarize: Summarizer
  summarizeOpts: SummarizeOptions
  evictionPolicy: EvictionPolicy
  callModel: (systemContext: string, userInput: string) => Promise<string>
}

export async function runTurn(
  scope: string,
  userInput: string,
  deps: TurnDeps
): Promise<string> {
  const memory = new MemoryLayer(deps.store, deps.embed)

  // 1. Recall relevant context under a budget.
  const recalled = await memory.recall({
    scope,
    text: userInput,
    tokenBudget: 800,
  })
  const systemContext = recalled.length
    ? 'Relevant memory:\n' + recalled.map(r => `- ${r.content}`).join('\n')
    : ''

  // 2. Call the model with the small, relevant context.
  const reply = await deps.callModel(systemContext, userInput)

  // 3. Remember what happened this turn.
  await memory.remember({ scope, content: `User: ${userInput}`, kind: 'episodic' })
  await memory.remember({ scope, content: `Agent: ${reply}`, kind: 'episodic' })

  // 4. Maintenance — cheap to run every turn, or move to an interval.
  await maybeSummarize(scope, deps.store, deps.embed, deps.summarize, deps.summarizeOpts)
  await evict(scope, deps.store, deps.evictionPolicy)

  return reply
}
