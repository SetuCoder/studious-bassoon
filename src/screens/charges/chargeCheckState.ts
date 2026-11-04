import { RULE_START_DATE } from '../../engine/constants'
import { isLoan } from '../../engine/ledger'
import { draftLenderMessage } from '../../engine/message'
import { checkCharges, consistentSanctionDate } from '../../engine/rules'
import type {
  ChargeCheck, ChargeCheckAnswers, ChargeKind, ChargeLine, EngineDebt, LenderType, Purpose, RateType, YesNoUnknown,
} from '../../engine/types'
import { CHARGE_KIND_LABELS } from '../../lib/chargeLabels'

/** One charge line as typed on the charges step. */
export interface ChargeLineForm {
  key: number
  kind: ChargeKind
  /** For "Other": what the quote calls it. */
  name: string
  /** Digits only */
  amount: string
  disclosed?: YesNoUnknown
}

/** The questionnaire's answers so far. */
export interface ChargeCheckForm {
  debtId?: string
  rateType?: RateType
  sanctionedOnOrAfter2026?: YesNoUnknown
  purpose?: Purpose
  lenderType?: LenderType
  sanctionedAmountUpTo50L?: YesNoUnknown
  lines: ChargeLineForm[]
}

export function newLine(key: number, kind: ChargeKind = 'foreclosure'): ChargeLineForm {
  return { key, kind, name: '', amount: '' }
}

/** Loans only: the RBI rule is about loans, not cards or BNPL. */
export function checkableLoans<T extends EngineDebt>(debts: readonly T[]): T[] {
  return debts.filter((d) => isLoan(d.type) && !d.paidOffOn)
}

/** Pre-fill the loan questions from what the debt's details already say. */
export function prefillFromDebt(form: ChargeCheckForm, debt: EngineDebt): ChargeCheckForm {
  return {
    ...form,
    debtId: debt.id,
    rateType: debt.rateType,
    sanctionedOnOrAfter2026: debt.sanctionedOn ? (debt.sanctionedOn >= RULE_START_DATE ? 'yes' : 'no') : undefined,
    purpose: debt.purpose,
  }
}

export function lineIsComplete(l: ChargeLineForm): boolean {
  return Number(l.amount) > 0 && (l.kind === 'gst' || l.disclosed !== undefined)
}

/** The check's screens: what it is (first check only), which loan (when there's a choice), the loan, the charges. */
export type ChargeStep = 'intro' | 'loan' | 'about' | 'charges'

/** The steps this person sees, in order. */
export function chargeSteps({ firstCheck, loanChosen }: { firstCheck: boolean; loanChosen: boolean }): ChargeStep[] {
  return [...(firstCheck ? ['intro' as const] : []), ...(loanChosen ? [] : ['loan' as const]), 'about', 'charges']
}

/** Whether `step` has its answers, so Next can go on. */
export function stepIsAnswered(form: ChargeCheckForm, step: ChargeStep): boolean {
  switch (step) {
    case 'intro': return true
    case 'loan': return !!form.debtId
    case 'about':
      return !!form.rateType && !!form.sanctionedOnOrAfter2026 && !!form.purpose
        && (form.purpose !== 'business' || (!!form.lenderType && !!form.sanctionedAmountUpTo50L))
    case 'charges': return form.lines.length > 0 && form.lines.every(lineIsComplete)
  }
}

function toLine(l: ChargeLineForm): ChargeLine {
  const label = l.kind === 'other' && l.name.trim() ? l.name.trim() : CHARGE_KIND_LABELS[l.kind]
  return { kind: l.kind, label, amount: Number(l.amount), disclosed: l.kind === 'gst' ? undefined : l.disclosed }
}

/** Run the engine on a finished questionnaire and draft the lender message. */
export function buildChargeCheck(debt: EngineDebt, form: ChargeCheckForm): Omit<ChargeCheck, 'id' | 'createdAt'> {
  const answers: ChargeCheckAnswers = {
    rateType: form.rateType ?? 'unknown',
    sanctionedOnOrAfter2026: form.sanctionedOnOrAfter2026 ?? 'unknown',
    purpose: form.purpose ?? 'unknown',
    ...(form.purpose === 'business'
      ? { lenderType: form.lenderType ?? 'unknown', sanctionedAmountUpTo50L: form.sanctionedAmountUpTo50L ?? 'unknown' }
      : {}),
  }
  const lines = form.lines.map(toLine)
  const sanctionedOn = consistentSanctionDate(answers, debt.sanctionedOn)
  const { results, flaggedTotal, toConfirmTotal } = checkCharges(answers, lines, sanctionedOn)
  const message = draftLenderMessage({ loanName: debt.name, rateType: answers.rateType, sanctionedOn, lines, results })
  return { debtId: debt.id, answers, lines, results, flaggedTotal, toConfirmTotal, message }
}
