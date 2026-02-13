import { StorageManager } from '../lib/storage-manager.js';

class OptionsController {
  constructor() {
    this.storage = new StorageManager();
    this.charts = {};
    this.init();
  }

  async init() {
    await this.loadData();
    await this.renderCharts();
    this.setupEventListeners();
    await this.loadSettings();
    
    // Auto-refresh every 30 seconds
    setInterval(() => this.loadData(), 30000);
  }

  async loadData() {
    await Promise.all([
      this.loadSummaryCards(),
      this.loadProviderDetails(),
      this.loadRecentCalls()
    ]);
  }

  async loadSummaryCards() {
    const today = await this.storage.getDailyTotal();
    const week = await this.getWeeklyTotal();
    const month = await this.getMonthlyTotal();
    const allTime = await this.getAllTimeTotal();

    const todayCalls = await this.getTodayCalls();
    const weekCalls = await this.getWeekCalls();
    const monthCalls = await this.getMonthCalls();
    const allTimeCalls = await this.getAllTimeCalls();

    document.getElementById('todayTotal').textContent = this.formatCurrency(today);
    document.getElementById('weekTotal').textContent = this.formatCurrency(week);
    document.getElementById('monthTotal').textContent = this.formatCurrency(month);
    document.getElementById('allTimeTotal').textContent = this.formatCurrency(allTime);

    document.getElementById('todayCalls').textContent = `${todayCalls} calls`;
    document.getElementById('weekCalls').textContent = `${weekCalls} calls`;
    document.getElementById('monthCalls').textContent = `${monthCalls} calls`;
    document.getElementById('allTimeCalls').textContent = `${allTimeCalls} calls`;
  }

  async getWeeklyTotal() {
    const data = await this.storage.getHistoricalData(7);
    return data.reduce((sum, day) => sum + day.cost, 0);
  }

  async getMonthlyTotal() {
    const data = await this.storage.getHistoricalData(30);
    return data.reduce((sum, day) => sum + day.cost, 0);
  }

  async getAllTimeTotal() {
    const data = await this.storage.getHistoricalData(365);
    return data.reduce((sum, day) => sum + day.cost, 0);
  }

  async getTodayCalls() {
    const data = await this.storage.getHistoricalData(1);
    return data[0]?.calls || 0;
  }

  async getWeekCalls() {
    const data = await this.storage.getHistoricalData(7);
    return data.reduce((sum, day) => sum + day.calls, 0);
  }

  async getMonthCalls() {
    const data = await this.storage.getHistoricalData(30);
    return data.reduce((sum, day) => sum + day.calls, 0);
  }

  async getAllTimeCalls() {
    const data = await this.storage.getHistoricalData(365);
    return data.reduce((sum, day) => sum + day.calls, 0);
  }

  async renderCharts() {
    await this.renderCostTrendChart();
    await this.renderProviderBreakdownChart();
  }

