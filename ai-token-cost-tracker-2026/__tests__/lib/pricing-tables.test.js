/**
 * Test Suite: Pricing Tables
 * Target: 100% Coverage
 * 
 * Tests the pricing lookup logic for all AI providers
 */

import { PRICING_TABLES, getPricing } from '../../lib/pricing-tables.js';

describe('PRICING_TABLES', () => {
  
  describe('Data Structure Validation', () => {
    
    test('should contain all three providers', () => {
      expect(PRICING_TABLES).toHaveProperty('openai');
      expect(PRICING_TABLES).toHaveProperty('anthropic');
      expect(PRICING_TABLES).toHaveProperty('google');
    });

    test('should have valid pricing structure for OpenAI', () => {
      const openai = PRICING_TABLES.openai;
      expect(Object.keys(openai).length).toBeGreaterThan(0);
      
      Object.entries(openai).forEach(([model, pricing]) => {
        expect(pricing).toHaveProperty('input');
        expect(pricing).toHaveProperty('output');
        expect(typeof pricing.input).toBe('number');
        expect(typeof pricing.output).toBe('number');
        expect(pricing.input).toBeGreaterThan(0);
        expect(pricing.output).toBeGreaterThan(0);
      });
    });

    test('should have valid pricing structure for Anthropic', () => {
      const anthropic = PRICING_TABLES.anthropic;
      expect(Object.keys(anthropic).length).toBeGreaterThan(0);
      
      Object.entries(anthropic).forEach(([model, pricing]) => {
        expect(pricing).toHaveProperty('input');
        expect(pricing).toHaveProperty('output');
        expect(typeof pricing.input).toBe('number');
        expect(typeof pricing.output).toBe('number');
        expect(pricing.input).toBeGreaterThan(0);
        expect(pricing.output).toBeGreaterThan(0);
      });
    });

    test('should have valid pricing structure for Google', () => {
      const google = PRICING_TABLES.google;
      expect(Object.keys(google).length).toBeGreaterThan(0);
      
      Object.entries(google).forEach(([model, pricing]) => {
        expect(pricing).toHaveProperty('input');
        expect(pricing).toHaveProperty('output');
        expect(typeof pricing.input).toBe('number');
        expect(typeof pricing.output).toBe('number');
        expect(pricing.input).toBeGreaterThan(0);
        expect(pricing.output).toBeGreaterThan(0);
      });
    });

    test('output pricing should be higher than input for all models', () => {
      // Generally, output tokens cost more than input tokens
      Object.values(PRICING_TABLES).forEach(provider => {
        Object.entries(provider).forEach(([model, pricing]) => {
          expect(pricing.output).toBeGreaterThanOrEqual(pricing.input);
        });
      });
    });

  });

});

