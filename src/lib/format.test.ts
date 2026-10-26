import { describe, expect, it } from 'vitest'
import { formatDate, formatINR, formatRate, formatShare, groupDigits, rateText, rupeeDigits } from './format'

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
