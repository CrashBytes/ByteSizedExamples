import { describe, it, expect } from 'vitest';
import { classify } from '../src/classifier.js';

describe('classifier', () => {
  it('maps extract/classify tasks to the extraction capability', () => {
    expect([...classify({ task: 'extract', userPrompt: 'hi' }).requiredCapabilities]).toEqual([
      'extraction',
    ]);
    expect([...classify({ task: 'classify', userPrompt: 'hi' }).requiredCapabilities]).toEqual([
      'extraction',
    ]);
  });

  it('maps summarize/rewrite to summarization', () => {
    expect([...classify({ task: 'summarize', userPrompt: 'hi' }).requiredCapabilities]).toEqual([
      'summarization',
    ]);
    expect([...classify({ task: 'rewrite', userPrompt: 'hi' }).requiredCapabilities]).toEqual([
      'summarization',
    ]);
  });

  it('requires coding AND reasoning for a code task', () => {
    const req = classify({ task: 'code', userPrompt: 'refactor this' });
    expect(req.requiredCapabilities.has('coding')).toBe(true);
    expect(req.requiredCapabilities.has('reasoning')).toBe(true);
  });

  it('requires tool-use AND reasoning for an agent task', () => {
    const req = classify({ task: 'agent', userPrompt: 'do the thing' });
    expect(req.requiredCapabilities.has('tool-use')).toBe(true);
    expect(req.requiredCapabilities.has('reasoning')).toBe(true);
  });

  it('adds long-context when the input exceeds ~100k tokens', () => {
    const short = classify({ task: 'summarize', userPrompt: 'a'.repeat(40_000) });
    expect(short.requiredCapabilities.has('long-context')).toBe(false);

    const long = classify({ task: 'summarize', userPrompt: 'a'.repeat(800_000) });
    expect(long.requiredCapabilities.has('long-context')).toBe(true);
    // ~200k tokens.
    expect(long.estimatedInputTokens).toBe(200_000);
  });

  it('adds vision when an image attachment is present', () => {
    const req = classify({
      task: 'extract',
      userPrompt: 'what is in this picture?',
      attachments: [{ kind: 'image', bytes: 1024 }],
    });
    expect(req.requiredCapabilities.has('vision')).toBe(true);
  });

  it('estimates input tokens from system + user prompt length', () => {
    const req = classify({ task: 'extract', systemPrompt: 'abcd', userPrompt: 'abcdefgh' });
    // (4 + 8) / 4 = 3 tokens.
    expect(req.estimatedInputTokens).toBe(3);
  });

  it('clamps estimated output tokens between 200 and 4000', () => {
    expect(classify({ task: 'extract', userPrompt: 'hi' }).estimatedOutputTokens).toBe(200);
    expect(
      classify({ task: 'summarize', userPrompt: 'a'.repeat(800_000) }).estimatedOutputTokens
    ).toBe(4_000);
  });

  it('passes the highStakes flag through, defaulting to false', () => {
    expect(classify({ task: 'reason', userPrompt: 'hi' }).highStakes).toBe(false);
    expect(classify({ task: 'reason', userPrompt: 'hi', highStakes: true }).highStakes).toBe(true);
  });
});
