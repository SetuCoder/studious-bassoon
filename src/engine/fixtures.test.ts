import { describe, expect, it } from 'vitest'
import fixtures from '../../docs/reference/engine-fixtures.json'
import { GST_RATE, HORIZON_MONTHS, SAVINGS_RATE } from './constants'
import { summariseLedger } from './ledger'
import { rankOptions } from './options'
import { payoffTime, pmt } from './payoff'
import { answersFromDebt, checkCharges } from './rules'
import { simulate } from './simulate'
import type { ChargeKind, ChargeLine, EngineDebt, NextRupeeInput, YesNoUnknown } from './types'

// docs/reference/engine-fixtures.json must pass to ±₹1 unless the spec is deliberately changed.

const debts = fixtures.debts as EngineDebt[]

interface OptionFixture {
  input: NextRupeeInput
  expected: {
    L: number
    order: string[]
    options: { id: string; delta: number; allocation: Record<string, number>; invested?: number }[]
  }
}
const optionFixtures = fixtures.options as OptionFixture[]

function expectRupees(actual: number, expected: number) {
  expect(Math.abs(actual - expected), `expected ₹${expected}, got ₹${actual}`).toBeLessThanOrEqual(1)
}

function expectAllocation(actual: Record<string, number>, expected: Record<string, number>) {
  expect(Object.keys(actual).sort()).toEqual(Object.keys(expected).sort())
  for (const [id, rupees] of Object.entries(expected)) expectRupees(actual[id], rupees)
}

describe('engine fixtures', () => {
  it('uses the fixture constants', () => {
    expect(HORIZON_MONTHS).toBe(fixtures.constants.HORIZON_MONTHS)
    expect(SAVINGS_RATE).toBe(fixtures.constants.SAVINGS_RATE)
    expect(GST_RATE).toBe(fixtures.constants.GST_RATE)
  })

  it('builds loan payments with pmt', () => {
    const months: Record<string, number> = { home: 240, car: 36, personal: 30 }
    for (const d of debts.filter((d) => d.id in months)) {
      expect(pmt(d.balance, d.apr, months[d.id])).toBeCloseTo(d.monthlyPayment, 2)
    }
  })

  it('summarises the ledger', () => {
    const l = summariseLedger(debts, fixtures.takeHomeMonthly)
    const e = fixtures.ledger
    expectRupees(l.totalOwed, e.totalOwed)
    expectRupees(l.monthlyPayments, e.monthlyPayments)
    expect(l.shareOfTakeHome).toBeCloseTo(e.shareOfTakeHome, 4)
    expectRupees(l.interestThisMonth, e.interestThisMonth)
    expect(l.weightedApr).toBeCloseTo(e.weightedApr, 2)
    expect(l.sortedByCost.map((d) => d.id)).toEqual(e.sortedByCostIds)
  })

  it('runs the base simulation', () => {
    const s = simulate(debts)
    const e = fixtures.baseSimulation
    expectRupees(s.totalInterest, e.totalInterest)
    expectRupees(s.spare, e.spare)
    expectRupees(s.remaining, e.remaining)
    expect(s.cleared).toEqual(e.clearedMonth)
  })

  describe.each(optionFixtures)('next rupee $input.amount / buffer $input.buffer / return $input.assumedReturn%', ({ input, expected }) => {
    const result = rankOptions(debts, input)

    it('puts the right amount to work', () => {
      expectRupees(result.L, expected.L)
    })

    it('ranks the options in order', () => {
      expect(result.options.map((o) => o.id)).toEqual(expected.order)
    })

    it.each(expected.options)('option $id', (e) => {
      const o = result.options.find((o) => o.id === e.id)!
      expectRupees(o.delta, e.delta)
      expectAllocation(o.allocation, e.allocation)
      if (e.invested !== undefined) expectRupees(o.invested, e.invested)
    })
  })

  it('handles a card that never clears', () => {
    const { debt, expected } = fixtures.neverClearingCard
    const card: EngineDebt = { id: 'card', name: 'Card', type: 'credit_card', ...debt }
    expect(payoffTime(debt.balance, debt.apr, debt.monthlyPayment).never).toBe(expected.payoffNever)
    expectRupees(simulate([card]).remaining, expected.remainingAfter36)
  })

  describe.each(fixtures.chargeChecks)('charge check on $debtId', ({ debtId, lines, expected }) => {
    const debt = debts.find((d) => d.id === debtId)!
    // In the app the user enters only the charge lines; principal and interest are in the
    // fixture to match the prototype's full quote (docs/rules.md).
    const kinds: Record<string, ChargeKind> = { foreclosure: 'foreclosure', prepay_fee: 'prepayment_fee', admin: 'admin', gst: 'gst' }
    const chargeLines: ChargeLine[] = lines
      .filter((l) => l.kind in kinds)
      .map((l) => ({ kind: kinds[l.kind], label: l.label, amount: l.amount, disclosed: 'disclosed' in l ? (l.disclosed as YesNoUnknown) : undefined }))
    const result = checkCharges(answersFromDebt(debt), chargeLines, debt.sanctionedOn)

    it('totals the flagged and to-confirm charges with GST', () => {
      expectRupees(result.flaggedTotal, expected.flaggedTotal)
      expectRupees(result.toConfirmTotal, expected.toConfirmTotal)
    })

    it('gives each line the status from rules.md', () => {
      const want = debtId === 'personal'
        ? ['doesnt_add_up', 'doesnt_add_up', 'ask_lender', 'follows']
        : ['not_covered', 'follows']
      expect(result.results.map((r) => r.status)).toEqual(want)
    })
  })
})