describe('getPricing()', () => {

  describe('Exact Model Matching', () => {

    test('should return pricing for exact OpenAI model match', () => {
      const pricing = getPricing('openai', 'gpt-4-turbo-preview');
      expect(pricing).toEqual({
        input: 0.00001,
        output: 0.00003,
      });
    });

    test('should return pricing for exact Anthropic model match', () => {
      const pricing = getPricing('anthropic', 'claude-3-opus-20240229');
      expect(pricing).toEqual({
        input: 0.000015,
        output: 0.000075,
      });
    });

    test('should return pricing for exact Google model match', () => {
      const pricing = getPricing('google', 'gemini-1.5-pro');
      expect(pricing).toEqual({
        input: 0.00000125,
        output: 0.000005,
      });
    });

    test('should return pricing for gpt-4', () => {
      const pricing = getPricing('openai', 'gpt-4');
      expect(pricing).toEqual({
        input: 0.00003,
        output: 0.00006,
      });
    });

    test('should return pricing for gpt-3.5-turbo', () => {
      const pricing = getPricing('openai', 'gpt-3.5-turbo');
      expect(pricing).toEqual({
        input: 0.0000005,
        output: 0.0000015,
      });
    });

    test('should return pricing for claude-sonnet-4', () => {
      const pricing = getPricing('anthropic', 'claude-sonnet-4-20250514');
      expect(pricing).toEqual({
        input: 0.000003,
        output: 0.000015,
      });
    });

  });

  describe('Partial Model Matching (Versioned Models)', () => {

    test('should match versioned OpenAI models with partial match', () => {
      // Model name includes "gpt-4-turbo" but has additional version suffix
      const pricing = getPricing('openai', 'gpt-4-turbo-2024-01-25');
      expect(pricing).toBeDefined();
      expect(pricing.input).toBeGreaterThan(0);
    });

    test('should match versioned Anthropic models with partial match', () => {
      // Model name includes "claude-3-opus" which should match our table entry
      const pricing = getPricing('anthropic', 'claude-3-opus-20240229-test');
      expect(pricing).toBeDefined();
      expect(pricing.input).toBe(0.000015);
    });

    test('should match Google models with partial match', () => {
      const pricing = getPricing('google', 'gemini-pro-v2');
      expect(pricing).toBeDefined();
      expect(pricing.input).toBeGreaterThan(0);
    });

    test('should match models when base name is substring', () => {
      // "gpt-4" should match "gpt-4-32k"
      const pricing = getPricing('openai', 'gpt-4-32k-0314');
      expect(pricing).toBeDefined();
    });

  });

  describe('Edge Cases', () => {

    test('should return null for unknown provider', () => {
      const pricing = getPricing('unknown-provider', 'some-model');
      expect(pricing).toBeNull();
    });

    test('should return null for unknown model in valid provider', () => {
      const pricing = getPricing('openai', 'nonexistent-model-xyz');
      expect(pricing).toBeNull();
    });

    test('should return null for empty provider string', () => {
      const pricing = getPricing('', 'gpt-4');
      expect(pricing).toBeNull();
    });

    test('should return null for empty model string', () => {
      const pricing = getPricing('openai', '');
      expect(pricing).toBeNull();
    });

    test('should handle case-sensitive provider names', () => {
      // Provider names are case-sensitive
      const pricing = getPricing('OpenAI', 'gpt-4');
      expect(pricing).toBeNull();
    });

    test('should handle case-sensitive model names', () => {
      // Model names are case-sensitive
      const pricing = getPricing('openai', 'GPT-4');
      expect(pricing).toBeNull();
    });

  });

  describe('All Models Coverage', () => {

    test('should return pricing for all OpenAI models', () => {
      const models = Object.keys(PRICING_TABLES.openai);
      models.forEach(model => {
        const pricing = getPricing('openai', model);
        expect(pricing).toBeDefined();
        expect(pricing.input).toBeGreaterThan(0);
        expect(pricing.output).toBeGreaterThan(0);
      });
    });

    test('should return pricing for all Anthropic models', () => {
      const models = Object.keys(PRICING_TABLES.anthropic);
      models.forEach(model => {
        const pricing = getPricing('anthropic', model);
        expect(pricing).toBeDefined();
        expect(pricing.input).toBeGreaterThan(0);
        expect(pricing.output).toBeGreaterThan(0);
      });
    });

    test('should return pricing for all Google models', () => {
      const models = Object.keys(PRICING_TABLES.google);
      models.forEach(model => {
        const pricing = getPricing('google', model);
        expect(pricing).toBeDefined();
        expect(pricing.input).toBeGreaterThan(0);
        expect(pricing.output).toBeGreaterThan(0);
      });
    });

  });

  describe('Pricing Value Validation', () => {

    test('GPT-4 should be more expensive than GPT-3.5', () => {
      const gpt4 = getPricing('openai', 'gpt-4');
      const gpt35 = getPricing('openai', 'gpt-3.5-turbo');
      
      expect(gpt4.input).toBeGreaterThan(gpt35.input);
      expect(gpt4.output).toBeGreaterThan(gpt35.output);
    });

    test('Claude Opus should be more expensive than Haiku', () => {
      const opus = getPricing('anthropic', 'claude-3-opus-20240229');
      const haiku = getPricing('anthropic', 'claude-3-haiku-20240307');
      
      expect(opus.input).toBeGreaterThan(haiku.input);
      expect(opus.output).toBeGreaterThan(haiku.output);
    });

    test('pricing should be in reasonable ranges', () => {
      // Prices should be in the range of $0.0000001 to $0.001 per token
      Object.values(PRICING_TABLES).forEach(provider => {
        Object.values(provider).forEach(pricing => {
          expect(pricing.input).toBeGreaterThan(0.0000001);
          expect(pricing.input).toBeLessThan(0.001);
          expect(pricing.output).toBeGreaterThan(0.0000001);
          expect(pricing.output).toBeLessThan(0.001);
        });
      });
    });

  });

});
