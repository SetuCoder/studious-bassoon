import { formatINR } from '../lib/format'
import { CLEARED_EPSILON, SAVINGS_RATE } from './constants'
import { isActive, sortByCost } from './ledger'
import type { NextRupeeOption } from './options'
import type { Allocation, EngineDebt, OptionId } from './types'

// Template sentences built from engine numbers only. No AI-generated numbers.

const OPTION_NAMES: Record<Exclude<OptionId, 'invest'>, string> = {
  apr: 'Highest rate first',
  size: 'Smallest balance first',
  home: 'Prepay the home loan',
  save: 'Keep it in savings',
  split: 'Clear the costliest debts, invest the rest',
}

/** The option's name in the UI. Invest carries the assumed return: "Invest at 12%". */
export function optionName(id: OptionId, assumedReturn: number): string {
  return id === 'invest' ? `Invest at ${assumedReturn}%` : OPTION_NAMES[id]
}

/** Badge for the top-ranked option. */
export function topLabel(option: NextRupeeOption): string {
  return option.kind === 'invest' ? 'Comes out ahead' : 'Saves the most'
}

export const NOTHING_TO_PUT_TO_WORK = 'There is nothing left to put to work after the cash you are keeping aside.'

function isCleared(d: EngineDebt, allocation: Allocation): boolean {
  return (allocation[d.id] ?? 0) > 0 && d.balance - allocation[d.id] <= CLEARED_EPSILON
}

/** Σ monthly payment of the debts this allocation pays off completely. */
export function freedMonthlyPayment(debts: readonly EngineDebt[], allocation: Allocation): number {
  return debts.filter((d) => isCleared(d, allocation)).reduce((s, d) => s + d.monthlyPayment, 0)
}

/** "A", "A and B", "A, B and C" */
export function joinNames(names: readonly string[]): string {
  return names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
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

/** "Clears A, B and part of C", in the order the money was put on them. */
function clearsText(debts: readonly EngineDebt[], allocation: Allocation): string {
  const byId = new Map(debts.map((d) => [d.id, d]))
  const touched = Object.keys(allocation).map((id) => byId.get(id)).filter((d): d is EngineDebt => !!d && allocation[d.id] > 0)
  const cleared = touched.filter((d) => isCleared(d, allocation)).map((d) => d.name)
  const partial = touched.filter((d) => !isCleared(d, allocation)).map((d) => `part of ${d.name}`)
  if (!cleared.length) return `Pays off ${joinNames(partial)}`
  return `Clears ${joinNames([...cleared, ...partial])}`
}

/** The one-line note under each option on the results screen. */
export function optionNote(debts: readonly EngineDebt[], option: NextRupeeOption): string {
  const active = debts.filter(isActive)
  switch (option.kind) {
    case 'invest':
      return 'Return not guaranteed; the debts keep running'
    case 'save':
      return 'The baseline everything is compared with'
    case 'split':
      return `${clearsText(active, option.allocation)}, then invests ${formatINR(option.invested)}`
    case 'debt': {
      if (option.id === 'home') {
        const home = active.find((d) => option.allocation[d.id] > 0)
        const cheapest = sortByCost(active).at(-1)
        if (home && cheapest && home.apr <= cheapest.apr) return 'Your cheapest debt, so each rupee saves the least'
      }
      return clearsText(active, option.allocation)
    }
  }
}

/** "Then the ₹8,500 a month you stop paying on Credit card 1 and Credit card 2 rolls to the next most expensive debt." */
function freedSentence(active: readonly EngineDebt[], allocation: Allocation): string | undefined {
  const freed = freedMonthlyPayment(active, allocation)
  if (freed <= 0) return undefined
  const cleared = active.filter((d) => isCleared(d, allocation))
  const where = cleared.length === active.length
    ? 'is yours to keep, since every debt is cleared.'
    : 'rolls to the next most expensive debt.'
  return `Then the ${formatINR(freed)} a month you stop paying on ${joinNames(cleared.map((d) => d.name))} ${where}`
}

/** The "Why this order" box on the option detail screen, as paragraphs. */
export function explainOption(debts: readonly EngineDebt[], option: NextRupeeOption, L: number, assumedReturn: number): string[] {
  if (L <= 0) return [NOTHING_TO_PUT_TO_WORK]
  const active = debts.filter(isActive)
  const top = sortByCost(active)[0]

  if (option.kind === 'debt') {
    const lead = option.id === 'apr' && top
      ? `${top.name} costs ${top.apr}% a year. No savings account pays anywhere near that, and an investment return is never guaranteed, so the money goes there first.`
      : 'This puts the money where you chose, not where it saves the most interest.'
    const freed = freedSentence(active, option.allocation)
    return freed ? [lead, freed] : [lead]
  }

  if (option.kind === 'split') {
    const freed = freedSentence(active, option.allocation)
    const lead = `The costliest debts are paid off first, since each costs more than the ${assumedReturn}% you assumed. The remaining ${formatINR(option.invested)} is invested at that assumed return. Debts not paid off keep running as scheduled.`
    return freed ? [lead, freed] : [lead]
  }

  if (option.kind === 'invest') {
    const lead = `Investing ${formatINR(L)} at an assumed ${assumedReturn}% would grow it more than savings would`
    if (!top) return [`${lead}. Returns are not guaranteed.`]
    return [`${lead}, but ${top.name} still costs ${top.apr}% a year. ` + (assumedReturn < top.apr
      ? 'That is higher than the return you assumed, so paying it down comes out ahead.'
      : 'Your assumed return is above that rate, so this wins on paper. Returns are not guaranteed and the debt cost is.')]
  }

  return [top
    ? `The money stays safe and earns about ${SAVINGS_RATE}% while ${top.name} keeps charging ${top.apr}%.`
    : `The money stays safe and earns about ${SAVINGS_RATE}%.`]
}
