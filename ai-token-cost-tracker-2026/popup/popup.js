import { StorageManager } from '../lib/storage-manager.js';

class PopupController {
  constructor() {
    this.storage = new StorageManager();
    this.init();
  }

  async init() {
    await this.loadData();
    this.setupEventListeners();
    
    // Refresh every 5 seconds
    setInterval(() => this.loadData(), 5000);
  }

  async loadData() {
    const dailyTotal = await this.storage.getDailyTotal();
    const weeklyTotal = await this.getWeeklyTotal();
    const monthlyTotal = await this.getMonthlyTotal();
    const providerBreakdown = await this.storage.getProviderBreakdown();

    document.getElementById('dailyTotal').textContent = 
      this.formatCurrency(dailyTotal);
    document.getElementById('weeklyTotal').textContent = 
      this.formatCurrency(weeklyTotal);
    document.getElementById('monthlyTotal').textContent = 
      this.formatCurrency(monthlyTotal);

    this.renderProviderBreakdown(providerBreakdown);
    await this.renderRecentCalls();
  }

  async getWeeklyTotal() {
    const data = await this.storage.getHistoricalData(7);
    return data.reduce((sum, day) => sum + day.cost, 0);
  }

  async getMonthlyTotal() {
    const data = await this.storage.getHistoricalData(30);
    return data.reduce((sum, day) => sum + day.cost, 0);
  }

  renderProviderBreakdown(breakdown) {
    const container = document.getElementById('providerList');
    container.innerHTML = '';

    if (Object.keys(breakdown).length === 0) {
      container.innerHTML = '<p class="empty">No API calls yet today</p>';
      return;
    }

    for (const [provider, data] of Object.entries(breakdown)) {
      const card = document.createElement('div');
      card.className = 'provider-card';
      card.innerHTML = `
        <span class="provider-name">${this.capitalizeProvider(provider)}</span>
        <span class="provider-cost">${this.formatCurrency(data.cost)}</span>
        <span class="provider-calls">${data.calls} calls</span>
      `;
      container.appendChild(card);
    }
  }

  async renderRecentCalls() {
    const allData = await chrome.storage.local.get(null);
    const calls = Object.entries(allData)
      .filter(([key]) => key.startsWith('aiTokenCost_call_'))
      .map(([_, data]) => data)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

    const container = document.getElementById('callsList');
    container.innerHTML = '';

    if (calls.length === 0) {
      container.innerHTML = '<p class="empty">No recent calls</p>';
      return;
    }

    calls.forEach(call => {
      const card = document.createElement('div');
      card.className = 'call-card';
      card.innerHTML = `
        <div class="call-time">${this.formatTime(call.timestamp)}</div>
        <div class="call-model">${call.model}</div>
        <div class="call-tokens">${call.totalTokens} tokens</div>
        <div class="call-cost">${this.formatCurrency(call.totalCost)}</div>
      `;
      container.appendChild(card);
    });
  }

  setupEventListeners() {
    document.getElementById('viewDetails').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });

    document.getElementById('resetDaily').addEventListener('click', async () => {
      if (confirm('Reset today\'s total? This cannot be undone.')) {
        await this.storage.resetDaily();
        await this.loadData();
      }
    });
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(amount);
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  capitalizeProvider(provider) {
    return provider.charAt(0).toUpperCase() + provider.slice(1);
  }
}

new PopupController();
