import type { Citation, ScoredChunk, Synthesizer } from "../types.js";

/**
 * Offline, zero-cost synthesizer.
 *
 * It does not generate prose — it stitches the top retrieved chunks together
 * and attaches a citation to each. That is genuinely useful on its own (it is
 * essentially a high-quality "snippet" answer, like a search result preview),
 * and it keeps the entire pipeline — including the on-device app and CI — fully
 * functional with no model and no API key.
 *
 * In the app this is the default for "On-device" mode; the Claude synthesizer
 * takes over in "Cloud" mode.
 */
export class ExtractiveSynthesizer implements Synthesizer {
  readonly name = "extractive";
  private readonly maxContexts: number;

  constructor(maxContexts = 3) {
    this.maxContexts = maxContexts;
  }

  async synthesize(query: string, contexts: ScoredChunk[]): Promise<{ answer: string; citations: Citation[] }> {
    const top = contexts.slice(0, this.maxContexts);
    if (top.length === 0) {
      return {
        answer: "I couldn't find anything relevant to that in the indexed content.",
        citations: [],
      };
    }

    const citations: Citation[] = top.map((sc, i) => ({
      marker: i + 1,
      docId: sc.chunk.docId,
      chunkId: sc.chunk.id,
      snippet: snippet(sc.chunk.text),
      ...(sc.chunk.metadata ? { metadata: sc.chunk.metadata } : {}),
    }));

    const body = top
      .map((sc, i) => `${sc.chunk.text} [${i + 1}]`)
      .join("\n\n");

    return {
      answer: `Here is the most relevant information I found:\n\n${body}`,
      citations,
    };
  }
}

function snippet(text: string, max = 180): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1)}…`;
}
