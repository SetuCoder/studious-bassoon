import { describe, expect, it } from 'vitest'
import { formatDate, formatDelta, formatDuration, formatINR, formatRate, formatShare, groupDigits, monthYearAfter, rateText, rupeeDigits } from './format'

describe('formatINR', () => {
  it('uses Indian digit grouping and no decimals', () => {
    expect(formatINR(4555000)).toBe('₹45,55,000')
    expect(formatINR(69771.37)).toBe('₹69,771')
    expect(formatINR(55727.66)).toBe('₹55,728')
  })

  it('never shows "-₹0"', () => {
    expect(formatINR(-0.2)).toBe('₹0')
  })
})

describe('formatDate', () => {
  it('formats ISO dates without time-zone drift', () => {
    expect(formatDate('2026-03-14')).toBe('14 March 2026')
  })
})

describe('input helpers', () => {
  it('groups rupee digits the Indian way as the user types', () => {
    expect(groupDigits(rupeeDigits('₹ 85,00,000'))).toBe('85,00,000')
    expect(rupeeDigits('007')).toBe('7')
    expect(rupeeDigits('0')).toBe('0')
    expect(groupDigits('')).toBe('')
  })

  it('keeps one decimal point and two decimals in a rate', () => {
    expect(rateText('8.755')).toBe('8.75')
    expect(rateText('1.2.3')).toBe('1.23')
    expect(rateText('42%')).toBe('42')
  })

  it('formats rates and shares', () => {
    expect(formatRate(8.75)).toBe('8.75')
    expect(formatRate(42)).toBe('42')
    expect(formatShare(0.4812)).toBe('48%')
  })
})

describe('formatDelta', () => {
  it('signs gains and losses', () => {
    expect(formatDelta(55727.66)).toBe('+₹55,728')
    expect(formatDelta(0.3)).toBe('₹0')
    expect(formatDelta(-1200)).toBe('−₹1,200')
  })
})

describe('monthYearAfter and formatDuration', () => {
  it('names the month a number of months ahead', () => {
    expect(monthYearAfter(90, new Date(2026, 10, 5))).toBe('May 2034')
    expect(monthYearAfter(2, new Date(2026, 10, 30))).toBe('January 2027')
  })

  it('says a duration in years and months', () => {
    expect(formatDuration(4)).toBe('4 months')
    expect(formatDuration(1)).toBe('1 month')
    expect(formatDuration(12)).toBe('1 year')
    expect(formatDuration(90)).toBe('7 years 6 months')
    expect(formatDuration(25)).toBe('2 years 1 month')
  })
})
