import { describe, expect, it } from 'vitest'
import { PAYMENT_BELOW_INTEREST, isValid, localToday, validateDebt } from './validation'

const ok = { balance: 85000, apr: 42, monthlyPayment: 6000 }

describe('validateDebt', () => {
  it('accepts a normal debt', () => {
    const v = validateDebt(ok, '2026-10-22')
    expect(isValid(v)).toBe(true)
    expect(v.warning).toBeUndefined()
  })

  it.each([
    [{ balance: 0 }, 'balance', 'Enter how much you owe'],
    [{ balance: undefined }, 'balance', 'Enter how much you owe'],
    [{ apr: 61 }, 'apr', 'Enter the yearly rate, for example 13 or 42'],
    [{ apr: -1 }, 'apr', 'Enter the yearly rate, for example 13 or 42'],
    [{ apr: Number.NaN }, 'apr', 'Enter the yearly rate, for example 13 or 42'],
    [{ monthlyPayment: 0 }, 'monthlyPayment', 'Enter what you pay each month'],
    [{ sanctionedOn: '2026-10-23' }, 'sanctionedOn', 'That date is in the future'],
  ] as const)('rejects %o', (patch, field, message) => {
    const v = validateDebt({ ...ok, ...patch }, '2026-10-22')
    expect(v.errors[field]).toBe(message)
    expect(isValid(v)).toBe(false)
  })

  it('allows rates of 0 and 60, and a sanction date of today', () => {
    expect(isValid(validateDebt({ ...ok, apr: 0 }, '2026-10-22'))).toBe(true)
    expect(isValid(validateDebt({ ...ok, apr: 60 }, '2026-10-22'))).toBe(true)
    expect(isValid(validateDebt({ ...ok, sanctionedOn: '2026-10-22' }, '2026-10-22'))).toBe(true)
  })

  it('warns, without blocking, when the payment does not cover the interest', () => {
    const v = validateDebt({ balance: 100000, apr: 42, monthlyPayment: 3000 }, '2026-10-22')
    expect(isValid(v)).toBe(true)
    expect(v.warning).toBe(PAYMENT_BELOW_INTEREST)
  })
})

describe('localToday', () => {
  it('uses the local date', () => {
    expect(localToday(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
})
