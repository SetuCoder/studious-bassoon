import { describe, expect, it } from 'vitest'
import { isLoan, summariseLedger } from './ledger'
import { debt } from './testDebts'

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
