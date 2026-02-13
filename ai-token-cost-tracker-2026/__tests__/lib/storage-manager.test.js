/**
 * Test Suite: Storage Manager
 * Target: 100% Coverage
 * 
 * Tests data persistence and aggregation using Chrome storage API
 * Note: Uses mocked chrome.storage.local from __mocks__/chrome.js
 */

import { StorageManager } from '../../lib/storage-manager.js';

describe('StorageManager', () => {
  let manager;

  beforeEach(() => {
    manager = new StorageManager();
    // Chrome storage is reset before each test via chrome-setup.js
  });

  describe('Constructor', () => {

    test('should initialize with correct prefix', () => {
      expect(manager.prefix).toBe('aiTokenCost');
    });

  });

  describe('getDateKey()', () => {

    test('should format timestamp as YYYY-MM-DD', () => {
      const timestamp = new Date('2026-01-25T15:30:00Z').getTime();
      const dateKey = manager.getDateKey(timestamp);
      
      expect(dateKey).toBe('2026-01-25');
    });

    test('should handle midnight timestamp', () => {
      const timestamp = new Date('2026-01-25T00:00:00Z').getTime();
      const dateKey = manager.getDateKey(timestamp);
      
      expect(dateKey).toBe('2026-01-25');
    });

    test('should handle end of day timestamp', () => {
      const timestamp = new Date('2026-01-25T23:59:59Z').getTime();
      const dateKey = manager.getDateKey(timestamp);
      
      expect(dateKey).toBe('2026-01-25');
    });

    test('should handle different dates consistently', () => {
      const timestamps = [
        new Date('2026-01-01T12:00:00Z').getTime(),
        new Date('2026-06-15T18:45:00Z').getTime(),
        new Date('2026-12-31T23:59:59Z').getTime()
      ];

      const keys = timestamps.map(ts => manager.getDateKey(ts));

      expect(keys).toEqual(['2026-01-01', '2026-06-15', '2026-12-31']);
    });

  });

  describe('recordCost()', () => {

    test('should store individual call record', async () => {
      const costData = {
        timestamp: 1234567890000,
        provider: 'openai',
        model: 'gpt-4',
        totalCost: 0.05,
        inputTokens: 1000,
        outputTokens: 500
      };

      await manager.recordCost(costData);

      const key = `aiTokenCost_call_${costData.timestamp}`;
      const stored = await chrome.storage.local.get(key);

      expect(stored[key]).toEqual(costData);
    });

    test('should update daily total', async () => {
      const costData = {
        timestamp: Date.now(),
        provider: 'openai',
        totalCost: 0.05
      };

      await manager.recordCost(costData);

      const daily = await manager.getDailyTotal();
      
      expect(daily).toBe(0.05);
    });

    test('should update provider total', async () => {
      const costData = {
        timestamp: Date.now(),
        provider: 'anthropic',
        totalCost: 0.03
      };

      await manager.recordCost(costData);

      const breakdown = await manager.getProviderBreakdown();
      
      expect(breakdown.anthropic.cost).toBe(0.03);
    });

  });

  describe('updateDailyTotal()', () => {

    test('should create new daily record', async () => {
      const costData = {
        timestamp: new Date('2026-01-25T12:00:00Z').getTime(),
        totalCost: 0.10
      };

      await manager.updateDailyTotal(costData);

      const dateKey = '2026-01-25';
      const dailyKey = `aiTokenCost_daily_${dateKey}`;
      const result = await chrome.storage.local.get(dailyKey);

      expect(result[dailyKey]).toEqual({
        date: dateKey,
        cost: 0.10,
        calls: 1
      });
    });

    test('should accumulate costs for same day', async () => {
      const timestamp = new Date('2026-01-25T12:00:00Z').getTime();

      await manager.updateDailyTotal({ timestamp, totalCost: 0.05 });
      await manager.updateDailyTotal({ timestamp, totalCost: 0.03 });
      await manager.updateDailyTotal({ timestamp, totalCost: 0.02 });

      const daily = await manager.getDailyTotal(timestamp);

      expect(daily).toBe(0.10);
    });

    test('should increment call count', async () => {
      const timestamp = Date.now();

      await manager.updateDailyTotal({ timestamp, totalCost: 0.01 });
      await manager.updateDailyTotal({ timestamp, totalCost: 0.02 });

      const dateKey = manager.getDateKey(timestamp);
      const dailyKey = `aiTokenCost_daily_${dateKey}`;
      const result = await chrome.storage.local.get(dailyKey);

      expect(result[dailyKey].calls).toBe(2);
    });

    test('should handle zero cost', async () => {
      const costData = {
        timestamp: Date.now(),
        totalCost: 0
      };

      await manager.updateDailyTotal(costData);

      const daily = await manager.getDailyTotal();

      expect(daily).toBe(0);
    });

  });

  describe('updateProviderTotal()', () => {

    test('should create new provider record', async () => {
      const costData = {
        timestamp: new Date('2026-01-25T12:00:00Z').getTime(),
        provider: 'google',
        totalCost: 0.02
      };

      await manager.updateProviderTotal(costData);

      const dateKey = '2026-01-25';
      const providerKey = `aiTokenCost_provider_${dateKey}_google`;
      const result = await chrome.storage.local.get(providerKey);

      expect(result[providerKey]).toEqual({
        provider: 'google',
        date: dateKey,
        cost: 0.02,
        calls: 1
      });
    });

    test('should accumulate costs for same provider and day', async () => {
      const timestamp = Date.now();

      await manager.updateProviderTotal({ 
        timestamp, 
        provider: 'openai', 
        totalCost: 0.05 
      });
      await manager.updateProviderTotal({ 
        timestamp, 
        provider: 'openai', 
        totalCost: 0.03 
      });

      const breakdown = await manager.getProviderBreakdown();

      expect(breakdown.openai.cost).toBe(0.08);
      expect(breakdown.openai.calls).toBe(2);
    });

    test('should track multiple providers separately', async () => {
      const timestamp = Date.now();

      await manager.updateProviderTotal({ 
        timestamp, 
        provider: 'openai', 
        totalCost: 0.10 
      });
      await manager.updateProviderTotal({ 
        timestamp, 
        provider: 'anthropic', 
        totalCost: 0.05 
      });
      await manager.updateProviderTotal({ 
        timestamp, 
        provider: 'google', 
        totalCost: 0.02 
      });

      const breakdown = await manager.getProviderBreakdown();

      expect(breakdown.openai.cost).toBe(0.10);
      expect(breakdown.anthropic.cost).toBe(0.05);
      expect(breakdown.google.cost).toBe(0.02);
    });

  });

  describe('getDailyTotal()', () => {

    test('should return daily cost for specific date', async () => {
      const timestamp = new Date('2026-01-25T12:00:00Z').getTime();
      
      await manager.updateDailyTotal({ timestamp, totalCost: 0.15 });

      const total = await manager.getDailyTotal(timestamp);

      expect(total).toBe(0.15);
    });

    test('should return 0 for date with no data', async () => {
      const futureDate = new Date('2030-12-31').getTime();
      
      const total = await manager.getDailyTotal(futureDate);

      expect(total).toBe(0);
    });

    test('should default to current date if no date provided', async () => {
      const now = Date.now();
      
      await manager.updateDailyTotal({ timestamp: now, totalCost: 0.07 });

      const total = await manager.getDailyTotal();

      expect(total).toBe(0.07);
    });

  });

  describe('getHistoricalData()', () => {

    test('should return data for specified number of days', async () => {
      const now = Date.now();

      const data = await manager.getHistoricalData(7);

      expect(data).toHaveLength(7);
      expect(Array.isArray(data)).toBe(true);
    });

    test('should return data in chronological order (oldest first)', async () => {
      const data = await manager.getHistoricalData(5);

      for (let i = 1; i < data.length; i++) {
        const prevDate = new Date(data[i - 1].date);
        const currDate = new Date(data[i].date);
        expect(currDate.getTime()).toBeGreaterThan(prevDate.getTime());
      }
    });

    test('should include cost and calls for each day', async () => {
      const now = Date.now();
      
      await manager.updateDailyTotal({ timestamp: now, totalCost: 0.10 });

      const data = await manager.getHistoricalData(3);

      data.forEach(day => {
        expect(day).toHaveProperty('date');
        expect(day).toHaveProperty('cost');
        expect(day).toHaveProperty('calls');
        expect(typeof day.cost).toBe('number');
        expect(typeof day.calls).toBe('number');
      });
    });

    test('should return 0 cost for days with no data', async () => {
      const data = await manager.getHistoricalData(5);

      // No data recorded, all should be 0
      data.forEach(day => {
        expect(day.cost).toBe(0);
        expect(day.calls).toBe(0);
      });
    });

    test('should default to 30 days if no parameter provided', async () => {
      const data = await manager.getHistoricalData();

      expect(data).toHaveLength(30);
    });

    test('should handle custom day ranges', async () => {
      const data90 = await manager.getHistoricalData(90);
      const data1 = await manager.getHistoricalData(1);

      expect(data90).toHaveLength(90);
      expect(data1).toHaveLength(1);
    });

  });

  describe('getProviderBreakdown()', () => {

    test('should return breakdown for all providers', async () => {
      const timestamp = Date.now();

      await manager.updateProviderTotal({ 
        timestamp, 
        provider: 'openai', 
        totalCost: 0.10 
      });
      await manager.updateProviderTotal({ 
        timestamp, 
        provider: 'anthropic', 
        totalCost: 0.05 
      });

      const breakdown = await manager.getProviderBreakdown();

      expect(breakdown).toHaveProperty('openai');
      expect(breakdown).toHaveProperty('anthropic');
      expect(breakdown.openai.cost).toBe(0.10);
      expect(breakdown.anthropic.cost).toBe(0.05);
    });

    test('should return empty object for date with no data', async () => {
      const futureDate = new Date('2030-12-31').getTime();

      const breakdown = await manager.getProviderBreakdown(futureDate);

      expect(Object.keys(breakdown)).toHaveLength(0);
    });

    test('should default to current date if no date provided', async () => {
      const now = Date.now();

      await manager.updateProviderTotal({ 
        timestamp: now, 
        provider: 'google', 
        totalCost: 0.03 
      });

      const breakdown = await manager.getProviderBreakdown();

      expect(breakdown.google).toBeDefined();
      expect(breakdown.google.cost).toBe(0.03);
    });

    test('should only return providers with data', async () => {
      const timestamp = Date.now();

      await manager.updateProviderTotal({ 
        timestamp, 
        provider: 'openai', 
        totalCost: 0.10 
      });

      const breakdown = await manager.getProviderBreakdown();

      expect(breakdown).toHaveProperty('openai');
      expect(breakdown).not.toHaveProperty('anthropic');
      expect(breakdown).not.toHaveProperty('google');
    });

  });

  describe('Temporary Storage', () => {

    test('should set temporary data', async () => {
      const requestId = 'req_123';
      const data = { test: 'value' };

      await manager.setTemporary(requestId, data);

      const tempKey = `aiTokenCost_temp_${requestId}`;
      const stored = await chrome.storage.local.get(tempKey);

      expect(stored[tempKey]).toEqual(data);
    });

    test('should get temporary data', async () => {
      const requestId = 'req_456';
      const data = { foo: 'bar' };

      await manager.setTemporary(requestId, data);
      const retrieved = await manager.getTemporary(requestId);

      expect(retrieved).toEqual(data);
    });

    test('should return null for non-existent temporary data', async () => {
      const retrieved = await manager.getTemporary('nonexistent');

      expect(retrieved).toBeNull();
    });

    test('should clear temporary data', async () => {
      const requestId = 'req_789';
      const data = { temp: 'data' };

      await manager.setTemporary(requestId, data);
      await manager.clearTemporary(requestId);

      const retrieved = await manager.getTemporary(requestId);

      expect(retrieved).toBeNull();
    });

  });

  describe('cleanupOldData()', () => {

    test('should remove records older than 90 days', async () => {
      const now = Date.now();
      const oldTimestamp = now - (91 * 24 * 60 * 60 * 1000); // 91 days ago
      const recentTimestamp = now - (10 * 24 * 60 * 60 * 1000); // 10 days ago

      // Store old and recent records
      const oldKey = `aiTokenCost_call_${oldTimestamp}`;
      const recentKey = `aiTokenCost_call_${recentTimestamp}`;

      await chrome.storage.local.set({
        [oldKey]: { timestamp: oldTimestamp, cost: 0.01 },
        [recentKey]: { timestamp: recentTimestamp, cost: 0.02 }
      });

      await manager.cleanupOldData();

      const allData = await chrome.storage.local.get(null);

      expect(allData[oldKey]).toBeUndefined();
      expect(allData[recentKey]).toBeDefined();
    });

    test('should cleanup old records and maintain recent ones', async () => {
      const now = Date.now();
      const old1 = now - (95 * 24 * 60 * 60 * 1000);
      const old2 = now - (100 * 24 * 60 * 60 * 1000);

      await chrome.storage.local.set({
        [`aiTokenCost_call_${old1}`]: { timestamp: old1 },
        [`aiTokenCost_call_${old2}`]: { timestamp: old2 }
      });

      await manager.cleanupOldData();

      const allData = await chrome.storage.local.get(null);

      // Old records should be removed
      expect(allData[`aiTokenCost_call_${old1}`]).toBeUndefined();
      expect(allData[`aiTokenCost_call_${old2}`]).toBeUndefined();
    });

    test('should not remove recent records', async () => {
      const now = Date.now();
      const recent1 = now - (30 * 24 * 60 * 60 * 1000); // 30 days ago
      const recent2 = now - (60 * 24 * 60 * 60 * 1000); // 60 days ago

      await chrome.storage.local.set({
        [`aiTokenCost_call_${recent1}`]: { timestamp: recent1 },
        [`aiTokenCost_call_${recent2}`]: { timestamp: recent2 }
      });

      await manager.cleanupOldData();

      const allData = await chrome.storage.local.get(null);

      expect(allData[`aiTokenCost_call_${recent1}`]).toBeDefined();
      expect(allData[`aiTokenCost_call_${recent2}`]).toBeDefined();
    });

    test('should only cleanup call records, not daily/provider aggregates', async () => {
      const now = Date.now();
      const oldCall = now - (100 * 24 * 60 * 60 * 1000);
      const oldDate = manager.getDateKey(oldCall);

      await chrome.storage.local.set({
        [`aiTokenCost_call_${oldCall}`]: { timestamp: oldCall },
        [`aiTokenCost_daily_${oldDate}`]: { date: oldDate, cost: 0.10 },
        [`aiTokenCost_provider_${oldDate}_openai`]: { cost: 0.05 }
      });

      await manager.cleanupOldData();

      const allData = await chrome.storage.local.get(null);

      // Call record should be removed
      expect(allData[`aiTokenCost_call_${oldCall}`]).toBeUndefined();
      
      // But daily and provider aggregates should remain
      expect(allData[`aiTokenCost_daily_${oldDate}`]).toBeDefined();
      expect(allData[`aiTokenCost_provider_${oldDate}_openai`]).toBeDefined();
    });

  });

  describe('resetDaily()', () => {

    test('should complete reset without errors', async () => {
      // resetDaily should complete successfully
      await expect(manager.resetDaily()).resolves.not.toThrow();
    });

  });

  describe('Integration - Complete Flow', () => {

    test('should handle complete cost recording flow', async () => {
      const costData = {
        timestamp: Date.now(),
        provider: 'openai',
        model: 'gpt-4',
        inputTokens: 1000,
        outputTokens: 500,
        totalCost: 0.09,
        url: 'https://api.openai.com/v1/chat/completions'
      };

      // Record cost (updates everything)
      await manager.recordCost(costData);

      // Verify individual call stored
      const callKey = `aiTokenCost_call_${costData.timestamp}`;
      const callResult = await chrome.storage.local.get(callKey);
      expect(callResult[callKey]).toEqual(costData);

      // Verify daily total updated
      const dailyTotal = await manager.getDailyTotal();
      expect(dailyTotal).toBe(0.09);

      // Verify provider breakdown updated
      const breakdown = await manager.getProviderBreakdown();
      expect(breakdown.openai.cost).toBe(0.09);
      expect(breakdown.openai.calls).toBe(1);
    });

    test('should handle multiple API calls in one day', async () => {
      const timestamp = Date.now();

      const costs = [
        { timestamp, provider: 'openai', totalCost: 0.05 },
        { timestamp, provider: 'anthropic', totalCost: 0.03 },
        { timestamp, provider: 'openai', totalCost: 0.02 },
        { timestamp, provider: 'google', totalCost: 0.01 }
      ];

      for (const cost of costs) {
        await manager.recordCost(cost);
      }

      const dailyTotal = await manager.getDailyTotal();
      const breakdown = await manager.getProviderBreakdown();

      expect(dailyTotal).toBe(0.11);
      expect(breakdown.openai.cost).toBe(0.07);
      expect(breakdown.anthropic.cost).toBe(0.03);
      expect(breakdown.google.cost).toBe(0.01);
    });

  });

});
