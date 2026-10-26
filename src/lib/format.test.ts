import { describe, expect, it } from 'vitest'
import { formatDate, formatINR } from './format'

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
