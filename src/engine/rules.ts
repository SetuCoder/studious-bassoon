import { formatDate } from '../lib/format'
import { GST_RATE, RULE_START_DATE } from './constants'
import type {
  ChargeCheckAnswers, ChargeLine, ChargeLineResult, ChargeStatus, EngineDebt, LenderType, YesNoUnknown,
} from './types'

// The RBI (Pre-payment Charges on Loans) Directions, 2025, as a decision table. See docs/rules.md.

export type Coverage = 'covered' | 'not_covered' | 'unknown'

/** Why the loan is or isn't covered; picks the reason text. */
export type CoverageBasis =
  | 'personal' | 'business'                                   // covered
  | 'fixed' | 'older' | 'business_lender' | 'business_over_50l' // not covered
  | 'unsure'                                                  // unknown

export interface CoverageResult {
  coverage: Coverage
  basis: CoverageBasis
}

const NO_CHARGES_ANY_AMOUNT: readonly LenderType[] = ['commercial_bank', 'urban_coop_tier4', 'nbfc_upper_layer', 'aifi']
const NO_CHARGES_UP_TO_50L: readonly LenderType[] = [
  'small_finance_bank', 'regional_rural_bank', 'urban_coop_tier3', 'state_or_central_coop', 'nbfc_middle_layer',
]
const NOT_COVERED_LENDERS: readonly LenderType[] = ['nbfc_base_layer', 'local_area_bank']

/** Pre-fill the questionnaire from what the ledger knows. */
export function answersFromDebt(debt: EngineDebt): ChargeCheckAnswers {
  return {
    rateType: debt.rateType ?? 'unknown',
    sanctionedOnOrAfter2026: debt.sanctionedOn ? (debt.sanctionedOn >= RULE_START_DATE ? 'yes' : 'no') : 'unknown',
    purpose: debt.purpose ?? 'unknown',
  }
}

/**
 * The sanction date to quote in reasons and the lender message: the ledger's date, but only
 * when it agrees with the user's answer to "on or after 1 January 2026?". If they disagree,
 * the user's answer wins and no date is quoted.
 */
export function consistentSanctionDate(answers: ChargeCheckAnswers, sanctionedOn?: string): string | undefined {
  if (!sanctionedOn) return undefined
  const after = sanctionedOn >= RULE_START_DATE
  if (answers.sanctionedOnOrAfter2026 === 'yes' && after) return sanctionedOn
  if (answers.sanctionedOnOrAfter2026 === 'no' && !after) return sanctionedOn
  return undefined
}

/** A definite "no" decides the result even when other answers are "Not sure". */
export function isCovered(a: ChargeCheckAnswers): CoverageResult {
  if (a.rateType === 'fixed') return { coverage: 'not_covered', basis: 'fixed' }
  if (a.sanctionedOnOrAfter2026 === 'no') return { coverage: 'not_covered', basis: 'older' }

  let lender: YesNoUnknown = 'yes'
  if (a.purpose === 'business') {
    lender = businessLenderCheck(a.lenderType, a.sanctionedAmountUpTo50L)
    if (lender === 'no') {
      const capped = a.lenderType !== undefined && NO_CHARGES_UP_TO_50L.includes(a.lenderType)
      return { coverage: 'not_covered', basis: capped ? 'business_over_50l' : 'business_lender' }
    }
  }

  if (a.rateType === 'unknown' || a.sanctionedOnOrAfter2026 === 'unknown' || a.purpose === 'unknown' || lender === 'unknown') {
    return { coverage: 'unknown', basis: 'unsure' }
  }
  return { coverage: 'covered', basis: a.purpose === 'business' ? 'business' : 'personal' }
}

function businessLenderCheck(lenderType: LenderType | undefined, upTo50L: YesNoUnknown | undefined): YesNoUnknown {
  if (!lenderType || lenderType === 'unknown') return 'unknown'
  if (NO_CHARGES_ANY_AMOUNT.includes(lenderType)) return 'yes'
  if (NO_CHARGES_UP_TO_50L.includes(lenderType)) return upTo50L ?? 'unknown'
  if (NOT_COVERED_LENDERS.includes(lenderType)) return 'no'
  return 'unknown'
}

