import { useStore } from 'zustand'
import { persist } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'
import { isLoan } from '../engine/ledger'
import type { AppData, ChargeCheck, Debt, NextRupeeInput } from '../engine/types'
import { defaultDebtName } from '../lib/debtTypes'
import { SCHEMA_VERSION, STORAGE_KEY, emptyAppData, migrate, normalise } from './migrations'
import { createSafeStorage } from './storage'

/** What the add-a-debt and edit forms hand over. Name is optional; it defaults from the type. */
export type DebtInput = Pick<Debt, 'type' | 'balance' | 'apr' | 'monthlyPayment'> &
  Partial<Pick<Debt, 'name' | 'rateType' | 'sanctionedOn' | 'purpose'>>

export interface AppActions {
  setTakeHome: (rupees: number | undefined) => void
  /** Returns the new debt's id. */
  addDebt: (input: DebtInput) => string
  updateDebt: (id: string, patch: Partial<DebtInput>) => void
  /** Also removes the debt's charge checks, so nothing points at a debt that no longer exists. */
  deleteDebt: (id: string) => void
  markPaidOff: (id: string, onDate: string) => void
  setLastNextRupee: (input: NextRupeeInput) => void
  /** Returns the saved check's id. */
  saveChargeCheck: (check: Omit<ChargeCheck, 'id' | 'createdAt'>) => string
  setWouldAct: (answer: NonNullable<AppData['feedback']['wouldAct']>) => void
  setRecommend: (answer: NonNullable<AppData['feedback']['recommend']>) => void
  setShareUsageCounts: (on: boolean) => void
  /** "Get started" on Welcome. Session only: Welcome shows again on the next visit until a debt is saved. */
  startOnboarding: () => void
  /** "Delete all my data": removes the storage key and resets everything. */
  deleteAllData: () => void
}

export interface AppState extends AppData, AppActions {
  /** False when the browser won't save data; show "Your data won't be saved on this device." */
  storageAvailable: boolean
  /** Not saved; see startOnboarding. */
  onboardingStarted: boolean
}

export interface StoreDeps {
  getStorage: () => Storage
  newId: () => string
  /** ISO timestamp */
  now: () => string
}

/**
 * A random v4 UUID. crypto.randomUUID only exists on secure origins (https, localhost), so a
 * phone opening the dev server at http://<laptop-ip> needs the getRandomValues fallback.
 */
export function newUuid(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

const defaultDeps: StoreDeps = {
  getStorage: () => window.localStorage,
  newId: newUuid,
  now: () => new Date().toISOString(),
}

function pickData(s: AppState): AppData {
  return {
    schemaVersion: s.schemaVersion,
    profile: s.profile,
    debts: s.debts,
    lastNextRupee: s.lastNextRupee,
    plan: s.plan,
    checkIns: s.checkIns,
    chargeChecks: s.chargeChecks,
    feedback: s.feedback,
    settings: s.settings,
  }
}

/** Cards and BNPL keep no loan-only fields; a blank name falls back to "{Type} {n}". */
function tidyDebt(debt: Debt, others: readonly Debt[]): Debt {
  const tidy: Debt = { ...debt, name: debt.name?.trim() ?? '' }
  if (!isLoan(tidy.type)) {
    delete tidy.rateType
    delete tidy.sanctionedOn
    delete tidy.purpose
  }
  if (!tidy.name) tidy.name = defaultDebtName(tidy.type, others.filter((d) => d.type === tidy.type).length)
  return tidy
}

export function createAppStore(deps: Partial<StoreDeps> = {}) {
  const { getStorage, newId, now } = { ...defaultDeps, ...deps }
  // Storage can fail while the store is still hydrating, before `store` is assigned,
  // so the flag is also synced once after creation.
  let store: ReturnType<typeof build> | undefined
  const storage = createSafeStorage<AppData>(getStorage, () => store?.setState({ storageAvailable: false }))

  const build = () => createStore<AppState>()(
    persist(
      (set) => ({
        ...emptyAppData(),
        storageAvailable: storage.available,
        onboardingStarted: false,

        setTakeHome: (rupees) =>
          set((s) => ({ profile: { ...s.profile, takeHomeMonthly: rupees && rupees > 0 ? rupees : undefined } })),

        addDebt: (input) => {
          const id = newId()
          const at = now()
          set((s) => ({ debts: [...s.debts, tidyDebt({ ...input, name: input.name ?? '', id, createdAt: at, updatedAt: at }, s.debts)] }))
          return id
        },

        updateDebt: (id, patch) =>
          set((s) => ({
            debts: s.debts.map((d) =>
              d.id === id ? tidyDebt({ ...d, ...patch, updatedAt: now() }, s.debts.filter((o) => o.id !== id)) : d),
          })),

        deleteDebt: (id) =>
          set((s) => ({
            debts: s.debts.filter((d) => d.id !== id),
            chargeChecks: s.chargeChecks.filter((c) => c.debtId !== id),
          })),

        markPaidOff: (id, onDate) =>
          set((s) => ({ debts: s.debts.map((d) => (d.id === id ? { ...d, paidOffOn: onDate, updatedAt: now() } : d)) })),

        setLastNextRupee: (input) => set({ lastNextRupee: input }),

        saveChargeCheck: (check) => {
          const id = newId()
          set((s) => ({ chargeChecks: [...s.chargeChecks, { ...check, id, createdAt: now() }] }))
          return id
        },

        setWouldAct: (answer) => set((s) => ({ feedback: { ...s.feedback, wouldAct: answer } })),
        setRecommend: (answer) => set((s) => ({ feedback: { ...s.feedback, recommend: answer } })),
        setShareUsageCounts: (on) => set({ settings: { shareUsageCounts: on } }),
        startOnboarding: () => set({ onboardingStarted: true }),

        deleteAllData: () => {
          set({ ...emptyAppData(), lastNextRupee: undefined, plan: undefined, onboardingStarted: false })
          // After the reset, which itself writes, so the key is really gone.
          storage.removeItem(STORAGE_KEY)
        },
      }),
      {
        name: STORAGE_KEY,
        version: SCHEMA_VERSION,
        storage,
        partialize: pickData,
        migrate,
        merge: (persisted, current) => ({ ...current, ...normalise(persisted) }),
      },
    ),
  )

  const created = build()
  store = created
  if (!storage.available) created.setState({ storageAvailable: false })
  return created
}

export type AppStore = ReturnType<typeof createAppStore>

/** The app's single store. Components read it through `useAppStore`. */
export const appStore = createAppStore()

export function useAppStore<T>(selector: (state: AppState) => T): T {
  return useStore(appStore, selector)
}
