import { isLoan } from '../../engine/ledger'
import type { Debt, DebtType, Purpose, RateType } from '../../engine/types'
import { DEBT_TYPES } from '../../lib/debtTypes'
import type { DebtInput } from '../../state/store'
import { isValid, validateDebt, type DebtFormValues } from '../../state/validation'

export interface DebtFormState {
  type: DebtType
  name: string
  /** Digits only */
  balance: string
  apr: string
  /** Digits only */
  monthlyPayment: string
  rateType?: RateType
  sanctionedOn: string
  purpose?: Purpose
  // Optional details, digits only except the lender's name.
  lender: string
  originalAmount: string
  monthsLeft: string
  creditLimit: string
  dueDay: string
}

/** Home and education loans are always for personal use, so the form doesn't ask. */
export function asksPurpose(type: DebtType): boolean {
  return isLoan(type) && type !== 'home_loan' && type !== 'education_loan'
}

export function emptyForm(): DebtFormState {
  return {
    type: DEBT_TYPES[0], name: '', balance: '', apr: '', monthlyPayment: '', sanctionedOn: '',
    lender: '', originalAmount: '', monthsLeft: '', creditLimit: '', dueDay: '',
  }
}

export function formFromDebt(d: Debt): DebtFormState {
  const text = (n?: number) => (n === undefined ? '' : String(Math.round(n)))
  return {
    type: d.type,
    name: d.name,
    balance: text(d.balance),
    apr: String(d.apr),
    monthlyPayment: text(d.monthlyPayment),
    rateType: d.rateType,
    sanctionedOn: d.sanctionedOn ?? '',
    purpose: d.purpose,
    lender: d.lender ?? '',
    originalAmount: text(d.originalAmount),
    monthsLeft: text(d.monthsLeft),
    creditLimit: text(d.creditLimit),
    dueDay: text(d.dueDay),
  }
}

/** The numbers and date the validation rules look at, for the fields this type of debt has. */
export function formValues(f: DebtFormState): DebtFormValues {
  const loan = isLoan(f.type)
  const card = f.type === 'credit_card'
  return {
    balance: num(f.balance),
    apr: num(f.apr),
    monthlyPayment: num(f.monthlyPayment),
    sanctionedOn: loan ? f.sanctionedOn || undefined : undefined,
    originalAmount: loan ? num(f.originalAmount) : undefined,
    monthsLeft: card ? undefined : num(f.monthsLeft),
    creditLimit: card ? num(f.creditLimit) : undefined,
    dueDay: card ? num(f.dueDay) : undefined,
  }
}

/** The form as a DebtInput, or undefined while a required number is missing or something is invalid. */
export function formToInput(f: DebtFormState): DebtInput | undefined {
  const v = formValues(f)
  if (!isValid(validateDebt(v))) return undefined
  const loan = isLoan(f.type)
  return {
    type: f.type,
    name: f.name,
    balance: v.balance!,
    apr: v.apr!,
    monthlyPayment: v.monthlyPayment!,
    rateType: loan ? f.rateType : undefined,
    sanctionedOn: v.sanctionedOn,
    purpose: !loan ? undefined : asksPurpose(f.type) ? f.purpose : 'personal',
    lender: f.type === 'credit_card' ? undefined : f.lender.trim() || undefined,
    originalAmount: v.originalAmount,
    monthsLeft: v.monthsLeft,
    creditLimit: v.creditLimit,
    dueDay: v.dueDay,
  }
}

export function num(s: string): number | undefined {
  return s === '' || s === '.' ? undefined : Number(s)
}
