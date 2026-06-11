import type { Chunk, RagDocument } from "./types.js";
import { estimateTokens, splitSentences } from "./tokenize.js";

export interface ChunkOptions {
  /** Target maximum size of a chunk, in estimated tokens. */
  maxTokens?: number;
  /** How many tokens of trailing context to repeat at the start of the next chunk. */
  overlapTokens?: number;
}

const DEFAULTS: Required<ChunkOptions> = {
  maxTokens: 256,
  overlapTokens: 48,
};

/**
 * Sentence-aware sliding-window chunker.
 *
 * Why not fixed-size character windows? Splitting mid-sentence severs the very
 * semantic units an embedder is good at encoding, which quietly tanks recall.
 * We instead pack whole sentences until the token budget is hit, then start a
 * new chunk that re-includes the tail of the previous one (the overlap). The
 * overlap is what lets an answer that straddles a boundary still be retrievable
 * from a single chunk.
 *
 * Tuning guidance (covered in the tutorial): smaller chunks raise precision but
 * fragment context; larger chunks raise recall but dilute the embedding and
 * burn context-window tokens at synthesis time. 200–300 tokens with ~20%
 * overlap is a solid default for help-center / documentation corpora.
 */
export function chunkDocument(doc: RagDocument, options: ChunkOptions = {}): Chunk[] {
  const { maxTokens, overlapTokens } = { ...DEFAULTS, ...options };
  const sentences = splitSentences(doc.text);
  if (sentences.length === 0) return [];

  const chunks: Chunk[] = [];
  let current: string[] = [];
  let currentTokens = 0;

  const flush = () => {
    if (current.length === 0) return;
    const text = current.join(" ");
    chunks.push({
      id: `${doc.id}::${chunks.length}`,
      docId: doc.id,
      index: chunks.length,
      text,
      ...(doc.metadata ? { metadata: doc.metadata } : {}),
    });
  };

  for (const sentence of sentences) {
    const sentenceTokens = estimateTokens(sentence);

    // A single very long sentence can exceed the budget on its own; emit it as
    // its own chunk rather than dropping it.
    if (sentenceTokens >= maxTokens) {
      flush();
      current = [];
      currentTokens = 0;
      chunks.push({
        id: `${doc.id}::${chunks.length}`,
        docId: doc.id,
        index: chunks.length,
        text: sentence,
        ...(doc.metadata ? { metadata: doc.metadata } : {}),
      });
      continue;
    }

    if (currentTokens + sentenceTokens > maxTokens && current.length > 0) {
      flush();
      // Build the overlap window from the tail of the chunk we just emitted.
      const overlap: string[] = [];
      let overlapTok = 0;
      for (let i = current.length - 1; i >= 0; i--) {
        const t = estimateTokens(current[i] as string);
        if (overlapTok + t > overlapTokens) break;
        overlap.unshift(current[i] as string);
        overlapTok += t;
      }
      current = overlap;
      currentTokens = overlapTok;
    }

    current.push(sentence);
    currentTokens += sentenceTokens;
  }

  flush();
  return chunks;
}

/** Convenience: chunk many documents in one call. */
export function chunkDocuments(docs: RagDocument[], options: ChunkOptions = {}): Chunk[] {
  return docs.flatMap((doc) => chunkDocument(doc, options));
}
