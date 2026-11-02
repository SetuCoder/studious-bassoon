import { buildChargeCheck, newLine, prefillFromDebt } from '../screens/charges/chargeCheckState'
import type { AppStore } from '../state/store'

// The sample borrower from docs/reference/engine-fixtures.json, for demos and phone testing.
// main.tsx loads it from ?sample (dev server only) or ?demo (any build; see startDemo).

const SAMPLE_DEBTS = [
  { name: 'Home loan', type: 'home_loan', balance: 3800000, apr: 8.75, monthlyPayment: 33581.01, rateType: 'floating', sanctionedOn: '2021-06-10', purpose: 'personal' },
  { name: 'Car loan', type: 'car_loan', balance: 420000, apr: 9.5, monthlyPayment: 13453.84, rateType: 'fixed', sanctionedOn: '2023-04-05', purpose: 'personal' },
  { name: 'Personal loan', type: 'personal_loan', balance: 210000, apr: 13, monthlyPayment: 8236.53, rateType: 'floating', sanctionedOn: '2026-03-14', purpose: 'personal' },
  { name: 'Credit card 1', type: 'credit_card', balance: 85000, apr: 42, monthlyPayment: 6000 },
  { name: 'Credit card 2', type: 'credit_card', balance: 22000, apr: 38, monthlyPayment: 2500 },
  { name: 'Buy now, pay later', type: 'bnpl', balance: 18000, apr: 30, monthlyPayment: 6000 },
] as const

/** Replaces this browser's data with the sample borrower. */
export function loadSampleBorrower(store: AppStore): void {
  const s = store.getState()
  s.deleteAllData()
  s.setTakeHome(145000)
  for (const d of SAMPLE_DEBTS) s.addDebt(d)
}

/** The sample borrower plus a saved check of the fixture's personal-loan closing quote. Returns the check's id. */
export function loadDemo(store: AppStore): string {
  loadSampleBorrower(store)
  const s = store.getState()
  const loan = s.debts.find((d) => d.type === 'personal_loan')!
  const form = prefillFromDebt({ lines: [] }, loan)
  form.lines = [
    { ...newLine(1, 'foreclosure'), amount: '6300', disclosed: 'yes' },
    { ...newLine(2, 'prepayment_fee'), amount: '1500', disclosed: 'yes' },
    { ...newLine(3, 'admin'), amount: '750', disclosed: 'no' },
    { ...newLine(4, 'gst'), amount: '1539' },
  ]
  return s.saveChargeCheck(buildChargeCheck(loan, form))
}

/** True when this browser holds exactly the sample borrower's debts. */
export function isDemoData(store: AppStore): boolean {
  const names = store.getState().debts.map((d) => d.name)
  return names.length === SAMPLE_DEBTS.length && SAMPLE_DEBTS.every((d, i) => names[i] === d.name)
}

/**
 * Where ?demo lands. `?demo` reloads the demo and opens Debts; `?demo=charge` opens the demo's
 * saved charge check, loading the demo first only if this browser doesn't hold it yet. Someone's
 * own debts are replaced only after `confirm` says yes; otherwise nothing changes.
 */
export function startDemo(store: AppStore, mode: string, confirm: (message: string) => boolean): string {
  const checkId = store.getState().chargeChecks.at(-1)?.id
  if (mode === 'charge' && isDemoData(store) && checkId) return `/charges/${checkId}`
  const ownData = store.getState().debts.length > 0 && !isDemoData(store)
  if (ownData && !confirm('Replace the debts on this phone with the demo borrower? Your own data will be deleted.')) return '/'
  const id = loadDemo(store)
  return mode === 'charge' ? `/charges/${id}` : '/debts'
}
