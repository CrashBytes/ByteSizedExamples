/**
 * The model registry: a static, in-code catalog of every model the router may
 * pick from, with its May 2026 published prices, context window, capability
 * tags, and the team's internal eval score.
 *
 * Keep this in code, not a database. Prices change quarterly, but the changes
 * are pull requests you review — not runtime mutations operations can make at
 * 3am.
 */

export type Capability =
  | 'extraction'
  | 'summarization'
  | 'reasoning'
  | 'coding'
  | 'tool-use'
  | 'long-context'
  | 'vision';

export interface ModelSpec {
  id: string;
  provider: 'anthropic' | 'openai' | 'google' | 'mistral';
  tier: 'floor' | 'mid' | 'frontier';
  inputCostPerMillion: number;
  outputCostPerMillion: number;
  maxContextTokens: number;
  capabilities: ReadonlySet<Capability>;
  // Quality score on a 0-100 scale from the team's internal eval harness.
  // Used as a tiebreaker when two models cover the same capabilities.
  evalScore: number;
}

const cap = (...c: Capability[]) => new Set(c);

export const MODELS: readonly ModelSpec[] = [
  {
    id: 'gemini-3.1-flash-lite',
    provider: 'google',
    tier: 'floor',
    inputCostPerMillion: 0.25,
    outputCostPerMillion: 1.0,
    maxContextTokens: 1_000_000,
    capabilities: cap('extraction', 'summarization'),
    evalScore: 62,
  },
  {
    id: 'claude-haiku-4.5',
    provider: 'anthropic',
    tier: 'floor',
    inputCostPerMillion: 1.0,
    outputCostPerMillion: 5.0,
    maxContextTokens: 200_000,
    capabilities: cap('extraction', 'summarization', 'tool-use'),
    evalScore: 71,
  },
  {
    id: 'gemini-3.1-pro',
    provider: 'google',
    tier: 'mid',
    inputCostPerMillion: 3.5,
    outputCostPerMillion: 18.0,
    maxContextTokens: 2_000_000,
    capabilities: cap(
      'extraction',
      'summarization',
      'reasoning',
      'coding',
      'tool-use',
      'long-context',
      'vision'
    ),
    evalScore: 84,
  },
  {
    id: 'claude-sonnet-4.6',
    provider: 'anthropic',
    tier: 'mid',
    inputCostPerMillion: 3.0,
    outputCostPerMillion: 15.0,
    maxContextTokens: 1_000_000,
    capabilities: cap(
      'extraction',
      'summarization',
      'reasoning',
      'coding',
      'tool-use',
      'long-context'
    ),
    evalScore: 87,
  },
  {
    id: 'gpt-5.5-pro',
    provider: 'openai',
    tier: 'frontier',
    inputCostPerMillion: 5.0,
    outputCostPerMillion: 24.0,
    maxContextTokens: 400_000,
    capabilities: cap(
      'extraction',
      'summarization',
      'reasoning',
      'coding',
      'tool-use',
      'vision'
    ),
    evalScore: 92,
  },
  {
    id: 'claude-opus-4.7',
    provider: 'anthropic',
    tier: 'frontier',
    inputCostPerMillion: 15.0,
    outputCostPerMillion: 75.0,
    maxContextTokens: 1_000_000,
    capabilities: cap(
      'extraction',
      'summarization',
      'reasoning',
      'coding',
      'tool-use',
      'long-context'
    ),
    evalScore: 94,
  },
] as const;
