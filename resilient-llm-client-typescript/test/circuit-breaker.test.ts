import { describe, it, expect } from 'vitest';
import { CircuitBreaker } from '../src/circuit-breaker.js';

describe('CircuitBreaker', () => {
  it('starts closed and allows requests', () => {
    const cb = new CircuitBreaker();
    expect(cb.currentState).toBe('closed');
    expect(cb.canRequest()).toBe(true);
  });

  it('opens after the failure threshold and blocks requests during cooldown', () => {
    let now = 0;
    const cb = new CircuitBreaker({ failureThreshold: 3, cooldownMs: 1000, now: () => now });
    cb.onFailure();
    cb.onFailure();
    expect(cb.currentState).toBe('closed');
    cb.onFailure();
    expect(cb.currentState).toBe('open');
    expect(cb.canRequest()).toBe(false);
  });

  it('moves to half-open after the cooldown elapses', () => {
    let now = 0;
    const cb = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 1000, now: () => now });
    cb.onFailure();
    expect(cb.canRequest()).toBe(false);
    now = 1000;
    expect(cb.canRequest()).toBe(true);
    expect(cb.currentState).toBe('half-open');
  });

  it('closes after enough half-open successes', () => {
    let now = 0;
    const cb = new CircuitBreaker({
      failureThreshold: 1,
      cooldownMs: 1000,
      successThreshold: 2,
      now: () => now,
    });
    cb.onFailure();
    now = 1000;
    cb.canRequest(); // -> half-open
    cb.onSuccess();
    expect(cb.currentState).toBe('half-open');
    cb.onSuccess();
    expect(cb.currentState).toBe('closed');
  });

  it('re-opens on a half-open failure', () => {
    let now = 0;
    const cb = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 1000, now: () => now });
    cb.onFailure();
    now = 1000;
    cb.canRequest(); // -> half-open
    cb.onFailure();
    expect(cb.currentState).toBe('open');
  });

  it('resets the failure count after a success while closed', () => {
    let now = 0;
    const cb = new CircuitBreaker({ failureThreshold: 3, cooldownMs: 1000, now: () => now });
    cb.onFailure();
    cb.onFailure();
    cb.onSuccess(); // resets streak
    cb.onFailure();
    cb.onFailure();
    expect(cb.currentState).toBe('closed');
  });
});
