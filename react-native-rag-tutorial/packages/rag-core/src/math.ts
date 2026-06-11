/**
 * Vector math. Kept dependency-free on purpose: this code runs inside the React
 * Native JS engine (Hermes) as well as on Node, so it cannot rely on native
 * BLAS bindings. For the corpus sizes a mobile RAG cache realistically holds
 * (hundreds to low-thousands of chunks), a tight JS loop over Float-friendly
 * arrays is more than fast enough.
 */

/** Dot product of two equal-length vectors. */
export function dot(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`dot: dimension mismatch (${a.length} vs ${b.length})`);
  }
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] as number) * (b[i] as number);
  }
  return sum;
}

/** Euclidean (L2) norm of a vector. */
export function norm(a: number[]): number {
  return Math.sqrt(dot(a, a));
}

/**
 * Return a unit-length copy of `a`. We normalize at embed time so that retrieval
 * can use a plain dot product instead of recomputing norms on every query —
 * cosine similarity of unit vectors *is* their dot product.
 */
export function normalize(a: number[]): number[] {
  const n = norm(a);
  if (n === 0) return a.slice();
  const out = new Array<number>(a.length);
  for (let i = 0; i < a.length; i++) {
    out[i] = (a[i] as number) / n;
  }
  return out;
}

/**
 * Cosine similarity in [-1, 1]. Safe for non-normalized inputs; if you have
 * already normalized (as the store does), prefer `dot` to skip the division.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  const denom = norm(a) * norm(b);
  if (denom === 0) return 0;
  return dot(a, b) / denom;
}
