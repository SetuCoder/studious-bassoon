import { describe, expect, it } from 'vitest'
import { simulate } from './simulate'
import { SAMPLE_DEBTS, debt } from './testDebts'

describe('simulate', () => {
  it('records a month-by-month table for the full working', () => {
    const s = simulate(SAMPLE_DEBTS)
    expect(s.months).toHaveLength(36)
    expect(s.months[0].month).toBe(1)
    expect(s.months[0].interest).toBeCloseTo(37430, 6)
    expect(s.months.reduce((t, m) => t + m.interest, 0)).toBeCloseTo(s.totalInterest, 6)
    expect(s.months[35].balances.card1).toBeLessThanOrEqual(0.5)
  })

  it('clears a debt paid off by the lump sum in month 1', () => {
    const s = simulate(SAMPLE_DEBTS, { card1: 85000 })
    expect(s.cleared.card1).toBe(1)
  })

  it('rolls freed payments to the highest-rate debt left', () => {
    const debts = [
      debt({ id: 'small', apr: 12, balance: 1000, monthlyPayment: 1000 }),
      debt({ id: 'high', apr: 40, balance: 50000, monthlyPayment: 1000 }),
      debt({ id: 'low', apr: 10, balance: 50000, monthlyPayment: 1000 }),
    ]
    const s = simulate(debts, {}, 2)
    // Month 2: "small" is gone, so its ₹1,000 goes to "high", not "low".
    const high = s.months[1].balances.high
    const highWithoutRoll = (((50000 * (1 + 40 / 1200) - 1000) * (1 + 40 / 1200)) - 1000)
    expect(high).toBeLessThan(highWithoutRoll - 900)
  })

  it('keeps leftover budget as spare once everything is clear', () => {
    const s = simulate([debt({ id: 'a', apr: 0, balance: 1000, monthlyPayment: 1000 })], {}, 3)
    expect(s.remaining).toBe(0)
    expect(s.spare).toBe(2000)
  })

  it('can run past 36 months for the plan projection', () => {
    expect(simulate(SAMPLE_DEBTS, {}, 60).months).toHaveLength(60)
  })
})
