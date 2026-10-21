import type { DebtType } from '../engine/types'

/** Chip order on "Add a debt"; the first is the default. */
export const DEBT_TYPES: readonly DebtType[] = [
  'credit_card', 'personal_loan', 'home_loan', 'car_loan', 'education_loan', 'bnpl', 'gold_loan', 'other',
]

export const DEBT_TYPE_LABELS: Record<DebtType, string> = {
  credit_card: 'Credit card',
  personal_loan: 'Personal loan',
  home_loan: 'Home loan',
  car_loan: 'Car loan',
  education_loan: 'Education loan',
  bnpl: 'BNPL',
  gold_loan: 'Gold loan',
  other: 'Other',
}

/** "{Type} {n}", e.g. "Credit card 2" when one card already exists. */
export function defaultDebtName(type: DebtType, existingOfType: number): string {
  return `${DEBT_TYPE_LABELS[type]} ${existingOfType + 1}`
}
