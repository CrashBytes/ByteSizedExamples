export class StorageManager {
  constructor() {
    this.prefix = 'aiTokenCost';
  }

  async recordCost(costData) {
    // Store individual call record
    const callKey = `${this.prefix}_call_${costData.timestamp}`;
    await chrome.storage.local.set({ [callKey]: costData });

    // Update daily aggregate
    await this.updateDailyTotal(costData);

    // Update per-provider aggregates
    await this.updateProviderTotal(costData);
  }

  async updateDailyTotal(costData) {
    const dateKey = this.getDateKey(costData.timestamp);
    const dailyKey = `${this.prefix}_daily_${dateKey}`;
    
    const result = await chrome.storage.local.get(dailyKey);
    const current = result[dailyKey] || { date: dateKey, cost: 0, calls: 0 };
    
    current.cost += costData.totalCost;
    current.calls += 1;
    
    await chrome.storage.local.set({ [dailyKey]: current });
  }

  async updateProviderTotal(costData) {
    const dateKey = this.getDateKey(costData.timestamp);
    const providerKey = `${this.prefix}_provider_${dateKey}_${costData.provider}`;
    
    const result = await chrome.storage.local.get(providerKey);
    const current = result[providerKey] || { 
      provider: costData.provider,
      date: dateKey,
      cost: 0,
      calls: 0
    };
    
    current.cost += costData.totalCost;
    current.calls += 1;
    
    await chrome.storage.local.set({ [providerKey]: current });
  }

  async getDailyTotal(date = null) {
    const dateKey = date ? this.getDateKey(date) : this.getDateKey(Date.now());
    const dailyKey = `${this.prefix}_daily_${dateKey}`;
    
    const result = await chrome.storage.local.get(dailyKey);
    return result[dailyKey]?.cost || 0;
  }

  async getHistoricalData(days = 30) {
    const data = [];
    const now = Date.now();
    
    for (let i = 0; i < days; i++) {
      const date = now - (i * 24 * 60 * 60 * 1000);
      const dateKey = this.getDateKey(date);
      const dailyKey = `${this.prefix}_daily_${dateKey}`;
      
      const result = await chrome.storage.local.get(dailyKey);
      data.push({
        date: dateKey,
        cost: result[dailyKey]?.cost || 0,
        calls: result[dailyKey]?.calls || 0
      });
    }
    
    return data.reverse();
  }

  async getProviderBreakdown(date = null) {
    const dateKey = date ? this.getDateKey(date) : this.getDateKey(Date.now());
    const providers = ['openai', 'anthropic', 'google'];
    const breakdown = {};
    
    for (const provider of providers) {
      const providerKey = `${this.prefix}_provider_${dateKey}_${provider}`;
      const result = await chrome.storage.local.get(providerKey);
      
      if (result[providerKey]) {
        breakdown[provider] = result[providerKey];
      }
    }
    
    return breakdown;
  }

  async cleanupOldData() {
    // Remove data older than 90 days
    const cutoff = Date.now() - (90 * 24 * 60 * 60 * 1000);
    const allData = await chrome.storage.local.get(null);
    
    const keysToRemove = [];
    for (const [key, value] of Object.entries(allData)) {
      if (key.startsWith(`${this.prefix}_call_`)) {
        const timestamp = parseInt(key.split('_').pop());
        if (timestamp < cutoff) {
          keysToRemove.push(key);
        }
      }
    }
    
    if (keysToRemove.length > 0) {
      await chrome.storage.local.remove(keysToRemove);
      console.log(`Cleaned up ${keysToRemove.length} old records`);
    }
  }

  async resetDaily() {
    // Called at midnight to start fresh day
    const yesterday = Date.now() - (24 * 60 * 60 * 1000);
    const dateKey = this.getDateKey(yesterday);
    console.log(`Daily reset completed. Yesterday (${dateKey}) data preserved.`);
  }

  async setTemporary(requestId, data) {
    const tempKey = `${this.prefix}_temp_${requestId}`;
    await chrome.storage.local.set({ [tempKey]: data });
  }

  async getTemporary(requestId) {
    const tempKey = `${this.prefix}_temp_${requestId}`;
    const result = await chrome.storage.local.get(tempKey);
    return result[tempKey] || null;
  }

  async clearTemporary(requestId) {
    const tempKey = `${this.prefix}_temp_${requestId}`;
    await chrome.storage.local.remove(tempKey);
  }

  getDateKey(timestamp) {
    const date = new Date(timestamp);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }
}
