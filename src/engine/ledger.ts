import type { EngineDebt } from './types'

export function isActive(debt: EngineDebt): boolean {
  return !debt.paidOffOn
}

/** Highest apr first; ties by larger balance first. */
export function compareByCost(a: EngineDebt, b: EngineDebt): number {
  return b.apr - a.apr || b.balance - a.balance
}

export function sortByCost<T extends EngineDebt>(debts: readonly T[]): T[] {
  return [...debts].sort(compareByCost)
}

export interface LedgerSummary<T extends EngineDebt> {
  totalOwed: number
  monthlyPayments: number
  /** Only when take-home is set. 0.48 means 48%. */
  shareOfTakeHome?: number
  interestThisMonth: number
  /** % a year, weighted by balance. 0 when nothing is owed. */
  weightedApr: number
  /** The first one "costs the most". */
  sortedByCost: T[]
}

export function summariseLedger<T extends EngineDebt>(debts: readonly T[], takeHomeMonthly?: number): LedgerSummary<T> {
  const active = debts.filter(isActive)
  const totalOwed = sum(active, (d) => d.balance)
  const monthlyPayments = sum(active, (d) => d.monthlyPayment)
  const weighted = sum(active, (d) => d.balance * d.apr)
  return {
    totalOwed,
    monthlyPayments,
    shareOfTakeHome: takeHomeMonthly && takeHomeMonthly > 0 ? monthlyPayments / takeHomeMonthly : undefined,
    interestThisMonth: weighted / 1200,
    weightedApr: totalOwed > 0 ? weighted / totalOwed : 0,
    sortedByCost: sortByCost(active),
  }
}

function sum<T>(items: readonly T[], pick: (item: T) => number): number {
  return items.reduce((s, item) => s + pick(item), 0)
}
