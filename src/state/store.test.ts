import { beforeEach, describe, expect, it } from 'vitest'
import { SCHEMA_VERSION, STORAGE_KEY } from './migrations'
import { createAppStore, type DebtInput } from './store'

const card: DebtInput = { type: 'credit_card', balance: 85000, apr: 42, monthlyPayment: 6000 }
const loan: DebtInput = {
  type: 'personal_loan', balance: 210000, apr: 13, monthlyPayment: 8236.53,
  rateType: 'floating', sanctionedOn: '2026-03-14', purpose: 'personal',
}

/** A Storage whose every call throws, like Safari with site data blocked. */
const blockedStorage = (): Storage => {
  throw new DOMException('blocked', 'SecurityError')
}

function makeStore() {
  let n = 0
  return createAppStore({ newId: () => `id${++n}`, now: () => '2026-10-22T10:00:00.000Z' })
}

function stored() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)!)
}

describe('app store', () => {
  beforeEach(() => localStorage.clear())

  it('starts empty with usage counts on', () => {
    const s = makeStore().getState()
    expect(s.debts).toEqual([])
    expect(s.settings.shareUsageCounts).toBe(true)
    expect(s.storageAvailable).toBe(true)
  })

  it('adds debts with ids, timestamps and default names', () => {
    const store = makeStore()
    store.getState().addDebt(card)
    store.getState().addDebt({ ...card, name: '  ' })
    store.getState().addDebt({ ...card, name: 'HDFC Millennia' })
    expect(store.getState().debts.map((d) => [d.id, d.name])).toEqual([
      ['id1', 'Credit card 1'], ['id2', 'Credit card 2'], ['id3', 'HDFC Millennia'],
    ])
    expect(store.getState().debts[0].createdAt).toBe('2026-10-22T10:00:00.000Z')
  })

  it('drops loan-only fields from cards and BNPL', () => {
    const store = makeStore()
    const id = store.getState().addDebt({ ...loan, type: 'bnpl' })
    const d = store.getState().debts.find((x) => x.id === id)!
    expect(d).not.toHaveProperty('rateType')
    expect(d).not.toHaveProperty('sanctionedOn')
    expect(d).not.toHaveProperty('purpose')
  })

  it('updates a debt and keeps its name unless changed', () => {
    const store = makeStore()
    const id = store.getState().addDebt(loan)
    store.getState().updateDebt(id, { balance: 200000 })
    expect(store.getState().debts[0]).toMatchObject({ name: 'Personal loan 1', balance: 200000, rateType: 'floating' })
    store.getState().updateDebt(id, { type: 'credit_card' })
    expect(store.getState().debts[0]).not.toHaveProperty('rateType')
  })

  it('deletes a debt with its charge checks', () => {
    const store = makeStore()
    const keep = store.getState().addDebt(card)
    const gone = store.getState().addDebt(loan)
    store.getState().saveChargeCheck({
      debtId: gone, answers: { rateType: 'floating', sanctionedOnOrAfter2026: 'yes', purpose: 'personal' },
      lines: [], results: [], flaggedTotal: 0, toConfirmTotal: 0, message: '',
    })
    store.getState().deleteDebt(gone)
    expect(store.getState().debts.map((d) => d.id)).toEqual([keep])
    expect(store.getState().chargeChecks).toEqual([])
  })

  it('saves to localStorage under ro:v1 and reloads it', async () => {
    const store = makeStore()
    store.getState().addDebt(card)
    store.getState().setTakeHome(145000)
    store.getState().setLastNextRupee({ amount: 150000, buffer: 30000, assumedReturn: 12 })
    expect(stored().version).toBe(SCHEMA_VERSION)
    expect(stored().state).not.toHaveProperty('storageAvailable')
    expect(stored().state).not.toHaveProperty('addDebt')

    const reloaded = makeStore()
    expect(reloaded.getState().debts).toHaveLength(1)
    expect(reloaded.getState().profile.takeHomeMonthly).toBe(145000)
    expect(reloaded.getState().lastNextRupee?.buffer).toBe(30000)
  })

  it('clears take-home when it is emptied', () => {
    const store = makeStore()
    store.getState().setTakeHome(145000)
    store.getState().setTakeHome(undefined)
    expect(store.getState().profile.takeHomeMonthly).toBeUndefined()
  })

  it('deletes all data: removes the key and resets the store', () => {
    const store = makeStore()
    store.getState().addDebt(card)
    store.getState().setWouldAct('yes')
    store.getState().setShareUsageCounts(false)
    store.getState().setLastNextRupee({ amount: 1, buffer: 0, assumedReturn: 12 })
    store.getState().deleteAllData()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    const s = store.getState()
    expect(s.debts).toEqual([])
    expect(s.feedback).toEqual({})
    expect(s.lastNextRupee).toBeUndefined()
    expect(s.settings.shareUsageCounts).toBe(true)
    expect(makeStore().getState().debts).toEqual([])
  })

  it('keeps working for the session when storage is blocked', () => {
    const store = createAppStore({ getStorage: blockedStorage })
    expect(store.getState().storageAvailable).toBe(false)
    store.getState().addDebt(card)
    expect(store.getState().debts).toHaveLength(1)
    expect(() => store.getState().deleteAllData()).not.toThrow()
  })

  it('flags storage as unavailable when a write fails later (quota full)', () => {
    let full = false
    const quotaStorage = {
      getItem: (k: string) => localStorage.getItem(k),
      setItem: (k: string, v: string) => {
        if (full) throw new DOMException('full', 'QuotaExceededError')
        localStorage.setItem(k, v)
      },
      removeItem: (k: string) => localStorage.removeItem(k),
    } as Storage
    const store = createAppStore({ getStorage: () => quotaStorage })
    expect(store.getState().storageAvailable).toBe(true)
    full = true
    store.getState().addDebt(card)
    expect(store.getState().storageAvailable).toBe(false)
    expect(store.getState().debts).toHaveLength(1)
  })

  it('starts fresh when the stored value is not valid JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    expect(makeStore().getState().debts).toEqual([])
  })

  it('drops stored debts the engine could not use', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: SCHEMA_VERSION,
      state: { debts: [{ id: 'ok', type: 'credit_card', balance: 1, apr: 1, monthlyPayment: 1 }, { id: 'bad', type: 'credit_card', balance: 'lots' }] },
    }))
    const s = makeStore().getState()
    expect(s.debts.map((d) => d.id)).toEqual(['ok'])
    expect(s.checkIns).toEqual([])
    expect(s.settings.shareUsageCounts).toBe(true)
  })
})
