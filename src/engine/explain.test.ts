import { describe, expect, it } from 'vitest'
import { NOTHING_TO_PUT_TO_WORK, allocationRows, explainOption, freedMonthlyPayment, topLabel } from './explain'
import { rankOptions } from './options'
import { SAMPLE_DEBTS } from './testDebts'

const input = { amount: 150000, buffer: 30000, assumedReturn: 12 }
const ranked = rankOptions(SAMPLE_DEBTS, input)
const option = (id: string) => ranked.options.find((o) => o.id === id)!

describe('explain', () => {
  it('frees card 1 + card 2 payments for the default fixture', () => {
    expect(freedMonthlyPayment(SAMPLE_DEBTS, option('apr').allocation)).toBe(8500)
  })

  it('explains highest rate first with the allocation and freed payments', () => {
    expect(explainOption(SAMPLE_DEBTS, option('apr'), ranked.L, 12)).toBe(
      'Credit card 1 costs 42% a year. No savings account pays anywhere near that, and an investment return is never guaranteed, so the money goes there first. ' +
      'The split: ₹85,000 to Credit card 1 (42%), ₹22,000 to Credit card 2 (38%), ₹13,000 to Buy now, pay later (30%). ' +
      'That frees ₹8,500 a month. Freed-up monthly payments then roll to the next highest-rate debt.',
    )
  })

  it('leaves out the freed-payment sentence when nothing is cleared', () => {
    const text = explainOption(SAMPLE_DEBTS, option('home'), ranked.L, 12)
    expect(text).toMatch(/^This puts the money where you chose/)
    expect(text).not.toMatch(/Freed-up/)
  })

  it('says paying down wins when the assumed return is below the top rate', () => {
    expect(explainOption(SAMPLE_DEBTS, option('invest'), ranked.L, 12)).toMatch(/so paying it down comes out ahead\.$/)
    const high = rankOptions(SAMPLE_DEBTS, { ...input, assumedReturn: 45 })
    expect(explainOption(SAMPLE_DEBTS, high.options[0], high.L, 45)).toMatch(/Returns are not guaranteed and the debt cost is\.$/)
    expect(topLabel(high.options[0])).toBe('Comes out ahead')
    expect(topLabel(ranked.options[0])).toBe('Saves the most')
  })

  it('explains the savings baseline', () => {
    expect(explainOption(SAMPLE_DEBTS, option('save'), ranked.L, 12)).toBe(
      'The money stays safe and earns about 3% while Credit card 1 keeps charging 42%.',
    )
  })

  it('says so when there is nothing to put to work', () => {
    const zero = rankOptions(SAMPLE_DEBTS, { ...input, buffer: 150000 })
    expect(explainOption(SAMPLE_DEBTS, zero.options[0], zero.L, 12)).toBe(NOTHING_TO_PUT_TO_WORK)
  })

  it('lists where the money goes, before and after', () => {
    expect(allocationRows(SAMPLE_DEBTS, option('size').allocation).map((r) => [r.debtId, r.before, r.after, r.amount])).toEqual([
      ['card1', 85000, 5000, 80000],
      ['card2', 22000, 0, 22000],
      ['bnpl', 18000, 0, 18000],
    ])
  })
})