function lineStatus(line: ChargeLine, coverage: Coverage): ChargeStatus {
  switch (line.kind) {
    case 'foreclosure':
    case 'prepayment_fee':
      if (coverage === 'covered') return 'doesnt_add_up'
      if (coverage === 'not_covered') return line.disclosed === 'no' ? 'ask_lender' : 'not_covered'
      return 'ask_lender'
    case 'admin':
    case 'other':
      // A missing answer is treated as "Not sure": we can't claim it is listed.
      return line.disclosed === 'yes' ? 'matches' : 'ask_lender'
    case 'gst':
      return 'follows'
  }
}

const UNDISCLOSED =
  'Not listed in your sanction letter or Key Facts Statement. RBI says charges must be disclosed there. Ask where this one is.'
const DISCLOSURE_UNSURE =
  "You weren't sure it is listed in your sanction letter or Key Facts Statement. RBI says charges must be disclosed there. Ask where this one is."
const COVERAGE_UNSURE = "We couldn't tell whether the rule covers this loan. Ask the lender to confirm."

function sanctionedText(sanctionedOn?: string): string {
  return sanctionedOn ? `sanctioned ${formatDate(sanctionedOn)}` : 'sanctioned or renewed on or after 1 Jan 2026'
}

function coveredReason(basis: CoverageBasis, sanctionedOn?: string): string {
  if (basis === 'business') {
    return 'RBI bars prepayment and foreclosure charges on floating-rate business loans to individuals from this type of lender, sanctioned or renewed on or after 1 Jan 2026. ' +
      `This loan is floating-rate, for business use, ${sanctionedText(sanctionedOn)}.`
  }
  return 'RBI bars prepayment and foreclosure charges on floating-rate loans to individuals for personal use, sanctioned or renewed on or after 1 Jan 2026. ' +
    `This loan is floating-rate, personal, ${sanctionedText(sanctionedOn)}.`
}

function notCoveredReason(basis: CoverageBasis): string {
  switch (basis) {
    case 'fixed':
      return 'That RBI rule covers floating-rate loans. This one is fixed-rate, so your loan agreement decides. Read its charges section.'
    case 'older':
      return 'This loan was sanctioned before 1 Jan 2026, so the rule does not apply. Your loan agreement decides.'
    case 'business_over_50l':
      return 'For business loans from this type of lender, the RBI rule only covers loans up to ₹50 lakh. Your loan agreement decides.'
    default:
      return 'The RBI rule does not cover business loans from this type of lender. Your loan agreement decides.'
  }
}

export interface ChargeCheckResult {
  coverage: CoverageResult
  /** Same order as the lines */
  results: ChargeLineResult[]
  /** Σ "doesn't add up" lines, GST included */
  flaggedTotal: number
  /** Σ "ask the lender" lines, GST included */
  toConfirmTotal: number
}

export function checkCharges(answers: ChargeCheckAnswers, lines: readonly ChargeLine[], sanctionedOn?: string): ChargeCheckResult {
  const coverage = isCovered(answers)
  const statuses = lines.map((l) => lineStatus(l, coverage.coverage))
  const gstFallsAway = statuses.some((s) => s === 'doesnt_add_up' || s === 'ask_lender')

  const results = lines.map((line, i): ChargeLineResult => {
    const status = statuses[i]
    switch (status) {
      case 'doesnt_add_up':
        return { status, reason: coveredReason(coverage.basis, sanctionedOn) }
      case 'not_covered':
        return { status, reason: notCoveredReason(coverage.basis) }
      case 'ask_lender': {
        const chargeRule = line.kind === 'foreclosure' || line.kind === 'prepayment_fee'
        if (chargeRule && coverage.coverage === 'unknown') return { status, reason: COVERAGE_UNSURE }
        return { status, reason: line.disclosed === 'no' ? UNDISCLOSED : DISCLOSURE_UNSURE }
      }
      case 'follows':
        return {
          status,
          reason: gstFallsAway ? 'Falls away on any charge that comes off.' : 'Applies only if the charge above stands.',
        }
      case 'matches':
        return { status, reason: 'Listed in your sanction letter.' }
    }
  })

  const totalWithGst = (status: ChargeStatus) =>
    lines.reduce((s, l, i) => (statuses[i] === status ? s + l.amount : s), 0) * (1 + GST_RATE)

  return {
    coverage,
    results,
    flaggedTotal: totalWithGst('doesnt_add_up'),
    toConfirmTotal: totalWithGst('ask_lender'),
  }
}
