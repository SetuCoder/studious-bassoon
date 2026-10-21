// Types from docs/data-model.md. Money is rupees, rates are % a year, dates are ISO strings.

export type DebtType =
  | 'credit_card' | 'personal_loan' | 'home_loan' | 'car_loan'
  | 'education_loan' | 'bnpl' | 'gold_loan' | 'other'

export type RateType = 'fixed' | 'floating' | 'unknown'

export type Purpose = 'personal' | 'business' | 'unknown'

export type YesNoUnknown = 'yes' | 'no' | 'unknown'

export interface Debt {
  id: string
  name: string
  type: DebtType
  balance: number
  apr: number
  monthlyPayment: number
  // Loans only (not credit_card or bnpl):
  rateType?: RateType
  sanctionedOn?: string
  purpose?: Purpose
  createdAt: string
  updatedAt: string
  paidOffOn?: string
}

/** The fields the engine reads. A stored Debt satisfies it. */
export type EngineDebt = Pick<Debt, 'id' | 'name' | 'type' | 'balance' | 'apr' | 'monthlyPayment'> &
  Partial<Pick<Debt, 'rateType' | 'sanctionedOn' | 'purpose' | 'paidOffOn'>>

export interface Profile {
  takeHomeMonthly?: number
}

export interface NextRupeeInput {
  amount: number
  buffer: number
  assumedReturn: number
}

export type OptionId = 'apr' | 'size' | 'home' | 'invest' | 'save' | 'split'

/** debtId -> rupees paid off today */
export type Allocation = Record<string, number>

export interface SavedPlan {
  strategy: OptionId
  chosenAt: string
  input: NextRupeeInput
  allocation: Allocation
}

export interface CheckIn {
  id: string
  date: string
  balances: Record<string, number>
}

export type ChargeKind = 'foreclosure' | 'prepayment_fee' | 'admin' | 'other' | 'gst'
export type ChargeStatus = 'doesnt_add_up' | 'ask_lender' | 'not_covered' | 'follows' | 'matches'

export interface ChargeLine {
  kind: ChargeKind
  label: string
  amount: number
  disclosed?: YesNoUnknown
}

export type LenderType =
  | 'commercial_bank' | 'small_finance_bank' | 'regional_rural_bank' | 'local_area_bank'
  | 'urban_coop_tier4' | 'urban_coop_tier3' | 'state_or_central_coop'
  | 'nbfc_upper_layer' | 'nbfc_middle_layer' | 'nbfc_base_layer' | 'aifi' | 'unknown'

export interface ChargeCheckAnswers {
  rateType: RateType
  sanctionedOnOrAfter2026: YesNoUnknown
  purpose: Purpose
  lenderType?: LenderType
  sanctionedAmountUpTo50L?: YesNoUnknown
}

export interface ChargeLineResult {
  status: ChargeStatus
  reason: string
}

export interface ChargeCheck {
  id: string
  debtId: string
  createdAt: string
  answers: ChargeCheckAnswers
  lines: ChargeLine[]
  results: ChargeLineResult[]
  flaggedTotal: number
  toConfirmTotal: number
  message: string
  outcome?: {
    status: 'removed_all' | 'removed_some' | 'refused' | 'no_reply'
    amountRemoved?: number
    recordedOn: string
  }
}

export interface AppData {
  schemaVersion: 1
  profile: Profile
  debts: Debt[]
  lastNextRupee?: NextRupeeInput
  plan?: SavedPlan
  checkIns: CheckIn[]
  chargeChecks: ChargeCheck[]
  feedback: { wouldAct?: 'yes' | 'maybe' | 'no'; recommend?: 'not_likely' | 'maybe' | 'very_likely' }
  /** Me tab toggle "Share anonymous usage counts"; on by default. */
  settings: { shareUsageCounts: boolean }
}
