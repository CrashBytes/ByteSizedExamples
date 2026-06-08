/**
 * Cosine similarity between two equal-length vectors.
 *
 * Cosine similarity measures the angle between vectors, ignoring magnitude:
 *
 *   cos(a, b) = (a · b) / (||a|| * ||b||)
 *
 * The result is in [-1, 1]. For the non-negative embeddings produced by
 * {@link MockEmbedder} it lands in [0, 1], where 1 means "pointing the same
 * direction" (semantically identical) and 0 means orthogonal (unrelated).
 *
 * @throws RangeError if the vectors differ in length.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new RangeError(
      `cosineSimilarity: vectors must be the same length (got ${a.length} and ${b.length})`,
    );
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    dot += x * y;
    normA += x * x;
    normB += y * y;
  }

  // A zero vector has no direction, so similarity is undefined; return 0 rather
  // than dividing by zero and producing NaN.
  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
