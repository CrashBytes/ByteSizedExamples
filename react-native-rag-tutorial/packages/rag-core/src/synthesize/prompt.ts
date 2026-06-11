import type { Citation, ScoredChunk } from "../types.js";

/**
 * Builds the grounded prompt for an LLM synthesizer and the citation list that
 * pairs with it.
 *
 * This is deliberately a *pure function* living in rag-core, not buried inside
 * the Anthropic SDK call. Keeping prompt construction separate means:
 *   - it is unit-testable without a network or an API key,
 *   - the exact numbered-context / citation contract is shared by every
 *     synthesizer implementation, and
 *   - the on-device bundle never has to import the server-only SDK.
 *
 * The contract we give the model: each context is numbered `[1]`, `[2]`, … and
 * the model must cite the numbers it used and must refuse to answer from outside
 * the provided context. That refusal instruction is the single most important
 * line for preventing hallucination in a RAG system.
 */
export interface GroundedPrompt {
  system: string;
  user: string;
  /** Citations aligned 1:1 with the numbered contexts embedded in `user`. */
  citations: Citation[];
}

export const DEFAULT_SYSTEM_PROMPT = [
  "You are a precise assistant that answers questions strictly from the numbered",
  "context passages provided by the user. Follow these rules exactly:",
  "",
  "1. Use ONLY information found in the context. Never use outside knowledge.",
  "2. If the context does not contain the answer, say so plainly and stop. Do not guess.",
  "3. Cite every claim with the bracketed number(s) of the passage(s) it came from, e.g. [2].",
  "4. Be concise and direct. Lead with the answer, then the supporting detail.",
  "5. Never invent passage numbers that were not provided.",
].join("\n");

export function buildGroundedPrompt(
  query: string,
  contexts: ScoredChunk[],
  systemPrompt: string = DEFAULT_SYSTEM_PROMPT,
): GroundedPrompt {
  const citations: Citation[] = contexts.map((sc, i) => ({
    marker: i + 1,
    docId: sc.chunk.docId,
    chunkId: sc.chunk.id,
    snippet: sc.chunk.text.replace(/\s+/g, " ").trim().slice(0, 180),
    ...(sc.chunk.metadata ? { metadata: sc.chunk.metadata } : {}),
  }));

  const contextBlock = contexts
    .map((sc, i) => {
      const source = sc.chunk.metadata?.["title"] ?? sc.chunk.docId;
      return `[${i + 1}] (source: ${String(source)})\n${sc.chunk.text}`;
    })
    .join("\n\n");

  const user = [
    "Context passages:",
    "",
    contextBlock || "(no context retrieved)",
    "",
    "---",
    "",
    `Question: ${query}`,
    "",
    "Answer using only the passages above, citing them by number.",
  ].join("\n");

  return { system: systemPrompt, user, citations };
}

/**
 * Keep only the citations the model actually referenced (markers that appear as
 * `[n]` in the answer). This trims the source list shown to the user to the
 * passages that genuinely contributed, and quietly flags hallucinated markers.
 */
export function filterCitations(answer: string, citations: Citation[]): Citation[] {
  const used = new Set<number>();
  for (const match of answer.matchAll(/\[(\d+)\]/g)) {
    used.add(Number(match[1]));
  }
  if (used.size === 0) return citations;
  return citations.filter((c) => used.has(c.marker));
}
