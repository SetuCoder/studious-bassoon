import { describe, expect, it } from 'vitest'
import { answersFromDebt, checkCharges, isCovered } from './rules'
import type { ChargeCheckAnswers, ChargeLine } from './types'

const personal: ChargeCheckAnswers = { rateType: 'floating', sanctionedOnOrAfter2026: 'yes', purpose: 'personal' }
const business = (more: Partial<ChargeCheckAnswers>): ChargeCheckAnswers => ({ ...personal, purpose: 'business', ...more })

describe('isCovered (docs/rules.md decision table)', () => {
  it.each<[string, ChargeCheckAnswers, string]>([
    ['floating, after 2026, personal', personal, 'covered'],
    ['business, commercial bank', business({ lenderType: 'commercial_bank' }), 'covered'],
    ['business, Tier 4 UCB', business({ lenderType: 'urban_coop_tier4' }), 'covered'],
    ['business, NBFC upper layer', business({ lenderType: 'nbfc_upper_layer' }), 'covered'],
    ['business, AIFI', business({ lenderType: 'aifi' }), 'covered'],
    ['business, SFB, up to 50L', business({ lenderType: 'small_finance_bank', sanctionedAmountUpTo50L: 'yes' }), 'covered'],
    ['business, NBFC middle layer, over 50L', business({ lenderType: 'nbfc_middle_layer', sanctionedAmountUpTo50L: 'no' }), 'not_covered'],
    ['business, RRB, amount not sure', business({ lenderType: 'regional_rural_bank', sanctionedAmountUpTo50L: 'unknown' }), 'unknown'],
    ['business, NBFC base layer', business({ lenderType: 'nbfc_base_layer' }), 'not_covered'],
    ['business, local area bank', business({ lenderType: 'local_area_bank' }), 'not_covered'],
    ['business, lender not sure', business({ lenderType: 'unknown' }), 'unknown'],
    ['fixed rate', { ...personal, rateType: 'fixed' }, 'not_covered'],
    ['older loan', { ...personal, sanctionedOnOrAfter2026: 'no' }, 'not_covered'],
    ['rate not sure', { ...personal, rateType: 'unknown' }, 'unknown'],
    ['date not sure', { ...personal, sanctionedOnOrAfter2026: 'unknown' }, 'unknown'],
    ['purpose not sure', { ...personal, purpose: 'unknown' }, 'unknown'],
    ['fixed decides even if the rest is not sure', { rateType: 'fixed', sanctionedOnOrAfter2026: 'unknown', purpose: 'unknown' }, 'not_covered'],
    ['older decides even if the rate is not sure', { rateType: 'unknown', sanctionedOnOrAfter2026: 'no', purpose: 'unknown' }, 'not_covered'],
  ])('%s', (_, answers, expected) => {
    expect(isCovered(answers).coverage).toBe(expected)
  })
})

describe('answersFromDebt', () => {
  it('pre-fills from the ledger', () => {
    expect(answersFromDebt({ id: 'p', name: 'P', type: 'personal_loan', balance: 1, apr: 1, monthlyPayment: 1, rateType: 'floating', sanctionedOn: '2026-01-01', purpose: 'personal' }))
      .toEqual(personal)
    expect(answersFromDebt({ id: 'c', name: 'C', type: 'car_loan', balance: 1, apr: 1, monthlyPayment: 1, sanctionedOn: '2025-12-31' }))
      .toEqual({ rateType: 'unknown', sanctionedOnOrAfter2026: 'no', purpose: 'unknown' })
  })
})

describe('checkCharges', () => {
  const foreclosure: ChargeLine = { kind: 'foreclosure', label: 'Foreclosure charge', amount: 1000, disclosed: 'yes' }
  const gst: ChargeLine = { kind: 'gst', label: 'GST', amount: 180 }

  it('flags charges on a covered loan and names the date', () => {
    const r = checkCharges(personal, [foreclosure, gst], '2026-03-14')
    expect(r.results[0]).toEqual({
      status: 'doesnt_add_up',
      reason: 'RBI bars prepayment and foreclosure charges on floating-rate loans to individuals for personal use, sanctioned or renewed on or after 1 Jan 2026. This loan is floating-rate, personal, sanctioned 14 March 2026.',
    })
    expect(r.results[1]).toEqual({ status: 'follows', reason: 'Falls away on any charge that comes off.' })
    expect(r.flaggedTotal).toBeCloseTo(1180, 6)
  })

  it('asks the lender about an undisclosed charge on a loan the rule does not cover', () => {
    const r = checkCharges({ ...personal, rateType: 'fixed' }, [{ ...foreclosure, disclosed: 'no' }])
    expect(r.results[0].status).toBe('ask_lender')
    expect(r.toConfirmTotal).toBeCloseTo(1180, 6)
  })

  it('asks the lender when coverage is unknown', () => {
    const r = checkCharges({ ...personal, purpose: 'unknown' }, [foreclosure])
    expect(r.results[0]).toEqual({ status: 'ask_lender', reason: "We couldn't tell whether the rule covers this loan. Ask the lender to confirm." })
  })

  it('matches disclosed admin fees and asks about the rest', () => {
    const r = checkCharges(personal, [
      { kind: 'admin', label: 'Admin fee', amount: 500, disclosed: 'yes' },
      { kind: 'other', label: 'Other fee', amount: 200, disclosed: 'unknown' },
      { kind: 'other', label: 'Mystery fee', amount: 100 },
    ])
    expect(r.results.map((x) => x.status)).toEqual(['matches', 'ask_lender', 'ask_lender'])
  })

  it('keeps GST as "applies only if the charge above stands" when nothing comes off', () => {
    const r = checkCharges({ ...personal, sanctionedOnOrAfter2026: 'no' }, [foreclosure, gst])
    expect(r.results[0].reason).toBe('This loan was sanctioned before 1 Jan 2026, so the rule does not apply. Your loan agreement decides.')
    expect(r.results[1].reason).toBe('Applies only if the charge above stands.')
    expect(r.flaggedTotal).toBe(0)
  })
})
