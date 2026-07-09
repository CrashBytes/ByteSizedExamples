/**
 * The prompt classifier turns an incoming request into a `RoutingRequirement`:
 * which capabilities the prompt needs, roughly how many tokens it is, and
 * whether a mistake here is expensive.
 *
 * It is deliberately conservative — the caller declares the task rather than
 * having us guess it from the text. Declared task + declared high-stakes flag
 * captures ~90% of the savings for ~5% of the engineering effort.
 */

import type { Capability } from './registry.js';

export interface RoutingRequirement {
  requiredCapabilities: Set<Capability>;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  highStakes: boolean;
}

export interface PromptInput {
  task:
    | 'extract'
    | 'summarize'
    | 'classify'
    | 'rewrite'
    | 'reason'
    | 'code'
    | 'agent';
  systemPrompt?: string;
  userPrompt: string;
  attachments?: { kind: 'image' | 'document'; bytes: number }[];
  // Caller may flag prompts where mistakes are expensive (legal, medical,
  // financial advice, irreversible operations). The router treats these as
  // requiring at least the mid tier.
  highStakes?: boolean;
}

const APPROX_CHARS_PER_TOKEN = 4;

function approximateTokens(text: string): number {
  return Math.ceil(text.length / APPROX_CHARS_PER_TOKEN);
}

export function classify(input: PromptInput): RoutingRequirement {
  const requiredCapabilities = new Set<Capability>();

  switch (input.task) {
    case 'extract':
    case 'classify':
      requiredCapabilities.add('extraction');
      break;
    case 'summarize':
    case 'rewrite':
      requiredCapabilities.add('summarization');
      break;
    case 'reason':
      requiredCapabilities.add('reasoning');
      break;
    case 'code':
      requiredCapabilities.add('coding');
      requiredCapabilities.add('reasoning');
      break;
    case 'agent':
      requiredCapabilities.add('tool-use');
      requiredCapabilities.add('reasoning');
      break;
  }

  const systemTokens = approximateTokens(input.systemPrompt ?? '');
  const userTokens = approximateTokens(input.userPrompt);
  const inputTokens = systemTokens + userTokens;

  if (inputTokens > 100_000) {
    requiredCapabilities.add('long-context');
  }

  if (input.attachments?.some((a) => a.kind === 'image')) {
    requiredCapabilities.add('vision');
  }

  const estimatedOutputTokens = Math.min(
    4_000,
    Math.max(200, Math.ceil(inputTokens * 0.3))
  );

  return {
    requiredCapabilities,
    estimatedInputTokens: inputTokens,
    estimatedOutputTokens,
    highStakes: input.highStakes ?? false,
  };
}
