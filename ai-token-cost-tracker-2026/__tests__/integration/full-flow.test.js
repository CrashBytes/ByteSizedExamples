/**
 * Integration Test Suite
 * Target: 100% Coverage of Complete Flow
 * 
 * Tests end-to-end flow: Request → Token Count → Cost Calculation → Storage
 */

import { CostCalculator } from '../../background/cost-calculator.js';
import { StorageManager } from '../../lib/storage-manager.js';
import { TokenCounter } from '../../lib/token-counter.js';
import { getPricing } from '../../lib/pricing-tables.js';

describe('Integration: Complete Cost Tracking Flow', () => {

  let calculator;
  let storageManager;

  beforeEach(() => {
    calculator = new CostCalculator();
    storageManager = new StorageManager();
  });

  describe('End-to-End: OpenAI Request', () => {

    test('should track complete OpenAI API call', async () => {
      // 1. Simulate API request
      const requestData = {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'What is the capital of France?' }
        ],
        timestamp: Date.now(),
        url: 'https://api.openai.com/v1/chat/completions'
      };

      // 2. Simulate API response
      const responseData = {
        id: 'chatcmpl-123',
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'The capital of France is Paris.'
            }
          }
        ],
        usage: {
          prompt_tokens: 23,
          completion_tokens: 8,
          total_tokens: 31
        }
      };

      // 3. Calculate cost
      const costData = await calculator.calculate(requestData, responseData);

      expect(costData).toBeDefined();
      expect(costData.provider).toBe('openai');
      expect(costData.model).toBe('gpt-3.5-turbo');
      expect(costData.totalCost).toBeGreaterThan(0);

      // 4. Store cost data
      await storageManager.recordCost(costData);

      // 5. Verify storage
      const dailyTotal = await storageManager.getDailyTotal();
      expect(dailyTotal).toBe(costData.totalCost);

      const breakdown = await storageManager.getProviderBreakdown();
      expect(breakdown.openai.cost).toBe(costData.totalCost);
    });

    test('should handle multiple sequential OpenAI calls', async () => {
      const calls = [
        {
          request: {
            provider: 'openai',
            model: 'gpt-4',
            messages: [{ role: 'user', content: 'Hello' }],
            timestamp: Date.now(),
            url: 'https://api.openai.com'
          },
          response: {
            usage: { completion_tokens: 50 }
          }
        },
        {
          request: {
            provider: 'openai',
            model: 'gpt-4',
            messages: [{ role: 'user', content: 'Tell me a story' }],
            timestamp: Date.now(),
            url: 'https://api.openai.com'
          },
          response: {
            usage: { completion_tokens: 200 }
          }
        }
      ];

      let totalExpectedCost = 0;

      for (const call of calls) {
        const costData = await calculator.calculate(call.request, call.response);
        await storageManager.recordCost(costData);
        totalExpectedCost += costData.totalCost;
      }

      const dailyTotal = await storageManager.getDailyTotal();
      expect(dailyTotal).toBeCloseTo(totalExpectedCost, 10);
    });

  });

  describe('End-to-End: Anthropic Request', () => {

    test('should track complete Anthropic API call', async () => {
      const requestData = {
        provider: 'anthropic',
        model: 'claude-3-opus-20240229',
        messages: [
          { content: 'Write a haiku about programming' }
        ],
        timestamp: Date.now(),
        url: 'https://api.anthropic.com/v1/messages'
      };

      const responseData = {
        id: 'msg_123',
        content: [
          {
            type: 'text',
            text: 'Code flows like water\nBugs dance in moonlit debug\nPeace found in compiles'
          }
        ],
        usage: {
          input_tokens: 12,
          output_tokens: 20
        }
      };

      const costData = await calculator.calculate(requestData, responseData);

      expect(costData).toBeDefined();
      expect(costData.provider).toBe('anthropic');
      expect(costData.totalCost).toBeGreaterThan(0);

      await storageManager.recordCost(costData);

      const breakdown = await storageManager.getProviderBreakdown();
      expect(breakdown.anthropic).toBeDefined();
    });

  });

  describe('End-to-End: Google Request', () => {

    test('should track complete Google API call', async () => {
      const requestData = {
        provider: 'google',
        model: 'gemini-1.5-pro',
        messages: [
          { content: 'Explain quantum computing' }
        ],
        timestamp: Date.now(),
        url: 'https://generativelanguage.googleapis.com'
      };

      const responseData = {
        candidates: [
          {
            content: {
              parts: [{ text: 'Quantum computing uses quantum bits...' }]
            }
          }
        ],
        usageMetadata: {
          promptTokenCount: 15,
          candidatesTokenCount: 50,
          totalTokenCount: 65
        }
      };

      const costData = await calculator.calculate(requestData, responseData);

      expect(costData).toBeDefined();
      expect(costData.provider).toBe('google');
      expect(costData.outputTokens).toBe(50);

      await storageManager.recordCost(costData);

      const breakdown = await storageManager.getProviderBreakdown();
      expect(breakdown.google).toBeDefined();
    });

  });

  describe('End-to-End: Multi-Provider Day', () => {

    test('should track costs across multiple providers', async () => {
      const timestamp = Date.now();

      // OpenAI call
      const openaiRequest = {
        provider: 'openai',
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Hello' }],
        timestamp,
        url: 'https://api.openai.com'
      };
      const openaiResponse = {
        usage: { completion_tokens: 20 }
      };

      // Anthropic call
      const anthropicRequest = {
        provider: 'anthropic',
        model: 'claude-3-sonnet-20240229',
        messages: [{ content: 'Hello' }],
        timestamp,
        url: 'https://api.anthropic.com'
      };
      const anthropicResponse = {
        usage: { output_tokens: 30 }
      };

      // Google call
      const googleRequest = {
        provider: 'google',
        model: 'gemini-1.5-flash',
        messages: [{ content: 'Hello' }],
        timestamp,
        url: 'https://generativelanguage.googleapis.com'
      };
      const googleResponse = {
        usageMetadata: { candidatesTokenCount: 25 }
      };

      // Process all calls
      const openaiCost = await calculator.calculate(openaiRequest, openaiResponse);
      const anthropicCost = await calculator.calculate(anthropicRequest, anthropicResponse);
      const googleCost = await calculator.calculate(googleRequest, googleResponse);

      await storageManager.recordCost(openaiCost);
      await storageManager.recordCost(anthropicCost);
      await storageManager.recordCost(googleCost);

      // Verify daily total
      const dailyTotal = await storageManager.getDailyTotal();
      const expectedTotal = openaiCost.totalCost + anthropicCost.totalCost + googleCost.totalCost;
      expect(dailyTotal).toBeCloseTo(expectedTotal, 10);

      // Verify provider breakdown
      const breakdown = await storageManager.getProviderBreakdown();
      expect(breakdown.openai).toBeDefined();
      expect(breakdown.anthropic).toBeDefined();
      expect(breakdown.google).toBeDefined();
      expect(breakdown.openai.calls).toBe(1);
      expect(breakdown.anthropic.calls).toBe(1);
      expect(breakdown.google.calls).toBe(1);
    });

  });

  describe('Historical Data Tracking', () => {

    test('should track costs over multiple days', async () => {
      const now = Date.now();
      const oneDayAgo = now - (1 * 24 * 60 * 60 * 1000);
      const twoDaysAgo = now - (2 * 24 * 60 * 60 * 1000);

      // Day 1 (2 days ago)
      const day1Request = {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Day 1' }],
        timestamp: twoDaysAgo,
        url: 'https://api.openai.com'
      };
      const day1Cost = await calculator.calculate(day1Request, { 
        usage: { completion_tokens: 10 } 
      });
      await storageManager.recordCost(day1Cost);

      // Day 2 (1 day ago)
      const day2Request = {
        provider: 'anthropic',
        model: 'claude-3-haiku-20240307',
        messages: [{ content: 'Day 2' }],
        timestamp: oneDayAgo,
        url: 'https://api.anthropic.com'
      };
      const day2Cost = await calculator.calculate(day2Request, { 
        usage: { output_tokens: 20 } 
      });
      await storageManager.recordCost(day2Cost);

      // Day 3 (today)
      const day3Request = {
        provider: 'google',
        model: 'gemini-1.5-flash',
        messages: [{ content: 'Day 3' }],
        timestamp: now,
        url: 'https://generativelanguage.googleapis.com'
      };
      const day3Cost = await calculator.calculate(day3Request, { 
        usageMetadata: { candidatesTokenCount: 15 } 
      });
      await storageManager.recordCost(day3Cost);

      // Get historical data
      const history = await storageManager.getHistoricalData(3);

      // Should have data for all 3 days
      expect(history).toHaveLength(3);
      
      // Total costs should match
      const totalHistoricalCost = history.reduce((sum, day) => sum + day.cost, 0);
      const expectedTotalCost = day1Cost.totalCost + day2Cost.totalCost + day3Cost.totalCost;
      expect(totalHistoricalCost).toBeCloseTo(expectedTotalCost, 10);
    });

  });

  describe('Error Scenarios', () => {

    test('should handle missing response gracefully', async () => {
      const requestData = {
        provider: 'openai',
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Test' }],
        timestamp: Date.now(),
        url: 'https://api.openai.com'
      };

      const costData = await calculator.calculate(requestData, null);

      expect(costData.outputTokens).toBe(0);
      expect(costData.outputCost).toBe(0);
      expect(costData.totalCost).toBeGreaterThan(0); // Input cost still applies
    });

    test('should handle unknown model gracefully', async () => {
      const requestData = {
        provider: 'openai',
        model: 'future-model-xyz',
        messages: [{ role: 'user', content: 'Test' }],
        timestamp: Date.now(),
        url: 'https://api.openai.com'
      };

      const responseData = {
        usage: { completion_tokens: 50 }
      };

      const costData = await calculator.calculate(requestData, responseData);

      expect(costData).toBeNull();
    });

  });

  describe('Pricing Validation', () => {

    test('should use correct pricing for each model', () => {
      const gpt4Pricing = getPricing('openai', 'gpt-4');
      const gpt35Pricing = getPricing('openai', 'gpt-3.5-turbo');
      const claudeOpusPricing = getPricing('anthropic', 'claude-3-opus-20240229');
      const geminiPricing = getPricing('google', 'gemini-1.5-pro');

      // GPT-4 should be more expensive than GPT-3.5
      expect(gpt4Pricing.input).toBeGreaterThan(gpt35Pricing.input);
      expect(gpt4Pricing.output).toBeGreaterThan(gpt35Pricing.output);

      // All pricing should be positive
      expect(gpt4Pricing.input).toBeGreaterThan(0);
      expect(gpt35Pricing.input).toBeGreaterThan(0);
      expect(claudeOpusPricing.input).toBeGreaterThan(0);
      expect(geminiPricing.input).toBeGreaterThan(0);
    });

  });

  describe('Real-World Cost Examples', () => {

    test('typical ChatGPT conversation should cost less than $0.01', async () => {
      const requestData = {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: 'What is 2+2?' }
        ],
        timestamp: Date.now(),
        url: 'https://api.openai.com'
      };

      const responseData = {
        usage: { completion_tokens: 5 }
      };

      const costData = await calculator.calculate(requestData, responseData);

      expect(costData.totalCost).toBeLessThan(0.01);
    });

    test('long GPT-4 conversation should be measurably expensive', async () => {
      const longContent = 'a'.repeat(5000); // Very long prompt

      const requestData = {
        provider: 'openai',
        model: 'gpt-4',
        messages: [
          { role: 'user', content: longContent }
        ],
        timestamp: Date.now(),
        url: 'https://api.openai.com'
      };

      const responseData = {
        usage: { completion_tokens: 1000 }
      };

      const costData = await calculator.calculate(requestData, responseData);

      expect(costData.totalCost).toBeGreaterThan(0.05); // Should be expensive
    });

  });

});
