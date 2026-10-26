import { formatINR } from '../lib/format'
import { CLEARED_EPSILON, SAVINGS_RATE } from './constants'
import { isActive, sortByCost } from './ledger'
import type { NextRupeeOption } from './options'
import type { Allocation, EngineDebt, OptionId } from './types'

// Template sentences built from engine numbers only. No AI-generated numbers.

export const OPTION_COPY: Record<OptionId, { name: string; note: string }> = {
  apr: { name: 'Highest rate first', note: 'Pay down the most expensive debt, then the next.' },
  size: { name: 'Smallest balance first', note: 'Clear the small debts to simplify things.' },
  home: { name: 'Prepay the home loan', note: 'Put it all on the biggest, cheapest loan.' },
  invest: { name: 'Invest it', note: 'At the return you assumed, debts keep running.' },
  save: { name: 'Keep it in savings', note: 'The baseline everything else is compared with.' },
  split: { name: 'Clear the costliest debts, invest the rest', note: 'Pays off debts costing more than your assumed return, invests what is left.' },
}

/** Badge for the top-ranked option. */
export function topLabel(option: NextRupeeOption): string {
  return option.kind === 'invest' ? 'Comes out ahead' : 'Saves the most'
}

export const NOTHING_TO_PUT_TO_WORK = 'There is nothing left to put to work after the cash you are keeping aside.'

/** Σ monthly payment of the debts this allocation pays off completely. */
export function freedMonthlyPayment(debts: readonly EngineDebt[], allocation: Allocation): number {
  return debts
    .filter((d) => (allocation[d.id] ?? 0) > 0 && d.balance - allocation[d.id] <= CLEARED_EPSILON)
    .reduce((s, d) => s + d.monthlyPayment, 0)
}

export interface AllocationRow {
  debtId: string
  name: string
  apr: number
  before: number
  after: number
  amount: number
}

/** "Where the ₹L goes": one row per allocated debt, most expensive first. */
export function allocationRows(debts: readonly EngineDebt[], allocation: Allocation): AllocationRow[] {
  return sortByCost(debts)
    .filter((d) => (allocation[d.id] ?? 0) > 0)
    .map((d) => ({
      debtId: d.id,
      name: d.name,
      apr: d.apr,
      before: d.balance,
      after: Math.max(0, d.balance - allocation[d.id]),
      amount: allocation[d.id],
    }))
}

/** The "Why this order" text on the option detail screen. */
export function explainOption(debts: readonly EngineDebt[], option: NextRupeeOption, L: number, assumedReturn: number): string {
  if (L <= 0) return NOTHING_TO_PUT_TO_WORK
  const active = debts.filter(isActive)
  const top = sortByCost(active)[0]
  const parts = allocationRows(active, option.allocation)
    .map((r) => `${formatINR(r.amount)} to ${r.name} (${r.apr}%)`)
    .join(', ')

  if (option.kind === 'debt') {
    const lead = option.id === 'apr' && top
      ? `${top.name} costs ${top.apr}% a year. No savings account pays anywhere near that, and an investment return is never guaranteed, so the money goes there first.`
      : 'This puts the money where you chose, not where it saves the most interest.'
    const freed = freedMonthlyPayment(active, option.allocation)
    const freedText = freed > 0
      ? ` That frees ${formatINR(freed)} a month. Freed-up monthly payments then roll to the next highest-rate debt.`
      : ''
    return `${lead} The split: ${parts}.${freedText}`
  }

  if (option.kind === 'split') {
    return `The costliest debts are paid off first, since each costs more than the ${assumedReturn}% you assumed: ${parts}. The remaining ${formatINR(option.invested)} is invested at that assumed return. Debts not listed keep running as scheduled.`
  }

  if (option.kind === 'invest') {
    const lead = `Investing ${formatINR(L)} at an assumed ${assumedReturn}% would grow it more than savings would`
    if (!top) return `${lead}. Returns are not guaranteed.`
    return `${lead}, but ${top.name} still costs ${top.apr}% a year. ` + (assumedReturn < top.apr
      ? 'That is higher than the return you assumed, so paying it down comes out ahead.'
      : 'Your assumed return is above that rate, so this wins on paper. Returns are not guaranteed and the debt cost is.')
  }

  return top
    ? `The money stays safe and earns about ${SAVINGS_RATE}% while ${top.name} keeps charging ${top.apr}%.`
    : `The money stays safe and earns about ${SAVINGS_RATE}%.`
}
