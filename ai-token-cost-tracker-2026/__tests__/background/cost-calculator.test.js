/**
 * Test Suite: Cost Calculator
 * Target: 100% Coverage
 * 
 * Tests cost calculation logic that combines token counting with pricing
 */

import { CostCalculator } from '../../background/cost-calculator.js';

describe('CostCalculator', () => {
  let calculator;
  let originalCountTokens;

  beforeEach(() => {
    calculator = new CostCalculator();
    // Save original method to restore later
    originalCountTokens = calculator.tokenCounter.countTokens;
  });

  afterEach(() => {
    // Restore original method
    if (originalCountTokens) {
      calculator.tokenCounter.countTokens = originalCountTokens;
    }
  });

  describe('Constructor', () => {
    
    test('should create TokenCounter instance', () => {
      expect(calculator.tokenCounter).toBeDefined();
      expect(typeof calculator.tokenCounter.countTokens).toBe('function');
    });

  });

  describe('calculate()', () => {

    describe('Successful Calculations', () => {

      test('should calculate cost for OpenAI request', async () => {
        // Mock the token counter
        calculator.tokenCounter.countTokens = async () => 100;

        const requestData = {
          provider: 'openai',
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Hello' }],
          timestamp: Date.now(),
          url: 'https://api.openai.com/v1/chat/completions'
        };

        const responseData = {
          usage: {
            completion_tokens: 50
          }
        };

        const result = await calculator.calculate(requestData, responseData);

        expect(result).toEqual({
          timestamp: requestData.timestamp,
          provider: 'openai',
          model: 'gpt-3.5-turbo',
          inputTokens: 100,
          outputTokens: 50,
          totalTokens: 150,
          inputCost: 100 * 0.0000005,  // $0.00005
          outputCost: 50 * 0.0000015,  // $0.000075
          totalCost: (100 * 0.0000005) + (50 * 0.0000015),  // $0.000125
          url: requestData.url
        });
      });

      test('should calculate cost for Anthropic request', async () => {
        calculator.tokenCounter.countTokens = async () => 200;

        const requestData = {
          provider: 'anthropic',
          model: 'claude-3-haiku-20240307',
          messages: [{ content: 'Hello' }],
          timestamp: Date.now(),
          url: 'https://api.anthropic.com/v1/messages'
        };

        const responseData = {
          usage: {
            output_tokens: 100
          }
        };

        const result = await calculator.calculate(requestData, responseData);

        expect(result).toEqual({
          timestamp: requestData.timestamp,
          provider: 'anthropic',
          model: 'claude-3-haiku-20240307',
          inputTokens: 200,
          outputTokens: 100,
          totalTokens: 300,
          inputCost: 200 * 0.00000025,
          outputCost: 100 * 0.00000125,
          totalCost: (200 * 0.00000025) + (100 * 0.00000125),
          url: requestData.url
        });
      });

      test('should calculate cost for Google request', async () => {
        calculator.tokenCounter.countTokens = async () => 150;

        const requestData = {
          provider: 'google',
          model: 'gemini-1.5-flash',
          messages: [{ content: 'Hello' }],
          timestamp: Date.now(),
          url: 'https://generativelanguage.googleapis.com/v1/models/gemini'
        };

        const responseData = {
          usageMetadata: {
            candidatesTokenCount: 75
          }
        };

        const result = await calculator.calculate(requestData, responseData);

        expect(result.provider).toBe('google');
        expect(result.model).toBe('gemini-1.5-flash');
        expect(result.inputTokens).toBe(150);
        expect(result.outputTokens).toBe(75);
        expect(result.totalTokens).toBe(225);
      });

      test('should handle zero output tokens', async () => {
        calculator.tokenCounter.countTokens = async () => 50;

        const requestData = {
          provider: 'openai',
          model: 'gpt-4',
          messages: [{ role: 'user', content: 'Hi' }],
          timestamp: Date.now(),
          url: 'https://api.openai.com/v1/chat/completions'
        };

        const responseData = {
          usage: {
            completion_tokens: 0
          }
        };

        const result = await calculator.calculate(requestData, responseData);

        expect(result.outputTokens).toBe(0);
        expect(result.outputCost).toBe(0);
        expect(result.totalCost).toBe(50 * 0.00003); // Only input cost
      });

      test('should handle large token counts', async () => {
        calculator.tokenCounter.countTokens = async () => 20000;

        const requestData = {
          provider: 'openai',
          model: 'gpt-4-32k',
          messages: [{ role: 'user', content: 'Long content...' }],
          timestamp: Date.now(),
          url: 'https://api.openai.com/v1/chat/completions'
        };

        const responseData = {
          usage: {
            completion_tokens: 10000
          }
        };

        const result = await calculator.calculate(requestData, responseData);

        expect(result.inputTokens).toBe(20000);
        expect(result.outputTokens).toBe(10000);
        expect(result.totalTokens).toBe(30000);
        expect(result.totalCost).toBeGreaterThan(1); // Should be expensive
      });

    });

    describe('Error Handling', () => {

      test('should return null for unknown model', async () => {
        calculator.tokenCounter.countTokens = async () => 100;

        const requestData = {
          provider: 'openai',
          model: 'nonexistent-model',
          messages: [{ role: 'user', content: 'Hello' }],
          timestamp: Date.now(),
          url: 'https://api.openai.com/v1/chat/completions'
        };

        const responseData = {
          usage: { completion_tokens: 50 }
        };

        const result = await calculator.calculate(requestData, responseData);

        expect(result).toBeNull();
      });

      test('should return null for unknown provider', async () => {
        calculator.tokenCounter.countTokens = async () => 100;

        const requestData = {
          provider: 'unknown-provider',
          model: 'some-model',
          messages: [{ content: 'Hello' }],
          timestamp: Date.now(),
          url: 'https://unknown-api.com'
        };

        const responseData = {};

        const result = await calculator.calculate(requestData, responseData);

        expect(result).toBeNull();
      });

      test('should handle missing response data', async () => {
        calculator.tokenCounter.countTokens = async () => 100;

        const requestData = {
          provider: 'openai',
          model: 'gpt-4',
          messages: [{ role: 'user', content: 'Hello' }],
          timestamp: Date.now(),
          url: 'https://api.openai.com/v1/chat/completions'
        };

        const result = await calculator.calculate(requestData, null);

        expect(result.outputTokens).toBe(0);
        expect(result.outputCost).toBe(0);
      });

      test('should warn about unknown model', async () => {
        calculator.tokenCounter.countTokens = async () => 100;

        const requestData = {
          provider: 'openai',
          model: 'future-model-xyz',
          messages: [{ role: 'user', content: 'Hello' }],
          timestamp: Date.now(),
          url: 'https://api.openai.com'
        };

        const result = await calculator.calculate(requestData, {});

        // Should return null for unknown model
        expect(result).toBeNull();
      });

    });

  });

  describe('extractOutputTokens()', () => {

    describe('OpenAI Format', () => {

      test('should extract completion_tokens from OpenAI response', () => {
        const response = {
          usage: {
            completion_tokens: 150
          }
        };

        const tokens = calculator.extractOutputTokens('openai', response);

        expect(tokens).toBe(150);
      });

      test('should return 0 if usage is missing', () => {
        const response = {
          choices: [{ message: { content: 'Hello' } }]
        };

        const tokens = calculator.extractOutputTokens('openai', response);

        expect(tokens).toBe(0);
      });

      test('should return 0 if completion_tokens is missing', () => {
        const response = {
          usage: {
            prompt_tokens: 100
          }
        };

        const tokens = calculator.extractOutputTokens('openai', response);

        expect(tokens).toBe(0);
      });

      test('should handle completion_tokens as 0', () => {
        const response = {
          usage: {
            completion_tokens: 0
          }
        };

        const tokens = calculator.extractOutputTokens('openai', response);

        expect(tokens).toBe(0);
      });

    });

    describe('Anthropic Format', () => {

      test('should extract output_tokens from Anthropic response', () => {
        const response = {
          usage: {
            output_tokens: 200
          }
        };

        const tokens = calculator.extractOutputTokens('anthropic', response);

        expect(tokens).toBe(200);
      });

      test('should return 0 if usage is missing', () => {
        const response = {
          content: [{ text: 'Hello' }]
        };

        const tokens = calculator.extractOutputTokens('anthropic', response);

        expect(tokens).toBe(0);
      });

      test('should return 0 if output_tokens is missing', () => {
        const response = {
          usage: {
            input_tokens: 100
          }
        };

        const tokens = calculator.extractOutputTokens('anthropic', response);

        expect(tokens).toBe(0);
      });

    });

    describe('Google Format', () => {

      test('should extract candidatesTokenCount from Google response', () => {
        const response = {
          usageMetadata: {
            candidatesTokenCount: 75
          }
        };

        const tokens = calculator.extractOutputTokens('google', response);

        expect(tokens).toBe(75);
      });

      test('should return 0 if usageMetadata is missing', () => {
        const response = {
          candidates: [{ content: { parts: [{ text: 'Hello' }] } }]
        };

        const tokens = calculator.extractOutputTokens('google', response);

        expect(tokens).toBe(0);
      });

      test('should return 0 if candidatesTokenCount is missing', () => {
        const response = {
          usageMetadata: {
            promptTokenCount: 50
          }
        };

        const tokens = calculator.extractOutputTokens('google', response);

        expect(tokens).toBe(0);
      });

    });

    describe('Edge Cases', () => {

      test('should return 0 for null response', () => {
        const tokens = calculator.extractOutputTokens('openai', null);
        expect(tokens).toBe(0);
      });

      test('should return 0 for undefined response', () => {
        const tokens = calculator.extractOutputTokens('anthropic', undefined);
        expect(tokens).toBe(0);
      });

      test('should return 0 for empty object response', () => {
        const tokens = calculator.extractOutputTokens('google', {});
        expect(tokens).toBe(0);
      });

      test('should return 0 for unknown provider', () => {
        const response = {
          usage: { tokens: 100 }
        };

        const tokens = calculator.extractOutputTokens('unknown-provider', response);

        expect(tokens).toBe(0);
      });

      test('should handle malformed response gracefully', () => {
        const response = {
          usage: 'invalid' // Should be an object
        };

        // Should return 0 for malformed responses
        const tokens = calculator.extractOutputTokens('openai', response);

        expect(tokens).toBe(0);
      });

      test('should handle response that throws error during extraction', () => {
        // Create a response object that throws when accessed
        const response = {
          get usage() {
            throw new Error('Access denied');
          }
        };

        // Should catch error and return 0
        const tokens = calculator.extractOutputTokens('openai', response);

        expect(tokens).toBe(0);
      });

    });

  });

  describe('Integration - Real-World Scenarios', () => {

    test('should calculate cost for typical ChatGPT conversation', async () => {
      calculator.tokenCounter.countTokens = async () => 20;

      const requestData = {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are helpful.' },
          { role: 'user', content: 'What is 2+2?' }
        ],
        timestamp: 1234567890000,
        url: 'https://api.openai.com/v1/chat/completions'
      };

      const responseData = {
        usage: {
          prompt_tokens: 20,
          completion_tokens: 10,
          total_tokens: 30
        }
      };

      const result = await calculator.calculate(requestData, responseData);

      expect(result).toBeDefined();
      expect(result.totalCost).toBeGreaterThan(0);
      expect(result.totalCost).toBeLessThan(0.01); // Should be very cheap
    });

    test('should calculate cost for expensive GPT-4 request', async () => {
      calculator.tokenCounter.countTokens = async () => 1000;

      const requestData = {
        provider: 'openai',
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Long analysis...' }],
        timestamp: Date.now(),
        url: 'https://api.openai.com/v1/chat/completions'
      };

      const responseData = {
        usage: {
          completion_tokens: 1000
        }
      };

      const result = await calculator.calculate(requestData, responseData);

      expect(result.totalCost).toBeGreaterThan(0.05); // GPT-4 is expensive
    });

  });

});
