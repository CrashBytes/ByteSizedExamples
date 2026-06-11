import type { EmbeddingProvider } from "../types.js";
import { normalize } from "../math.js";
import { STOPWORDS, tokenize } from "../tokenize.js";

/**
 * A deterministic, dependency-free embedder built on the feature-hashing
 * ("hashing trick") technique.
 *
 * It is NOT a transformer. It captures lexical overlap and simple co-occurrence,
 * not deep semantics — "car" and "automobile" land in different buckets. So why
 * ship it?
 *
 *  1. **On-device default.** It runs entirely inside Hermes with no model
 *     download, no network, no API key. For a privacy-first or offline mobile
 *     feature, lexical retrieval over the user's own data is often enough.
 *  2. **Deterministic tests + CI.** The same text always produces the same
 *     vector, so retrieval assertions are stable and the whole repo builds
 *     green without secrets.
 *  3. **Graceful degradation.** When the Voyage key is missing, the pipeline
 *     keeps working instead of throwing.
 *
 * The tutorial walks through upgrading this to a real on-device transformer
 * (e.g. an ONNX MiniLM via `onnxruntime-react-native`) behind the exact same
 * `EmbeddingProvider` interface — no pipeline changes required.
 */
export class HashingEmbeddingProvider implements EmbeddingProvider {
  readonly name = "hashing-trick";
  readonly dimensions: number;

  constructor(dimensions = 512) {
    this.dimensions = dimensions;
  }

  async embed(texts: string[]): Promise<number[][]> {
    return texts.map((t) => this.embedOne(t));
  }

  private embedOne(text: string): number[] {
    const vec = new Array<number>(this.dimensions).fill(0);
    const tokens = tokenize(text).filter((t) => !STOPWORDS.has(t));
    if (tokens.length === 0) return vec;

    // Term frequencies — a bag of words.
    const counts = new Map<string, number>();
    for (const tok of tokens) {
      counts.set(tok, (counts.get(tok) ?? 0) + 1);
    }

    for (const [token, count] of counts) {
      // A second hash decides the sign, which keeps the hashed space roughly
      // unbiased and reduces collision artifacts (signed feature hashing).
      const bucket = this.hash(token) % this.dimensions;
      const sign = this.hash(`${token}#sign`) % 2 === 0 ? 1 : -1;
      // Sub-linear term weighting (1 + log tf) damps very repetitive tokens.
      vec[bucket] = (vec[bucket] ?? 0) + sign * (1 + Math.log(count));
    }

    // Unit-normalize so downstream similarity is a pure dot product.
    return normalize(vec);
  }

  /** FNV-1a: a fast, well-distributed, non-cryptographic string hash. */
  private hash(str: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      // `Math.imul` keeps the multiply in 32-bit space (Hermes-safe).
      h = Math.imul(h, 0x01000193);
    }
    // Force to an unsigned 32-bit integer.
    return h >>> 0;
  }
}
