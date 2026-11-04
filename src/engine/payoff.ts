import { isActive } from './ledger'
import { simulate } from './simulate'
import type { EngineDebt } from './types'

/**
 * EMI for principal P at apr % a year over n months. Used to build fixtures and as a
 * suggestion only; in the app the user enters their own monthly payment.
 */
export function pmt(principal: number, apr: number, months: number): number {
  const r = apr / 1200
  return r === 0 ? principal / months : (principal * r) / (1 - Math.pow(1 + r, -months))
}

export type PayoffTime =
  | { never: false; months: number; wholeMonths: number }
  | { never: true }

/**
 * Months to clear one debt at a fixed monthly payment, ignoring the other debts.
 * `never` when the payment doesn't cover the monthly interest, so the balance grows.
 * `wholeMonths` is rounded up for display ("about 20 months").
 */
export function payoffTime(balance: number, apr: number, monthlyPayment: number): PayoffTime {
  if (balance <= 0) return { never: false, months: 0, wholeMonths: 0 }
  if (monthlyPayment <= 0) return { never: true }
  const r = apr / 1200
  if (r === 0) return done(balance / monthlyPayment)
  if (monthlyPayment <= r * balance) return { never: true }
  return done(-Math.log(1 - (r * balance) / monthlyPayment) / Math.log(1 + r))
}

function done(months: number): PayoffTime {
  // The small tolerance stops float noise (12.0000000001) rounding up a whole extra month.
  return { never: false, months, wholeMonths: Math.ceil(months - 1e-9) }
}

export interface DebtFreeProjection {
  /** Months until every debt is cleared; undefined when some never clear within the limit. */
  months?: number
  /** The debt that clears soonest, and when. Undefined when none clear within the limit. */
  firstCleared?: { debtId: string; months: number }
}

/** Longest projection on Home: 50 years. Past that, "never" is the honest answer. */
export const PROJECTION_LIMIT_MONTHS = 600

/**
 * When the debts clear at today's payments. Same month-by-month run as the options
 * (simulate): the total paid each month stays the same, and a payment freed by a cleared
 * debt goes to the costliest debt left.
 */
export function projectDebtFree(debts: readonly EngineDebt[], limit = PROJECTION_LIMIT_MONTHS): DebtFreeProjection {
  const active = debts.filter(isActive)
  if (active.length === 0) return {}
  const { cleared } = simulate(active, {}, limit)
  const entries = Object.entries(cleared).sort((a, b) => a[1] - b[1])
  return {
    months: entries.length === active.length ? entries[entries.length - 1][1] : undefined,
    firstCleared: entries.length > 0 ? { debtId: entries[0][0], months: entries[0][1] } : undefined,
  }
}
