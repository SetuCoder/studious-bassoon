import { describe, expect, it } from 'vitest'
import { debtMeta, defaultDebtName } from './debtTypes'

describe('debt type helpers', () => {
  it('names debts "{Type} {n}"', () => {
    expect(defaultDebtName('credit_card', 1)).toBe('Credit card 2')
  })

  it('describes each row in plain words, without middle-dot strings', () => {
    expect(debtMeta({ type: 'credit_card', apr: 42 })).toBe('42% a year, card')
    expect(debtMeta({ type: 'bnpl', apr: 30 })).toBe('30% a year, BNPL')
    expect(debtMeta({ type: 'home_loan', apr: 8.75, rateType: 'floating' })).toBe('8.75% a year, floating')
    expect(debtMeta({ type: 'gold_loan', apr: 9, rateType: 'unknown' })).toBe('9% a year, gold loan')
  })
})
