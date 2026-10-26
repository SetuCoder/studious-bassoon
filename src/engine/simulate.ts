import { CLEARED_EPSILON, HORIZON_MONTHS } from './constants'
import type { Allocation, EngineDebt } from './types'

export interface MonthRow {
  month: number
  /** debtId -> balance at the end of the month, after payments */
  balances: Record<string, number>
  /** Interest added across all debts this month */
  interest: number
}

export interface SimulationResult {
  totalInterest: number
  /** Budget left over once every debt is cleared. Earns nothing in this version. */
  spare: number
  /** Σ balance left after the horizon */
  remaining: number
  /** debtId -> first month the balance fell to ₹0.50 or less */
  cleared: Record<string, number>
  months: MonthRow[]
}

/**
 * Month by month: interest accrues, each debt gets its scheduled payment, and any payment
 * freed by a cleared debt rolls to the highest-rate debt left. Ported from the prototype.
 *
 * `horizon` is only changed for the M2 plan projection; options always use 36 months.
 */
export function simulate(debts: readonly EngineDebt[], lump: Allocation = {}, horizon = HORIZON_MONTHS): SimulationResult {
  const ds = debts.map((d) => ({
    id: d.id,
    apr: d.apr,
    r: d.apr / 1200,
    pay: d.monthlyPayment,
    bal: Math.max(0, d.balance - (lump[d.id] ?? 0)),
  }))
  // Fixed for the whole run, so payments freed by cleared debts stay in the budget.
  const budget = debts.reduce((s, d) => s + d.monthlyPayment, 0)
  let totalInterest = 0
  let spare = 0
  const cleared: Record<string, number> = {}
  const months: MonthRow[] = []

  for (let m = 1; m <= horizon; m++) {
    let monthInterest = 0
    for (const d of ds) {
      const i = d.bal * d.r
      d.bal += i
      monthInterest += i
    }
    totalInterest += monthInterest

    let avail = budget
    for (const d of ds) {
      const p = Math.min(d.pay, d.bal)
      d.bal -= p
      avail -= p
    }

    const byApr = ds.filter((d) => d.bal > CLEARED_EPSILON).sort((a, b) => b.apr - a.apr)
    for (const d of byApr) {
      if (avail <= 0) break
      const p = Math.min(avail, d.bal)
      d.bal -= p
      avail -= p
    }
    spare += Math.max(0, avail)

    for (const d of ds) {
      if (d.bal <= CLEARED_EPSILON && !(d.id in cleared)) cleared[d.id] = m
    }
    months.push({ month: m, balances: Object.fromEntries(ds.map((d) => [d.id, d.bal])), interest: monthInterest })
  }

  return {
    totalInterest,
    spare,
    remaining: ds.reduce((s, d) => s + Math.max(0, d.bal), 0),
    cleared,
    months,
  }
}
