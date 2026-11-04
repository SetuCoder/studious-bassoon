import { describe, expect, it } from 'vitest'
import { SCHEMA_VERSION, emptyAppData, migrate, normalise } from './migrations'

describe('migrate', () => {
  it('starts fresh when there is no migration path', () => {
    expect(migrate({ debts: [{ id: 'x' }] }, 0)).toEqual(emptyAppData())
  })

  it('upgrades version 1 data, keeping everything and starting with no guides seen', () => {
    const v1 = {
      schemaVersion: 1,
      profile: { takeHomeMonthly: 145000 },
      debts: [{ id: 'a', name: 'A', type: 'credit_card', balance: 1, apr: 1, monthlyPayment: 1, createdAt: 'x', updatedAt: 'x' }],
      checkIns: [],
      chargeChecks: [],
      feedback: { wouldAct: 'yes' },
      settings: { shareUsageCounts: false },
    }
    const out = migrate(v1, 1)
    expect(out.schemaVersion).toBe(3)
    expect(out.debts).toHaveLength(1)
    expect(out.feedback).toEqual({ wouldAct: 'yes' })
    expect(out.settings).toEqual({ shareUsageCounts: false, toursSeen: [], haptics: true, calmMotion: false })
  })

  it('upgrades version 2 data, keeping the guides seen and adding the preferences at their defaults', () => {
    const out = migrate({ debts: [], settings: { shareUsageCounts: true, toursSeen: ['overview'] } }, 2)
    expect(out.settings).toEqual({ shareUsageCounts: true, toursSeen: ['overview'], haptics: true, calmMotion: false })
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
      settings: { shareUsageCounts: false, toursSeen: ['overview' as const], haptics: false, calmMotion: true },
    }
    expect(normalise(data)).toEqual(data)
  })

  it('drops unknown guide ids', () => {
    expect(normalise({ settings: { shareUsageCounts: true, toursSeen: ['overview', 'nope', 3] } }).settings.toursSeen).toEqual(['overview'])
  })
})
