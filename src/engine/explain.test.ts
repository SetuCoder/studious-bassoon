import { describe, expect, it } from 'vitest'
import {
  NOTHING_TO_PUT_TO_WORK, allocationRows, explainOption, freedMonthlyPayment, joinNames, optionName, optionNote, topLabel,
} from './explain'
import { amountToPutToWork, rankOptions } from './options'
import { SAMPLE_DEBTS, debt } from './testDebts'

const input = { amount: 150000, buffer: 30000, assumedReturn: 12 }
const ranked = rankOptions(SAMPLE_DEBTS, input)
const option = (id: string) => ranked.options.find((o) => o.id === id)!

describe('explain', () => {
  it('works out the money to put to work without touching the buffer', () => {
    expect(amountToPutToWork(input)).toBe(120000)
    expect(amountToPutToWork({ amount: 20000, buffer: 30000 })).toBe(0)
  })

  it('frees card 1 + card 2 payments for the default fixture', () => {
    expect(freedMonthlyPayment(SAMPLE_DEBTS, option('apr').allocation)).toBe(8500)
  })

  it('explains highest rate first, then where the freed payments go', () => {
    expect(explainOption(SAMPLE_DEBTS, option('apr'), ranked.L, 12)).toEqual([
      'Credit card 1 costs 42% a year. No savings account pays anywhere near that, and an investment return is never guaranteed, so the money goes there first.',
      'Then the ₹8,500 a month you stop paying on Credit card 1 and Credit card 2 rolls to the next most expensive debt.',
    ])
  })

  it('leaves out the freed-payment sentence when nothing is cleared', () => {
    expect(explainOption(SAMPLE_DEBTS, option('home'), ranked.L, 12)).toEqual([
      'This puts the money where you chose, not where it saves the most interest.',
    ])
  })

  it('says the freed payment is yours to keep when every debt is cleared', () => {
    const debts = [debt({ id: 'a', name: 'Card A', balance: 10000, monthlyPayment: 1000 })]
    const r = rankOptions(debts, { amount: 50000, buffer: 0, assumedReturn: 12 })
    expect(explainOption(debts, r.options.find((o) => o.id === 'apr')!, r.L, 12)[1])
      .toBe('Then the ₹1,000 a month you stop paying on Card A is yours to keep, since every debt is cleared.')
  })

  it('says paying down wins when the assumed return is below the top rate', () => {
    expect(explainOption(SAMPLE_DEBTS, option('invest'), ranked.L, 12)[0]).toMatch(/so paying it down comes out ahead\.$/)
    const high = rankOptions(SAMPLE_DEBTS, { ...input, assumedReturn: 45 })
    expect(explainOption(SAMPLE_DEBTS, high.options[0], high.L, 45)[0]).toMatch(/Returns are not guaranteed and the debt cost is\.$/)
    expect(topLabel(high.options[0])).toBe('Comes out ahead')
    expect(topLabel(ranked.options[0])).toBe('Saves the most')
  })

  it('explains the savings baseline', () => {
    expect(explainOption(SAMPLE_DEBTS, option('save'), ranked.L, 12)).toEqual([
      'The money stays safe and earns about 3% while Credit card 1 keeps charging 42%.',
    ])
  })

  it('says so when there is nothing to put to work', () => {
    const zero = rankOptions(SAMPLE_DEBTS, { ...input, buffer: 150000 })
    expect(explainOption(SAMPLE_DEBTS, zero.options[0], zero.L, 12)).toEqual([NOTHING_TO_PUT_TO_WORK])
  })

  it('lists where the money goes, before and after', () => {
    expect(allocationRows(SAMPLE_DEBTS, option('size').allocation).map((r) => [r.debtId, r.before, r.after, r.amount])).toEqual([
      ['card1', 85000, 5000, 80000],
      ['card2', 22000, 0, 22000],
      ['bnpl', 18000, 0, 18000],
    ])
  })
})

describe('option names and notes', () => {
  it('names invest with the assumed return', () => {
    expect(optionName('invest', 12)).toBe('Invest at 12%')
    expect(optionName('apr', 12)).toBe('Highest rate first')
  })

  it('says what each option clears, in the order the money goes', () => {
    expect(optionNote(SAMPLE_DEBTS, option('apr'))).toBe('Clears Credit card 1, Credit card 2 and part of Buy now, pay later')
    expect(optionNote(SAMPLE_DEBTS, option('size'))).toBe('Clears Buy now, pay later, Credit card 2 and part of Credit card 1')
    expect(optionNote(SAMPLE_DEBTS, option('invest'))).toBe('Return not guaranteed; the debts keep running')
    expect(optionNote(SAMPLE_DEBTS, option('save'))).toBe('The baseline everything is compared with')
  })

  it('calls the home loan the cheapest debt only when it is', () => {
    expect(optionNote(SAMPLE_DEBTS, option('home'))).toBe('Your cheapest debt, so each rupee saves the least')
    const cheaperCar = SAMPLE_DEBTS.map((d) => (d.id === 'car' ? { ...d, apr: 7 } : d))
    const r = rankOptions(cheaperCar, input)
    expect(optionNote(cheaperCar, r.options.find((o) => o.id === 'home')!)).toBe('Pays off part of Home loan')
  })

  it('describes the split option', () => {
    const r = rankOptions(SAMPLE_DEBTS, { ...input, assumedReturn: 36 })
    expect(optionNote(SAMPLE_DEBTS, r.options.find((o) => o.id === 'split')!)).toBe('Clears Credit card 1, then invests ₹35,000')
  })

  it('joins names in plain English', () => {
    expect(joinNames(['A'])).toBe('A')
    expect(joinNames(['A', 'B'])).toBe('A and B')
    expect(joinNames(['A', 'B', 'C'])).toBe('A, B and C')
  })
})
