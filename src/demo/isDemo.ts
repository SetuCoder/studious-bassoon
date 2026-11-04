import type { Debt } from '../engine/types'

// Kept apart from sampleBorrower.ts so the app can recognise the demo without loading it.

/** The demo borrower's debt names, in the order they're added. */
export const DEMO_DEBT_NAMES = ['Home loan', 'Car loan', 'Personal loan', 'HDFC Infinia', 'Axis Magnus', 'Buy now, pay later'] as const

/** True when these are exactly the demo borrower's debts. */
export function isDemoDebts(debts: readonly Pick<Debt, 'name'>[]): boolean {
  return debts.length === DEMO_DEBT_NAMES.length && DEMO_DEBT_NAMES.every((name, i) => debts[i].name === name)
}
