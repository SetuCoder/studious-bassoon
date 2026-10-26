import { describe, expect, it } from 'vitest'
import { payoffTime, pmt } from './payoff'

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
