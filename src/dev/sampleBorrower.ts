import type { AppStore } from '../state/store'

// Development only (loaded from main.tsx behind import.meta.env.DEV, so it never ships).
// Open the dev server with ?sample to replace this browser's data with the sample borrower
// from docs/reference/engine-fixtures.json, e.g. on a phone over Wi-Fi.

export function loadSampleBorrower(store: AppStore): void {
  const s = store.getState()
  s.deleteAllData()
  s.setTakeHome(145000)
  for (const d of [
    { name: 'Home loan', type: 'home_loan', balance: 3800000, apr: 8.75, monthlyPayment: 33581.01, rateType: 'floating', sanctionedOn: '2021-06-10', purpose: 'personal' },
    { name: 'Car loan', type: 'car_loan', balance: 420000, apr: 9.5, monthlyPayment: 13453.84, rateType: 'fixed', sanctionedOn: '2023-04-05', purpose: 'personal' },
    { name: 'Personal loan', type: 'personal_loan', balance: 210000, apr: 13, monthlyPayment: 8236.53, rateType: 'floating', sanctionedOn: '2026-03-14', purpose: 'personal' },
    { name: 'Credit card 1', type: 'credit_card', balance: 85000, apr: 42, monthlyPayment: 6000 },
    { name: 'Credit card 2', type: 'credit_card', balance: 22000, apr: 38, monthlyPayment: 2500 },
    { name: 'Buy now, pay later', type: 'bnpl', balance: 18000, apr: 30, monthlyPayment: 6000 },
  ] as const) {
    s.addDebt(d)
  }
}
