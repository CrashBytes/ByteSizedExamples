import type { EmbeddedChunk, ScoredChunk } from "./types.js";
import { STOPWORDS, tokenize } from "./tokenize.js";

/**
 * BM25 keyword scoring over the candidate chunk set.
 *
 * Pure vector search has a well-known blind spot: rare, exact tokens — error
 * codes, SKUs, function names, person names — that the embedder smears into a
 * dense average. BM25 nails those. Blending the two (below) is why "hybrid"
 * retrieval consistently beats either signal alone.
 */
export function bm25Scores(
  query: string,
  chunks: EmbeddedChunk[],
  opts: { k1?: number; b?: number } = {},
): Map<string, number> {
  const k1 = opts.k1 ?? 1.5;
  const b = opts.b ?? 0.75;

  const queryTerms = [...new Set(tokenize(query).filter((t) => !STOPWORDS.has(t)))];
  const scores = new Map<string, number>();
  if (queryTerms.length === 0 || chunks.length === 0) return scores;

  // Document statistics.
  const docTokens = chunks.map((c) => tokenize(c.text).filter((t) => !STOPWORDS.has(t)));
  const docLengths = docTokens.map((d) => d.length);
  const avgLen = docLengths.reduce((a, n) => a + n, 0) / chunks.length || 1;

  // Document frequency per query term.
  const df = new Map<string, number>();
  for (const term of queryTerms) {
    let count = 0;
    for (const tokens of docTokens) {
      if (tokens.includes(term)) count++;
    }
    df.set(term, count);
  }

  const N = chunks.length;
  for (let i = 0; i < chunks.length; i++) {
    const tokens = docTokens[i] as string[];
    const len = docLengths[i] as number;
    const tf = new Map<string, number>();
    for (const tok of tokens) tf.set(tok, (tf.get(tok) ?? 0) + 1);

    let score = 0;
    for (const term of queryTerms) {
      const f = tf.get(term);
      if (!f) continue;
      const n = df.get(term) ?? 0;
      // BM25 IDF with the +0.5 smoothing that keeps it non-negative.
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      const denom = f + k1 * (1 - b + (b * len) / avgLen);
      score += idf * ((f * (k1 + 1)) / denom);
    }
    if (score > 0) scores.set((chunks[i] as EmbeddedChunk).id, score);
  }

  return scores;
}

/**
 * Reciprocal Rank Fusion (RRF) blend of semantic and keyword rankings.
 *
 * RRF combines by *rank*, not raw score, which sidesteps the problem that
 * cosine similarities and BM25 scores live on totally different scales and
 * can't be added directly. Each list contributes `1 / (rrfK + rank)`; `alpha`
 * weights the semantic contribution against the keyword one.
 *
 *   alpha = 1  → pure semantic
 *   alpha = 0  → pure keyword
 *   0 < a < 1  → hybrid (0.5–0.7 is a good starting point)
 */
export function fuse(
  semantic: ScoredChunk[],
  keyword: Map<string, number>,
  options: { alpha?: number; rrfK?: number; k?: number } = {},
): ScoredChunk[] {
  const alpha = options.alpha ?? 0.6;
  const rrfK = options.rrfK ?? 60;
  const k = options.k ?? semantic.length;

  const byId = new Map<string, { chunk: ScoredChunk["chunk"]; semantic?: number; keyword?: number; fused: number }>();

  // Rank the semantic list (already sorted high→low).
  semantic.forEach((sc, rank) => {
    const contribution = alpha * (1 / (rrfK + rank + 1));
    byId.set(sc.chunk.id, {
      chunk: sc.chunk,
      semantic: sc.score,
      fused: contribution,
    });
  });

  // Rank the keyword list (sort its entries high→low first).
  const keywordRanked = [...keyword.entries()].sort((a, b) => b[1] - a[1]);
  keywordRanked.forEach(([id, kwScore], rank) => {
    const contribution = (1 - alpha) * (1 / (rrfK + rank + 1));
    const existing = byId.get(id);
    if (existing) {
      existing.keyword = kwScore;
      existing.fused += contribution;
    } else {
      // A chunk surfaced by keywords but outside the semantic top-k still has
      // its chunk object available from the semantic candidate pool only if it
      // was scored; if not, skip it (we only fuse over retrieved candidates).
      const fromSemantic = semantic.find((s) => s.chunk.id === id);
      if (fromSemantic) {
        byId.set(id, { chunk: fromSemantic.chunk, keyword: kwScore, fused: contribution });
      }
    }
  });

  return [...byId.values()]
    .map<ScoredChunk>((entry) => ({
      chunk: entry.chunk,
      score: entry.fused,
      components: {
        ...(entry.semantic !== undefined ? { semantic: entry.semantic } : {}),
        ...(entry.keyword !== undefined ? { keyword: entry.keyword } : {}),
      },
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
