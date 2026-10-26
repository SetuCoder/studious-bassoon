import type { ChargeKind, ChargeStatus, LenderType } from '../engine/types'

/** Charge types on question 5, in that order. */
export const CHARGE_KINDS: readonly ChargeKind[] = ['foreclosure', 'prepayment_fee', 'admin', 'other', 'gst']

export const CHARGE_KIND_LABELS: Record<ChargeKind, string> = {
  foreclosure: 'Foreclosure charge',
  prepayment_fee: 'Prepayment fee',
  admin: 'Admin or documentation fee',
  other: 'Other charge',
  gst: 'GST',
}

/** The chip on each result row (docs/rules.md "Reason text"). */
export const CHARGE_STATUS_CHIPS: Record<ChargeStatus, string> = {
  doesnt_add_up: "Doesn't add up",
  ask_lender: 'Ask the lender',
  not_covered: 'Rule does not cover it',
  follows: 'Follows the charges',
  matches: 'Matches',
}

/** Question 4a, "Who lent it?". The order groups lenders by how the RBI rule treats them. */
export const LENDER_TYPE_LABELS: Record<LenderType, string> = {
  commercial_bank: 'Commercial bank',
  urban_coop_tier4: 'Urban co-operative bank, Tier 4',
  nbfc_upper_layer: 'NBFC, upper layer',
  aifi: 'All India Financial Institution',
  small_finance_bank: 'Small finance bank',
  regional_rural_bank: 'Regional rural bank',
  urban_coop_tier3: 'Urban co-operative bank, Tier 3',
  state_or_central_coop: 'State or central co-operative bank',
  nbfc_middle_layer: 'NBFC, middle layer',
  nbfc_base_layer: 'NBFC, base layer',
  local_area_bank: 'Local area bank',
  unknown: 'Not sure',
}
