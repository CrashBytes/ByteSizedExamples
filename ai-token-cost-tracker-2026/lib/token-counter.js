// Simplified token counter (production version would use tiktoken library)
export class TokenCounter {
  async countTokens(provider, model, messages) {
    switch (provider) {
      case 'openai':
        return this.countOpenAITokens(messages);
      case 'anthropic':
        return this.countAnthropicTokens(messages);
      case 'google':
        return this.countGoogleTokens(messages);
      default:
        return this.approximateTokens(messages);
    }
  }

  countOpenAITokens(messages) {
    // Simplified approximation  
    // Production: Use tiktoken library for exact counts
    let totalChars = 0;
    for (const message of messages) {
      // Message formatting tokens
      totalChars += 20; // Approximate overhead per message
      
      if (message.role) {
        totalChars += message.role.length;
      }
      if (message.content) {
        totalChars += message.content.length;
      }
      if (message.name) {
        totalChars += message.name.length;
      }
    }
    
    totalChars += 10; // Reply priming tokens
    
    // Approximate: 4 characters per token
    return Math.ceil(totalChars / 4);
  }

  countAnthropicTokens(messages) {
    // Anthropic approximation: ~0.75 tokens per character
    let totalChars = 0;
    for (const message of messages) {
      if (message.content) {
        totalChars += message.content.length;
      }
    }
    return Math.ceil(totalChars * 0.75);
  }

  countGoogleTokens(messages) {
    // Google approximation: ~0.8 tokens per character
    let totalChars = 0;
    for (const message of messages) {
      if (message.content) {
        totalChars += message.content.length;
      }
    }
    return Math.ceil(totalChars * 0.8);
  }

  approximateTokens(messages) {
    // Fallback approximation for unknown providers
    let totalChars = 0;
    for (const message of messages) {
      const content = typeof message === 'string' 
        ? message 
        : message.content || '';
      totalChars += content.length;
    }
    // Conservative estimate: 4 characters per token
    return Math.ceil(totalChars / 4);
  }
}
