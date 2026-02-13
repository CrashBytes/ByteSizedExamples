import { TokenCounter } from '../lib/token-counter.js';
import { getPricing } from '../lib/pricing-tables.js';

export class CostCalculator {
  constructor() {
    this.tokenCounter = new TokenCounter();
  }

  async calculate(requestData, responseData) {
    const { provider, model, messages } = requestData;
    
    // Count input tokens
    const inputTokens = await this.tokenCounter.countTokens(
      provider,
      model,
      messages
    );

    // Extract output tokens from response
    const outputTokens = this.extractOutputTokens(
      provider,
      responseData
    );

    // Get pricing for model
    const pricing = getPricing(provider, model);
    if (!pricing) {
      console.warn(`No pricing data for ${provider} ${model}`);
      return null;
    }

    // Calculate costs
    const inputCost = inputTokens * pricing.input;
    const outputCost = outputTokens * pricing.output;
    const totalCost = inputCost + outputCost;

    return {
      timestamp: requestData.timestamp,
      provider,
      model,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      inputCost,
      outputCost,
      totalCost,
      url: requestData.url
    };
  }

  extractOutputTokens(provider, response) {
    if (!response) return 0;

    try {
      if (provider === 'openai') {
        return response.usage?.completion_tokens || 0;
      }
      if (provider === 'anthropic') {
        return response.usage?.output_tokens || 0;
      }
      if (provider === 'google') {
        return response.usageMetadata?.candidatesTokenCount || 0;
      }
    } catch (error) {
      console.error('Failed to extract output tokens:', error);
    }

    return 0;
  }
}
