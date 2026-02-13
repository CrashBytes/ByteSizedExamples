export class RequestInterceptor {
  parseRequest(details) {
    const url = new URL(details.url);
    const provider = this.identifyProvider(url);
    
    if (!provider) return null;

    let body;
    try {
      if (details.requestBody.raw) {
        const decoder = new TextDecoder('utf-8');
        const bodyText = decoder.decode(details.requestBody.raw[0].bytes);
        body = JSON.parse(bodyText);
      } else {
        return null;
      }
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return null;
    }

    return {
      provider,
      timestamp: Date.now(),
      requestId: details.requestId,
      url: details.url,
      model: this.extractModel(body, provider),
      messages: this.extractMessages(body, provider),
      rawBody: body
    };
  }

  identifyProvider(url) {
    if (url.hostname === 'api.openai.com') return 'openai';
    if (url.hostname === 'api.anthropic.com') return 'anthropic';
    if (url.hostname.includes('generativelanguage.googleapis.com')) return 'google';
    return null;
  }

  extractModel(body, provider) {
    if (provider === 'openai' || provider === 'google') {
      return body.model || 'unknown';
    }
    if (provider === 'anthropic') {
      return body.model || 'claude-3-sonnet-20240229';
    }
    return 'unknown';
  }

  extractMessages(body, provider) {
    if (provider === 'openai' || provider === 'google') {
      return body.messages || [];
    }
    if (provider === 'anthropic') {
      return body.messages || [];
    }
    return [];
  }
}
