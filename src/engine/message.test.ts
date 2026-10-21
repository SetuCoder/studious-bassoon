import { describe, expect, it } from 'vitest'
import fixtures from '../../docs/reference/engine-fixtures.json'
import { draftLenderMessage, whatsAppShareUrl } from './message'
import { answersFromDebt, checkCharges } from './rules'
import type { ChargeLine } from './types'

const lines: ChargeLine[] = [
  { kind: 'foreclosure', label: 'Foreclosure charge (3% of principal)', amount: 6300, disclosed: 'yes' },
  { kind: 'prepayment_fee', label: 'Prepayment processing fee', amount: 1500, disclosed: 'yes' },
  { kind: 'admin', label: 'Documentation and administration fee', amount: 750, disclosed: 'no' },
  { kind: 'gst', label: 'GST at 18% on the charges above', amount: 1539 },
]

describe('draftLenderMessage', () => {
  it('builds the rules.md template for the personal-loan quote', () => {
    const personal = fixtures.debts.find((d) => d.id === 'personal')!
    const { results } = checkCharges(answersFromDebt(personal as never), lines, personal.sanctionedOn)
    expect(draftLenderMessage({ loanName: 'Personal loan', rateType: 'floating', sanctionedOn: '2026-03-14', lines, results })).toBe(
      `Subject: Closing quote for my Personal loan, request to review charges

Hello,

I am preparing to close my Personal loan (floating rate, sanctioned 14 March 2026). Your quote includes:
  - Foreclosure charge (3% of principal): ₹6,300
  - Prepayment processing fee: ₹1,500

RBI's directions on prepayment charges bar these on floating-rate loans to individuals sanctioned or renewed on or after 1 January 2026. Please confirm they will be removed, or point me to the clause in my agreement that permits them.

Please also show me where the documentation and administration fee (₹750) is disclosed in my sanction letter or Key Facts Statement.

Please send a revised quote, including how GST has been recalculated.

Thank you,
[Your name]
Loan account: [number]`,
    )
  })

  it('omits the flagged block and the asks when there are none', () => {
    const msg = draftLenderMessage({
      loanName: 'Car loan',
      rateType: 'fixed',
      sanctionedOn: '2023-04-05',
      lines: [lines[0]],
      results: [{ status: 'not_covered', reason: '' }],
    })
    expect(msg).toContain('I am preparing to close my Car loan (fixed rate, sanctioned 5 April 2023).\n')
    expect(msg).not.toContain('Your quote includes')
    expect(msg).not.toContain("RBI's directions")
    expect(msg).not.toContain('Please also')
  })

  it('builds a WhatsApp share link', () => {
    expect(whatsAppShareUrl('a b\n₹')).toBe('https://wa.me/?text=a%20b%0A%E2%82%B9')
  })
})