  async renderCostTrendChart() {
    const data = await this.storage.getHistoricalData(30);
    const ctx = document.getElementById('costChart').getContext('2d');

    if (this.charts.costChart) {
      this.charts.costChart.destroy();
    }

    this.charts.costChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
        datasets: [{
          label: 'Daily Cost',
          data: data.map(d => d.cost),
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => `Cost: ${this.formatCurrency(context.parsed.y)}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => this.formatCurrency(value)
            }
          }
        }
      }
    });
  }

  async renderProviderBreakdownChart() {
    const breakdown = await this.getAllTimeProviderBreakdown();
    const ctx = document.getElementById('providerChart').getContext('2d');

    if (this.charts.providerChart) {
      this.charts.providerChart.destroy();
    }

    const providers = Object.keys(breakdown);
    const costs = Object.values(breakdown).map(d => d.cost);

    const colors = {
      openai: '#10a37f',
      anthropic: '#d97757',
      google: '#4285f4'
    };

    this.charts.providerChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: providers.map(p => this.capitalizeProvider(p)),
        datasets: [{
          data: costs,
          backgroundColor: providers.map(p => colors[p] || '#999'),
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = this.formatCurrency(context.parsed);
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  async getAllTimeProviderBreakdown() {
    const allData = await chrome.storage.local.get(null);
    const breakdown = {};

    Object.entries(allData)
      .filter(([key]) => key.startsWith('aiTokenCost_provider_'))
      .forEach(([key, data]) => {
        const provider = key.split('_')[2];
        if (!breakdown[provider]) {
          breakdown[provider] = { cost: 0, calls: 0 };
        }
        breakdown[provider].cost += data.cost;
        breakdown[provider].calls += data.calls;
      });

    return breakdown;
  }

  async loadProviderDetails() {
    const breakdown = await this.getAllTimeProviderBreakdown();
    const tbody = document.getElementById('providerTableBody');
    tbody.innerHTML = '';

    if (Object.keys(breakdown).length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty">No data available</td></tr>';
      return;
    }

    for (const [provider, data] of Object.entries(breakdown)) {
      const allCalls = await this.getProviderCalls(provider);
      const totalTokens = allCalls.reduce((sum, call) => sum + call.totalTokens, 0);
      const avgCost = data.cost / data.calls;

      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${this.capitalizeProvider(provider)}</strong></td>
        <td>${this.formatCurrency(data.cost)}</td>
        <td>${data.calls.toLocaleString()}</td>
        <td>${this.formatCurrency(avgCost)}</td>
        <td>${totalTokens.toLocaleString()}</td>
      `;
      tbody.appendChild(row);
    }
  }

  async getProviderCalls(provider) {
    const allData = await chrome.storage.local.get(null);
    return Object.entries(allData)
      .filter(([key]) => key.startsWith('aiTokenCost_call_'))
      .map(([_, data]) => data)
      .filter(call => call.provider === provider);
  }

  async loadRecentCalls() {
    const provider = document.getElementById('filterProvider').value;
    const days = parseInt(document.getElementById('filterDays').value);
    
    const allData = await chrome.storage.local.get(null);
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);

    let calls = Object.entries(allData)
      .filter(([key]) => key.startsWith('aiTokenCost_call_'))
      .map(([_, data]) => data)
      .filter(call => call.timestamp >= cutoffTime);

    if (provider !== 'all') {
      calls = calls.filter(call => call.provider === provider);
    }

    calls.sort((a, b) => b.timestamp - a.timestamp);

    const tbody = document.getElementById('callsTableBody');
    tbody.innerHTML = '';

    if (calls.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty">No calls found</td></tr>';
      return;
    }

    calls.forEach(call => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${this.formatDateTime(call.timestamp)}</td>
        <td>${this.capitalizeProvider(call.provider)}</td>
        <td><code>${call.model}</code></td>
        <td>${call.inputTokens.toLocaleString()}</td>
        <td>${call.outputTokens.toLocaleString()}</td>
        <td><strong>${call.totalTokens.toLocaleString()}</strong></td>
        <td><strong>${this.formatCurrency(call.totalCost)}</strong></td>
      `;
      tbody.appendChild(row);
    });
  }

  setupEventListeners() {
    // Filter controls
    document.getElementById('filterProvider').addEventListener('change', () => {
      this.loadRecentCalls();
    });

    document.getElementById('filterDays').addEventListener('change', () => {
      this.loadRecentCalls();
    });

    // Export CSV
    document.getElementById('exportCSV').addEventListener('click', () => {
      this.exportCSV();
    });

    // Settings
    document.getElementById('saveSettings').addEventListener('click', () => {
      this.saveSettings();
    });

    document.getElementById('resetSettings').addEventListener('click', () => {
      this.resetSettings();
    });

    // Data management
    document.getElementById('exportAllData').addEventListener('click', () => {
      this.exportAllData();
    });

    document.getElementById('clearOldData').addEventListener('click', () => {
      this.clearOldData();
    });

    document.getElementById('clearAllData').addEventListener('click', () => {
      this.clearAllData();
    });
  }

  async exportCSV() {
    const provider = document.getElementById('filterProvider').value;
    const days = parseInt(document.getElementById('filterDays').value);
    
    const allData = await chrome.storage.local.get(null);
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);

    let calls = Object.entries(allData)
      .filter(([key]) => key.startsWith('aiTokenCost_call_'))
      .map(([_, data]) => data)
      .filter(call => call.timestamp >= cutoffTime);

    if (provider !== 'all') {
      calls = calls.filter(call => call.provider === provider);
    }

    calls.sort((a, b) => b.timestamp - a.timestamp);

    const csv = [
      ['Timestamp', 'Provider', 'Model', 'Input Tokens', 'Output Tokens', 'Total Tokens', 'Cost'],
      ...calls.map(call => [
        new Date(call.timestamp).toISOString(),
        call.provider,
        call.model,
        call.inputTokens,
        call.outputTokens,
        call.totalTokens,
        call.totalCost
      ])
    ].map(row => row.join(',')).join('\n');

    this.downloadFile(csv, 'ai-token-costs.csv', 'text/csv');
  }

  async exportAllData() {
    const allData = await chrome.storage.local.get(null);
    const json = JSON.stringify(allData, null, 2);
    this.downloadFile(json, 'ai-token-tracker-data.json', 'application/json');
  }

  downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async loadSettings() {
    const settings = await chrome.storage.local.get(['settings']);
    const defaults = {
      notificationsEnabled: false,
      notificationThreshold: 10.00,
      badgeEnabled: true
    };

    const current = settings.settings || defaults;

    document.getElementById('notificationsEnabled').checked = current.notificationsEnabled;
    document.getElementById('notificationThreshold').value = current.notificationThreshold;
    document.getElementById('badgeEnabled').checked = current.badgeEnabled;
  }

  async saveSettings() {
    const settings = {
      notificationsEnabled: document.getElementById('notificationsEnabled').checked,
      notificationThreshold: parseFloat(document.getElementById('notificationThreshold').value),
      badgeEnabled: document.getElementById('badgeEnabled').checked
    };

    await chrome.storage.local.set({ settings });
    alert('✅ Settings saved successfully!');
  }

  async resetSettings() {
    if (!confirm('Reset all settings to defaults?')) return;

    const defaults = {
      notificationsEnabled: false,
      notificationThreshold: 10.00,
      badgeEnabled: true
    };

    await chrome.storage.local.set({ settings: defaults });
    await this.loadSettings();
    alert('✅ Settings reset to defaults!');
  }

  async clearOldData() {
    if (!confirm('Clear data older than 90 days? This cannot be undone.')) return;

    await this.storage.cleanupOldData();
    await this.loadData();
    await this.renderCharts();
    alert('✅ Old data cleared successfully!');
  }

  async clearAllData() {
    if (!confirm('⚠️ Clear ALL data? This will delete everything and cannot be undone!')) return;
    if (!confirm('Are you absolutely sure? This action is permanent.')) return;

    await chrome.storage.local.clear();
    await this.loadData();
    await this.renderCharts();
    alert('✅ All data cleared!');
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(amount);
  }

  formatDateTime(timestamp) {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  capitalizeProvider(provider) {
    return provider.charAt(0).toUpperCase() + provider.slice(1);
  }
}

// Initialize controller when DOM is ready
new OptionsController();
