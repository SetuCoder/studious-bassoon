import { isLoan } from '../../engine/ledger'
import type { Debt, DebtType, Purpose, RateType } from '../../engine/types'
import { DEBT_TYPES } from '../../lib/debtTypes'
import type { DebtInput } from '../../state/store'
import { isValid, validateDebt } from '../../state/validation'

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
}

export function emptyForm(): DebtFormState {
  return { type: DEBT_TYPES[0], name: '', balance: '', apr: '', monthlyPayment: '', sanctionedOn: '' }
}

export function formFromDebt(d: Debt): DebtFormState {
  return {
    type: d.type,
    name: d.name,
    balance: String(Math.round(d.balance)),
    apr: String(d.apr),
    monthlyPayment: String(Math.round(d.monthlyPayment)),
    rateType: d.rateType,
    sanctionedOn: d.sanctionedOn ?? '',
    purpose: d.purpose,
  }
}

/** The form as a DebtInput, or undefined while a required number is missing or invalid. */
export function formToInput(f: DebtFormState): DebtInput | undefined {
  const values = { balance: num(f.balance), apr: num(f.apr), monthlyPayment: num(f.monthlyPayment) }
  if (!isValid(validateDebt({ ...values, sanctionedOn: f.sanctionedOn || undefined }))) return undefined
  const loan = isLoan(f.type)
  return {
    type: f.type,
    name: f.name,
    balance: values.balance!,
    apr: values.apr!,
    monthlyPayment: values.monthlyPayment!,
    rateType: loan ? f.rateType : undefined,
    sanctionedOn: loan && f.sanctionedOn ? f.sanctionedOn : undefined,
    purpose: loan ? f.purpose : undefined,
  }
}

export function num(s: string): number | undefined {
  return s === '' || s === '.' ? undefined : Number(s)
}
