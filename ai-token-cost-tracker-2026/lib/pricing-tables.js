// Current pricing as of January 2026 (per token in dollars)
export const PRICING_TABLES = {
  openai: {
    'gpt-4-turbo-preview': {
      input: 0.00001,  // $0.01 per 1K tokens
      output: 0.00003  // $0.03 per 1K tokens
    },
    'gpt-4': {
      input: 0.00003,
      output: 0.00006
    },
    'gpt-4-32k': {
      input: 0.00006,
      output: 0.00012
    },
    'gpt-3.5-turbo': {
      input: 0.0000005,
      output: 0.0000015
    },
    'gpt-3.5-turbo-16k': {
      input: 0.000003,
      output: 0.000004
    }
  },
  anthropic: {
    'claude-opus-4-20250514': {
      input: 0.000015,
      output: 0.000075
    },
    'claude-sonnet-4-20250514': {
      input: 0.000003,
      output: 0.000015
    },
    'claude-3-opus-20240229': {
      input: 0.000015,
      output: 0.000075
    },
    'claude-3-sonnet-20240229': {
      input: 0.000003,
      output: 0.000015
    },
    'claude-3-haiku-20240307': {
      input: 0.00000025,
      output: 0.00000125
    }
  },
  google: {
    'gemini-pro': {
      input: 0.00000025,
      output: 0.0000005
    },
    'gemini-pro-vision': {
      input: 0.00000025,
      output: 0.0000005
    },
    'gemini-1.5-pro': {
      input: 0.00000125,
      output: 0.000005
    },
    'gemini-1.5-flash': {
      input: 0.00000025,
      output: 0.0000005
    }
  }
};

export function getPricing(provider, model) {
  const providerPricing = PRICING_TABLES[provider];
  if (!providerPricing) return null;
  
  // Handle empty model string
  if (!model || model.trim() === '') return null;
  
  // Try exact match first
  if (providerPricing[model]) {
    return providerPricing[model];
  }
  
  // Try partial match (handles versioned models)
  for (const [key, pricing] of Object.entries(providerPricing)) {
    if (model.includes(key) || key.includes(model)) {
      return pricing;
    }
  }
  
  return null;
}
