import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createAppStore, type AppStore } from '../state/store'
import { isDemoData, loadDemo, startDemo } from './sampleBorrower'

let store: AppStore

beforeEach(() => {
  localStorage.clear()
  store = createAppStore()
})

describe('demo data', () => {
  it('loads the six sample debts and the fixture charge check', () => {
    const id = loadDemo(store)
    const s = store.getState()
    expect(s.debts).toHaveLength(6)
    expect(s.profile.takeHomeMonthly).toBe(145000)
    expect(s.chargeChecks).toHaveLength(1)
    expect(s.chargeChecks[0]).toMatchObject({ id, flaggedTotal: 9204, toConfirmTotal: 885 })
    expect(isDemoData(store)).toBe(true)
  })

  it('?demo replaces nothing of the user’s own without their yes', () => {
    store.getState().addDebt({ type: 'credit_card', name: 'My card', balance: 5000, apr: 36, monthlyPayment: 500 })
    const confirm = vi.fn(() => false)
    expect(startDemo(store, '', confirm)).toBe('/')
    expect(confirm).toHaveBeenCalledOnce()
    expect(store.getState().debts.map((d) => d.name)).toEqual(['My card'])
  })

  it('?demo loads after a yes and opens Debts', () => {
    store.getState().addDebt({ type: 'credit_card', name: 'My card', balance: 5000, apr: 36, monthlyPayment: 500 })
    expect(startDemo(store, '', () => true)).toBe('/debts')
    expect(isDemoData(store)).toBe(true)
  })

  it('?demo=charge reuses the loaded demo and opens its check, asking nothing', () => {
    const id = loadDemo(store)
    const confirm = vi.fn(() => true)
    expect(startDemo(store, 'charge', confirm)).toBe(`/charges/${id}`)
    expect(confirm).not.toHaveBeenCalled()
    expect(store.getState().chargeChecks).toHaveLength(1)
  })

  it('?demo=charge on an empty browser loads the demo first', () => {
    const path = startDemo(store, 'charge', () => false)
    expect(path).toBe(`/charges/${store.getState().chargeChecks[0].id}`)
  })
})
