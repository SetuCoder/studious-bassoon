import { describe, expect, it } from 'vitest'
import { rankOptions } from './options'
import { SAMPLE_DEBTS, debt } from './testDebts'

const input = { amount: 150000, buffer: 30000, assumedReturn: 12 }

describe('rankOptions', () => {
  it('shows only one of highest-rate and smallest-balance when there is one debt', () => {
    const r = rankOptions([debt({ id: 'card' })], input)
    expect(r.options.map((o) => o.id)).not.toContain('size')
    expect(r.options.map((o) => o.id)).toContain('apr')
  })

  it('has no home option without a home loan', () => {
    const r = rankOptions(SAMPLE_DEBTS.filter((d) => d.type !== 'home_loan'), input)
    expect(r.options.map((o) => o.id)).not.toContain('home')
  })

  it('prepays the largest home loan when there are several', () => {
    const r = rankOptions([...SAMPLE_DEBTS, debt({ id: 'home2', type: 'home_loan', apr: 9, balance: 500000, monthlyPayment: 5000 })], input)
    expect(Object.keys(r.options.find((o) => o.id === 'home')!.allocation)).toEqual(['home'])
  })

  it('ignores paid-off debts', () => {
    const withPaidOff = [...SAMPLE_DEBTS, debt({ id: 'old', apr: 60, balance: 50000, paidOffOn: '2026-01-01' })]
    expect(rankOptions(withPaidOff, input).options.find((o) => o.id === 'apr')!.allocation.old).toBeUndefined()
  })

  it('never spends the buffer', () => {
    for (const o of rankOptions(SAMPLE_DEBTS, input).options) {
      expect(o.used + (o.kind === 'split' ? o.invested : 0)).toBeLessThanOrEqual(120000 + 0.5)
    }
  })

  it('does not show split when the best debt option loses money', () => {
    // A cheap debt and a high assumed return: paying debt is worse than savings,
    // so a "beats it by 5%" comparison would be meaningless.
    const r = rankOptions([debt({ id: 'a', apr: 4, balance: 50000, monthlyPayment: 2000 }), debt({ id: 'b', apr: 3.5, balance: 50000, monthlyPayment: 2000 })], { amount: 200000, buffer: 0, assumedReturn: 3.8 })
    const best = Math.max(...r.options.filter((o) => o.kind === 'debt').map((o) => o.delta))
    expect(best).toBeLessThanOrEqual(0)
    expect(r.options.map((o) => o.id)).not.toContain('split')
  })

  it('offers only invest and save with no debts', () => {
    expect(rankOptions([], input).options.map((o) => o.id)).toEqual(['invest', 'save'])
  })
})
