import { payoffTime } from '../engine/payoff'

// Rules from docs/data-model.md "Validation". Errors block saving; the warning does not.

export interface DebtFormValues {
  balance?: number
  apr?: number
  monthlyPayment?: number
  sanctionedOn?: string
}

export type DebtFormField = 'balance' | 'apr' | 'monthlyPayment' | 'sanctionedOn'

export interface DebtValidation {
  errors: Partial<Record<DebtFormField, string>>
  /** Shown but allowed: the payment doesn't cover the monthly interest. */
  warning?: string
}

export const PAYMENT_BELOW_INTEREST = "This payment doesn't cover the monthly interest, so the balance grows."

export function validateDebt(v: DebtFormValues, today: string = localToday()): DebtValidation {
  const errors: DebtValidation['errors'] = {}
  if (!isNum(v.balance) || v.balance <= 0) errors.balance = 'Enter how much you owe'
  if (!isNum(v.apr) || v.apr < 0 || v.apr > 60) errors.apr = 'Enter the yearly rate, for example 13 or 42'
  if (!isNum(v.monthlyPayment) || v.monthlyPayment <= 0) errors.monthlyPayment = 'Enter what you pay each month'
  if (v.sanctionedOn && v.sanctionedOn > today) errors.sanctionedOn = 'That date is in the future'

  const result: DebtValidation = { errors }
  if (!errors.balance && !errors.apr && !errors.monthlyPayment
    && payoffTime(v.balance!, v.apr!, v.monthlyPayment!).never) {
    result.warning = PAYMENT_BELOW_INTEREST
  }
  return result
}

export function isValid(v: DebtValidation): boolean {
  return Object.keys(v.errors).length === 0
}

/** Today as 'YYYY-MM-DD' in the phone's own time zone. */
export function localToday(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function isNum(n: number | undefined): n is number {
  return typeof n === 'number' && Number.isFinite(n)
}
