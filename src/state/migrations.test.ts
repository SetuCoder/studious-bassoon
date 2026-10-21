import { describe, expect, it } from 'vitest'
import { SCHEMA_VERSION, emptyAppData, migrate, normalise } from './migrations'

describe('migrate', () => {
  it('starts fresh when there is no migration path', () => {
    expect(migrate({ debts: [{ id: 'x' }] }, 0)).toEqual(emptyAppData())
  })

  it('starts fresh on data from a newer app version', () => {
    expect(migrate({ debts: [] }, SCHEMA_VERSION + 1)).toEqual(emptyAppData())
  })
})

describe('normalise', () => {
  it('fills in missing parts', () => {
    expect(normalise({})).toEqual(emptyAppData())
    expect(normalise(null)).toEqual(emptyAppData())
    expect(normalise([])).toEqual(emptyAppData())
  })

  it('keeps a valid value as it is', () => {
    const data = {
      ...emptyAppData(),
      profile: { takeHomeMonthly: 145000 },
      debts: [{ id: 'a', name: 'A', type: 'credit_card' as const, balance: 1, apr: 1, monthlyPayment: 1, createdAt: 'x', updatedAt: 'x' }],
      settings: { shareUsageCounts: false },
    }
    expect(normalise(data)).toEqual(data)
  })
})
