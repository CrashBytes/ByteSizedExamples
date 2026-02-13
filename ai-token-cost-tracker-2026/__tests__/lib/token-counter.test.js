/**
 * Test Suite: Token Counter
 * Target: 100% Coverage
 * 
 * Tests token counting algorithms for all AI providers
 */

import { TokenCounter } from '../../lib/token-counter.js';

describe('TokenCounter', () => {
  let counter;

  beforeEach(() => {
    counter = new TokenCounter();
  });

  describe('countTokens() - Provider Routing', () => {

    test('should call correct counting method for openai provider', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      
      const result = await counter.countTokens('openai', 'gpt-4', messages);
      
      // Should return a valid token count
      expect(result).toBeGreaterThan(0);
      expect(typeof result).toBe('number');
    });

    test('should call correct counting method for anthropic provider', async () => {
      const messages = [{ content: 'Hello' }];
      
      const result = await counter.countTokens('anthropic', 'claude-3', messages);
      
      expect(result).toBeGreaterThan(0);
      expect(typeof result).toBe('number');
    });

    test('should call correct counting method for google provider', async () => {
      const messages = [{ content: 'Hello' }];
      
      const result = await counter.countTokens('google', 'gemini-pro', messages);
      
      expect(result).toBeGreaterThan(0);
      expect(typeof result).toBe('number');
    });

    test('should call correct counting method for unknown provider', async () => {
      const messages = [{ content: 'Hello' }];
      
      const result = await counter.countTokens('unknown-provider', 'some-model', messages);
      
      expect(result).toBeGreaterThan(0);
      expect(typeof result).toBe('number');
    });

  });

  describe('countOpenAITokens()', () => {

    test('should count tokens for single message', () => {
      const messages = [
        { role: 'user', content: 'Hello, world!' }
      ];
      
      const tokens = counter.countOpenAITokens(messages);
      
      // totalChars = 20 (overhead) + 4 (role) + 13 (content) + 10 (priming) = 47
      // tokens = ceil(47 / 4) = 12
      expect(tokens).toBe(12);
    });

    test('should count tokens for multiple messages', () => {
      const messages = [
        { role: 'system', content: 'You are helpful' },
        { role: 'user', content: 'Hello' }
      ];
      
      const tokens = counter.countOpenAITokens(messages);
      
      // Message 1: 20 + 6 + 15 = 41
      // Message 2: 20 + 4 + 5 = 29
      // Priming: 10
      // Total: 80 chars -> ceil(80/4) = 20 tokens
      expect(tokens).toBe(20);
    });

    test('should handle message with name field', () => {
      const messages = [
        { role: 'user', content: 'Hi', name: 'John' }
      ];
      
      const tokens = counter.countOpenAITokens(messages);
      
      // 20 + 4 + 2 + 4 + 10 = 40 -> ceil(40/4) = 10
      expect(tokens).toBe(10);
    });

    test('should handle missing role field', () => {
      const messages = [
        { content: 'Hello' }
      ];
      
      const tokens = counter.countOpenAITokens(messages);
      
      // 20 + 0 + 5 + 10 = 35 -> ceil(35/4) = 9
      expect(tokens).toBe(9);
    });

    test('should handle missing content field', () => {
      const messages = [
        { role: 'user' }
      ];
      
      const tokens = counter.countOpenAITokens(messages);
      
      // 20 + 4 + 0 + 10 = 34 -> ceil(34/4) = 9
      expect(tokens).toBe(9);
    });

    test('should handle empty message array', () => {
      const messages = [];
      
      const tokens = counter.countOpenAITokens(messages);
      
      // Only priming tokens: 10 -> ceil(10/4) = 3
      expect(tokens).toBe(3);
    });

    test('should handle long content', () => {
      const longContent = 'a'.repeat(1000);
      const messages = [
        { role: 'user', content: longContent }
      ];
      
      const tokens = counter.countOpenAITokens(messages);
      
      // 20 + 4 + 1000 + 10 = 1034 -> ceil(1034/4) = 259
      expect(tokens).toBe(259);
    });

    test('should always return at least 1 token', () => {
      const messages = [{ role: '', content: '' }];
      
      const tokens = counter.countOpenAITokens(messages);
      
      expect(tokens).toBeGreaterThan(0);
    });

  });

  describe('countAnthropicTokens()', () => {

    test('should count tokens for single message', () => {
      const messages = [
        { content: 'Hello, world!' }
      ];
      
      const tokens = counter.countAnthropicTokens(messages);
      
      // 13 chars * 0.75 = 9.75 -> ceil = 10
      expect(tokens).toBe(10);
    });

    test('should count tokens for multiple messages', () => {
      const messages = [
        { content: 'First message' },
        { content: 'Second message' }
      ];
      
      const tokens = counter.countAnthropicTokens(messages);
      
      // (13 + 14) * 0.75 = 20.25 -> ceil = 21
      expect(tokens).toBe(21);
    });

    test('should handle missing content field', () => {
      const messages = [
        { role: 'user' }
      ];
      
      const tokens = counter.countAnthropicTokens(messages);
      
      // 0 chars * 0.75 = 0 -> ceil = 0
      expect(tokens).toBe(0);
    });

    test('should handle empty message array', () => {
      const messages = [];
      
      const tokens = counter.countAnthropicTokens(messages);
      
      expect(tokens).toBe(0);
    });

    test('should handle long content', () => {
      const longContent = 'a'.repeat(1000);
      const messages = [
        { content: longContent }
      ];
      
      const tokens = counter.countAnthropicTokens(messages);
      
      // 1000 * 0.75 = 750
      expect(tokens).toBe(750);
    });

    test('should round up fractional tokens', () => {
      const messages = [
        { content: 'ab' } // 2 * 0.75 = 1.5 -> should ceil to 2
      ];
      
      const tokens = counter.countAnthropicTokens(messages);
      
      expect(tokens).toBe(2);
    });

  });

  describe('countGoogleTokens()', () => {

    test('should count tokens for single message', () => {
      const messages = [
        { content: 'Hello, world!' }
      ];
      
      const tokens = counter.countGoogleTokens(messages);
      
      // 13 chars * 0.8 = 10.4 -> ceil = 11
      expect(tokens).toBe(11);
    });

    test('should count tokens for multiple messages', () => {
      const messages = [
        { content: 'First message' },
        { content: 'Second message' }
      ];
      
      const tokens = counter.countGoogleTokens(messages);
      
      // (13 + 14) * 0.8 = 21.6 -> ceil = 22
      expect(tokens).toBe(22);
    });

    test('should handle missing content field', () => {
      const messages = [
        { role: 'user' }
      ];
      
      const tokens = counter.countGoogleTokens(messages);
      
      expect(tokens).toBe(0);
    });

    test('should handle empty message array', () => {
      const messages = [];
      
      const tokens = counter.countGoogleTokens(messages);
      
      expect(tokens).toBe(0);
    });

    test('should handle long content', () => {
      const longContent = 'a'.repeat(1000);
      const messages = [
        { content: longContent }
      ];
      
      const tokens = counter.countGoogleTokens(messages);
      
      // 1000 * 0.8 = 800
      expect(tokens).toBe(800);
    });

    test('should round up fractional tokens', () => {
      const messages = [
        { content: 'a' } // 1 * 0.8 = 0.8 -> should ceil to 1
      ];
      
      const tokens = counter.countGoogleTokens(messages);
      
      expect(tokens).toBe(1);
    });

  });

  describe('approximateTokens() - Fallback', () => {

    test('should count tokens from message content', () => {
      const messages = [
        { content: 'Hello, world!' }
      ];
      
      const tokens = counter.approximateTokens(messages);
      
      // 13 chars / 4 = 3.25 -> ceil = 4
      expect(tokens).toBe(4);
    });

    test('should handle string messages directly', () => {
      const messages = ['Hello, world!'];
      
      const tokens = counter.approximateTokens(messages);
      
      // 13 chars / 4 = 3.25 -> ceil = 4
      expect(tokens).toBe(4);
    });

    test('should handle mixed message formats', () => {
      const messages = [
        'String message',
        { content: 'Object message' }
      ];
      
      const tokens = counter.approximateTokens(messages);
      
      // (14 + 14) / 4 = 7
      expect(tokens).toBe(7);
    });

    test('should handle messages without content', () => {
      const messages = [
        { role: 'user' }
      ];
      
      const tokens = counter.approximateTokens(messages);
      
      // 0 chars / 4 = 0 -> ceil = 0
      expect(tokens).toBe(0);
    });

    test('should handle empty message array', () => {
      const messages = [];
      
      const tokens = counter.approximateTokens(messages);
      
      expect(tokens).toBe(0);
    });

    test('should handle long content', () => {
      const longContent = 'a'.repeat(1000);
      const messages = [longContent];
      
      const tokens = counter.approximateTokens(messages);
      
      // 1000 / 4 = 250
      expect(tokens).toBe(250);
    });

  });

  describe('Integration Tests - Real-World Scenarios', () => {

    test('should handle typical ChatGPT conversation', async () => {
      const messages = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'What is the capital of France?' },
        { role: 'assistant', content: 'The capital of France is Paris.' }
      ];
      
      const tokens = await counter.countTokens('openai', 'gpt-4', messages);
      
      expect(tokens).toBeGreaterThan(0);
      expect(typeof tokens).toBe('number');
    });

    test('should handle typical Claude conversation', async () => {
      const messages = [
        { content: 'Hello! Can you help me with something?' },
        { content: 'Of course! I\'d be happy to help. What do you need?' }
      ];
      
      const tokens = await counter.countTokens('anthropic', 'claude-3-opus', messages);
      
      expect(tokens).toBeGreaterThan(0);
      expect(typeof tokens).toBe('number');
    });

    test('should handle typical Gemini conversation', async () => {
      const messages = [
        { content: 'Explain quantum computing in simple terms.' }
      ];
      
      const tokens = await counter.countTokens('google', 'gemini-pro', messages);
      
      expect(tokens).toBeGreaterThan(0);
      expect(typeof tokens).toBe('number');
    });

  });

  describe('Edge Cases', () => {

    test('should handle null messages', () => {
      expect(() => counter.countOpenAITokens(null)).toThrow();
    });

    test('should handle undefined messages', () => {
      expect(() => counter.countAnthropicTokens(undefined)).toThrow();
    });

    test('should handle messages with special characters', () => {
      const messages = [
        { content: '🎉 Special chars: @#$%^&*()' }
      ];
      
      const tokens = counter.countAnthropicTokens(messages);
      
      expect(tokens).toBeGreaterThan(0);
    });

    test('should handle messages with unicode', () => {
      const messages = [
        { content: '你好世界' } // "Hello World" in Chinese
      ];
      
      const tokens = counter.countGoogleTokens(messages);
      
      expect(tokens).toBeGreaterThan(0);
    });

    test('should handle extremely long messages', () => {
      const hugeContent = 'a'.repeat(100000);
      const messages = [{ content: hugeContent }];
      
      const tokens = counter.countOpenAITokens(messages);
      
      expect(tokens).toBeGreaterThan(10000);
    });

  });

});
