import { describe, expect, it } from 'vitest'
import { projectDebtFree, payoffTime, pmt } from './payoff'
import { debt, SAMPLE_DEBTS } from './testDebts'

describe('pmt', () => {
  it('splits evenly at 0%', () => {
    expect(pmt(12000, 0, 12)).toBe(1000)
  })
})

describe('payoffTime', () => {
  it('rounds up to whole months', () => {
    const t = payoffTime(210000, 13, 8236.53)
    expect(t.never).toBe(false)
    if (!t.never) {
      expect(t.months).toBeCloseTo(30, 3)
      expect(t.wholeMonths).toBe(30)
    }
  })

  it('handles 0%', () => {
    expect(payoffTime(10000, 0, 3000)).toEqual({ never: false, months: 10000 / 3000, wholeMonths: 4 })
  })

  it('never clears when the payment does not cover the interest', () => {
    expect(payoffTime(100000, 42, 3000)).toEqual({ never: true })
    expect(payoffTime(100000, 42, 3500)).toEqual({ never: true }) // exactly the interest
  })

  it('is already clear at zero balance', () => {
    expect(payoffTime(0, 42, 1000)).toEqual({ never: false, months: 0, wholeMonths: 0 })
  })
})

describe('projectDebtFree', () => {
  it('projects the sample borrower: pay-later first, everything in 90 months', () => {
    expect(projectDebtFree(SAMPLE_DEBTS)).toEqual({ months: 90, firstCleared: { debtId: 'bnpl', months: 4 } })
  })

  it('has no debt-free date when a debt never clears, but still says what clears first', () => {
    const p = projectDebtFree([
      debt({ id: 'stuck', balance: 100000, apr: 36, monthlyPayment: 2000 }),
      debt({ id: 'small', balance: 1000, apr: 0, monthlyPayment: 500 }),
    ], 60)
    expect(p.months).toBeUndefined()
    expect(p.firstCleared).toEqual({ debtId: 'small', months: 2 })
  })

  it('ignores paid-off debts and returns nothing for none', () => {
    expect(projectDebtFree([])).toEqual({})
    expect(projectDebtFree([debt({ id: 'done', paidOffOn: '2026-01-01' })])).toEqual({})
  })
})
