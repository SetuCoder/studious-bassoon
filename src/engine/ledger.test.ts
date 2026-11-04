import { describe, expect, it } from 'vitest'
import { cardUsage, isLoan, monthlyInterest, repaidShare, summariseLedger } from './ledger'
import { debt, SAMPLE_DEBTS } from './testDebts'

describe('isLoan', () => {
  it('treats cards and BNPL as not loans', () => {
    expect(isLoan('credit_card')).toBe(false)
    expect(isLoan('bnpl')).toBe(false)
    expect(isLoan('personal_loan')).toBe(true)
    expect(isLoan('other')).toBe(true)
  })
})

describe('summariseLedger', () => {
  it('leaves out paid-off debts', () => {
    const l = summariseLedger([debt({ id: 'a', balance: 1000 }), debt({ id: 'b', balance: 5000, paidOffOn: '2026-10-01' })])
    expect(l.totalOwed).toBe(1000)
    expect(l.sortedByCost.map((d) => d.id)).toEqual(['a'])
  })

  it('has no share of take-home when take-home is not set', () => {
    expect(summariseLedger([debt({ id: 'a' })]).shareOfTakeHome).toBeUndefined()
    expect(summariseLedger([debt({ id: 'a' })], 0).shareOfTakeHome).toBeUndefined()
  })

  it('breaks rate ties by larger balance first', () => {
    const l = summariseLedger([debt({ id: 'small', apr: 36, balance: 1000 }), debt({ id: 'big', apr: 36, balance: 9000 })])
    expect(l.sortedByCost.map((d) => d.id)).toEqual(['big', 'small'])
  })

  it('returns zeros for an empty ledger', () => {
    const l = summariseLedger([])
    expect(l).toMatchObject({ totalOwed: 0, monthlyPayments: 0, interestThisMonth: 0, weightedApr: 0, sortedByCost: [] })
  })
})

describe('interestShareOfPayments', () => {
  it('is the share of this month’s payments that only covers interest, capped at all of it', () => {
    expect(summariseLedger(SAMPLE_DEBTS).interestShareOfPayments).toBeCloseTo(0.5365, 4)
    expect(summariseLedger([debt({ id: 'a', balance: 100000, apr: 36, monthlyPayment: 1000 })]).interestShareOfPayments).toBe(1)
    expect(summariseLedger([]).interestShareOfPayments).toBe(0)
  })

  it('splits the payments: what pays down the balances is what the interest leaves, never negative', () => {
    const s = summariseLedger(SAMPLE_DEBTS)
    expect(s.principalThisMonth + s.interestThisMonth).toBeCloseTo(s.monthlyPayments, 6)
    expect(summariseLedger([debt({ id: 'a', balance: 100000, apr: 36, monthlyPayment: 1000 })]).principalThisMonth).toBe(0)
  })
})

describe('per-debt figures', () => {
  it('works out card usage only when there is a limit', () => {
    expect(cardUsage({ balance: 85000, creditLimit: 150000 })).toBeCloseTo(0.5667, 4)
    expect(cardUsage({ balance: 85000 })).toBeUndefined()
    expect(cardUsage({ balance: 85000, creditLimit: 0 })).toBeUndefined()
  })

  it('works out the share repaid, kept between 0 and 1', () => {
    expect(repaidShare({ balance: 210000, originalAmount: 300000 })).toBeCloseTo(0.3, 6)
    expect(repaidShare({ balance: 320000, originalAmount: 300000 })).toBe(0)
    expect(repaidShare({ balance: 210000 })).toBeUndefined()
  })

  it('gives one debt\'s interest this month', () => {
    expect(monthlyInterest({ balance: 85000, apr: 42 })).toBeCloseTo(2975, 6)
  })
})
