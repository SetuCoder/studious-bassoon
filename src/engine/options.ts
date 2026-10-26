import { HORIZON_MONTHS, SAVINGS_RATE } from './constants'
import { compareByCost, isActive } from './ledger'
import { simulate, type SimulationResult } from './simulate'
import type { Allocation, EngineDebt, NextRupeeInput, OptionId } from './types'

export type OptionKind = 'debt' | 'invest' | 'save' | 'split'

export interface NextRupeeOption {
  id: OptionId
  kind: OptionKind
  /** debtId -> rupees paid off today */
  allocation: Allocation
  /** Rupees put on debts */
  used: number
  /** Rupees invested at the assumed return (invest and split only) */
  invested: number
  /** Rupees better off after 36 months than keeping L in savings */
  delta: number
  /** The run with this allocation (debt and split options) */
  simulation?: SimulationResult
}

export interface NextRupeeResult {
  /** Money to put to work: amount minus the buffer, never below 0 */
  L: number
  base: SimulationResult
  /** Ranked, best first */
  options: NextRupeeOption[]
}

/** "₹L to put to work": the amount minus the buffer, never below 0. The buffer is never used. */
export function amountToPutToWork(input: Pick<NextRupeeInput, 'amount' | 'buffer'>): number {
  return Math.max(0, input.amount - input.buffer)
}

/** Growth of ₹1 over the horizon at rate % a year, compounded monthly. */
export function growthFactor(rate: number, months = HORIZON_MONTHS): number {
  return Math.pow(1 + rate / 1200, months)
}

/** Fill debts in the given order, each up to its balance, until the amount runs out. */
export function allocate(order: readonly EngineDebt[], amount: number): { allocation: Allocation; used: number } {
  const allocation: Allocation = {}
  let left = amount
  for (const d of order) {
    if (left <= 0) break
    const a = Math.min(left, d.balance)
    allocation[d.id] = a
    left -= a
  }
  return { allocation, used: amount - left }
}

/** Debts by apr descending (ties: larger balance first). */
export function orderByApr<T extends EngineDebt>(debts: readonly T[]): T[] {
  return [...debts].sort(compareByCost)
}

/** Debts by balance ascending (ties: higher apr first). */
export function orderBySize<T extends EngineDebt>(debts: readonly T[]): T[] {
  return [...debts].sort((a, b) => a.balance - b.balance || b.apr - a.apr)
}

/** The home loan the "Prepay the home loan" option uses: the largest, if there are several. */
export function homeLoanOf<T extends EngineDebt>(debts: readonly T[]): T | undefined {
  return debts.filter((d) => d.type === 'home_loan').sort((a, b) => b.balance - a.balance)[0]
}

/**
 * Rank what the next rupee could do, by net gain over 36 months against keeping the money
 * in savings. See docs/engine-spec.md section 5.
 */
export function rankOptions(debts: readonly EngineDebt[], input: NextRupeeInput): NextRupeeResult {
  const active = debts.filter(isActive)
  const L = amountToPutToWork(input)
  const ret = input.assumedReturn
  const base = simulate(active, {})
  const savingsGrowth = growthFactor(SAVINGS_RATE)
  const investGain = (rupees: number) => rupees * (growthFactor(ret) - savingsGrowth)

  const debtPart = (allocation: Allocation, used: number) => {
    const s = simulate(active, allocation)
    return { s, delta: base.remaining - s.remaining + (s.spare - base.spare) - used * savingsGrowth }
  }

  const prepay = (id: OptionId, order: readonly EngineDebt[]): NextRupeeOption => {
    const { allocation, used } = allocate(order, L)
    const { s, delta } = debtPart(allocation, used)
    return { id, kind: 'debt', allocation, used, invested: 0, delta, simulation: s }
  }

  const byApr = orderByApr(active)
  const options: NextRupeeOption[] = []
  if (active.length > 0) options.push(prepay('apr', byApr))
  // With one debt, smallest-balance and highest-rate are the same thing; show only one.
  if (active.length > 1) options.push(prepay('size', orderBySize(active)))
  const home = homeLoanOf(active)
  if (home) options.push(prepay('home', [home]))
  options.push(
    { id: 'invest', kind: 'invest', allocation: {}, used: 0, invested: L, delta: investGain(L) },
    { id: 'save', kind: 'save', allocation: {}, used: 0, invested: 0, delta: 0 },
  )

  // Split: clear the debts costing more than the assumed return, invest the rest.
  const above = byApr.filter((d) => d.apr > ret)
  let split: NextRupeeOption | undefined
  for (let k = 1; k <= above.length; k++) {
    const { allocation, used } = allocate(above.slice(0, k), L)
    if (used <= 0 || used >= L - 0.5) continue
    const { s, delta: debtDelta } = debtPart(allocation, used)
    const invested = L - used
    const delta = debtDelta + investGain(invested)
    if (!split || delta > split.delta) {
      split = { id: 'split', kind: 'split', allocation, used, invested, delta, simulation: s }
    }
  }
  const bestDebtDelta = Math.max(...options.filter((o) => o.kind === 'debt').map((o) => o.delta))
  // Shown only when it clearly beats paying debts alone. The `> 0` guard is deliberate (engine-spec §6).
  if (split && bestDebtDelta > 0 && split.delta > 1.05 * bestDebtDelta) options.push(split)

  options.sort((a, b) => b.delta - a.delta) // stable
  return { L, base, options }
}
