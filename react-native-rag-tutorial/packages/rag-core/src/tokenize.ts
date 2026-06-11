/**
 * Lightweight text utilities shared by the chunker and the keyword ranker.
 *
 * These are intentionally simple. They are NOT a substitute for Claude's real
 * tokenizer — for billing or context-budget decisions you should call the
 * Messages `count_tokens` endpoint. Here we only need a stable, cheap, offline
 * approximation to size chunks and to build a bag-of-words for keyword scoring.
 */

const WORD_RE = /[\p{L}\p{N}]+/gu;

/** Split text into lowercased word tokens (letters and numbers only). */
export function tokenize(text: string): string[] {
  const matches = text.toLowerCase().match(WORD_RE);
  return matches ? matches : [];
}

/**
 * Split text into sentences. A pragmatic regex splitter: it breaks on sentence
 * punctuation followed by whitespace, and treats newlines as hard breaks. Good
 * enough to keep chunk boundaries off the middle of a sentence.
 */
export function splitSentences(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'([])|\n{2,}/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Approximate the token count of a string. English averages ~4 characters per
 * token; we use that ratio so chunk sizes expressed in "tokens" line up roughly
 * with what an LLM context budget will see.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** A small, English-centric stopword set for keyword scoring. */
export const STOPWORDS = new Set<string>([
  "the", "a", "an", "and", "or", "but", "if", "then", "is", "are", "was",
  "were", "be", "been", "being", "to", "of", "in", "on", "for", "with", "as",
  "at", "by", "from", "that", "this", "it", "its", "i", "you", "your", "we",
  "they", "do", "does", "how", "what", "when", "where", "which", "who", "can",
  "will", "would", "should", "could", "my", "me", "about", "into", "than",
]);
