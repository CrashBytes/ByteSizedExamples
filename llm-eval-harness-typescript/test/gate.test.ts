import { describe, it, expect } from 'vitest'
import { gate } from '../src/gate.js'
import type { RunReport } from '../src/types.js'

const report = (passRate: number, meanScore: number): RunReport => ({
  total: 10,
  passed: Math.round(passRate * 10),
  failed: 10 - Math.round(passRate * 10),
  passRate,
  meanScore,
  byScorer: {},
  results: [],
})

describe('gate', () => {
  it('passes when all thresholds are met', () => {
    const result = gate(report(0.9, 0.85), { minPassRate: 0.8, minMeanScore: 0.8 })
    expect(result.ok).toBe(true)
    expect(result.reasons).toHaveLength(0)
  })

  it('fails and explains every unmet threshold', () => {
    const result = gate(report(0.5, 0.4), { minPassRate: 0.8, minMeanScore: 0.8 })
    expect(result.ok).toBe(false)
    expect(result.reasons).toHaveLength(2)
  })

  it('detects a regression against a baseline', () => {
    const baseline = report(0.9, 0.9)
    const result = gate(report(0.9, 0.8), { baseline, maxRegression: 0.05 })
    expect(result.ok).toBe(false)
    expect(result.reasons[0]).toContain('regressed')
  })

  it('allows a drop within the regression tolerance', () => {
    const baseline = report(0.9, 0.9)
    const result = gate(report(0.9, 0.88), { baseline, maxRegression: 0.05 })
    expect(result.ok).toBe(true)
  })
})
