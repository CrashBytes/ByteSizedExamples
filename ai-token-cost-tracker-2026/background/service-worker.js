import { RequestInterceptor } from './request-interceptor.js';
import { CostCalculator } from './cost-calculator.js';
import { StorageManager } from '../lib/storage-manager.js';

class AITokenCostTracker {
  constructor() {
    this.interceptor = new RequestInterceptor();
    this.calculator = new CostCalculator();
    this.storage = new StorageManager();
    
    this.setupInterception();
    this.setupAlarms();
  }

  setupInterception() {
    // Monitor outgoing requests to AI APIs
    chrome.webRequest.onBeforeRequest.addListener(
      (details) => this.handleRequest(details),
      {
        urls: [
          'https://api.openai.com/v1/*',
          'https://api.anthropic.com/v1/*',
          'https://generativelanguage.googleapis.com/*'
        ]
      },
      ['requestBody']
    );

    // Capture response data
    chrome.webRequest.onCompleted.addListener(
      (details) => this.handleResponse(details),
      {
        urls: [
          'https://api.openai.com/v1/*',
          'https://api.anthropic.com/v1/*',
          'https://generativelanguage.googleapis.com/*'
        ]
      },
      ['responseHeaders']
    );
  }

  async handleRequest(details) {
    if (!details.requestBody) return;

    const requestData = this.interceptor.parseRequest(details);
    if (!requestData) return;

    // Store request data temporarily keyed by request ID
    await this.storage.setTemporary(details.requestId, requestData);
  }

  async handleResponse(details) {
    // Retrieve stored request data
    const requestData = await this.storage.getTemporary(details.requestId);
    if (!requestData) return;

    // Fetch response body (requires additional fetch)
    const response = await this.fetchResponseBody(details);
    
    const costData = await this.calculator.calculate(
      requestData,
      response
    );

    if (costData) {
      await this.storage.recordCost(costData);
      await this.updateBadge();
      await this.storage.clearTemporary(details.requestId);
    }
  }

  async fetchResponseBody(details) {
    // webRequest API doesn't provide response body
    // Must re-fetch to get completion data
    try {
      const response = await fetch(details.url, {
        headers: details.responseHeaders.reduce((acc, h) => {
          acc[h.name] = h.value;
          return acc;
        }, {})
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch response body:', error);
      return null;
    }
  }

  async updateBadge() {
    const dailyTotal = await this.storage.getDailyTotal();
    const displayText = dailyTotal >= 1 
      ? `$${dailyTotal.toFixed(0)}`
      : `${(dailyTotal * 100).toFixed(0)}¢`;
    
    chrome.action.setBadgeText({ text: displayText });
    chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
  }

  setupAlarms() {
    // Daily reset at midnight
    chrome.alarms.create('dailyReset', {
      when: this.getNextMidnight(),
      periodInMinutes: 1440 // 24 hours
    });

    // Cleanup old data weekly
    chrome.alarms.create('dataCleanup', {
      periodInMinutes: 10080 // 1 week
    });

    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'dailyReset') {
        this.storage.resetDaily();
        this.updateBadge();
      } else if (alarm.name === 'dataCleanup') {
        this.storage.cleanupOldData();
      }
    });
  }

  getNextMidnight() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime();
  }
}

// Initialize tracker on extension load
const tracker = new AITokenCostTracker();
