import { formatDate, formatINR } from '../lib/format'
import type { ChargeLine, ChargeLineResult, RateType } from './types'

// The lender message. Questions, never accusations: we draft, the user sends.

export interface LenderMessageInput {
  loanName: string
  rateType: RateType
  sanctionedOn?: string
  lines: readonly ChargeLine[]
  results: readonly ChargeLineResult[]
}

export function draftLenderMessage({ loanName, rateType, sanctionedOn, lines, results }: LenderMessageInput): string {
  const flagged = lines.filter((_, i) => results[i]?.status === 'doesnt_add_up')
  const toAsk = lines.filter((_, i) => results[i]?.status === 'ask_lender')

  const details = [
    rateType !== 'unknown' ? `${rateType} rate` : undefined,
    sanctionedOn ? `sanctioned ${formatDate(sanctionedOn)}` : undefined,
  ].filter(Boolean)
  const loan = details.length ? `${loanName} (${details.join(', ')})` : loanName

  const out: string[] = [
    `Subject: Closing quote for my ${loanName}, request to review charges`,
    '',
    'Hello,',
    '',
  ]
  if (flagged.length) {
    out.push(`I am preparing to close my ${loan}. Your quote includes:`)
    for (const l of flagged) out.push(`  - ${l.label}: ${formatINR(l.amount)}`)
    out.push(
      '',
      "RBI's directions on prepayment charges bar these on floating-rate loans to individuals sanctioned or renewed on or after 1 January 2026. Please confirm they will be removed, or point me to the clause in my agreement that permits them.",
    )
  } else {
    out.push(`I am preparing to close my ${loan}.`)
  }
  if (toAsk.length) {
    out.push('')
    for (const l of toAsk) {
      out.push(`Please also show me where the ${lowerFirst(l.label)} (${formatINR(l.amount)}) is disclosed in my sanction letter or Key Facts Statement.`)
    }
  }
  out.push(
    '',
    'Please send a revised quote, including how GST has been recalculated.',
    '',
    'Thank you,',
    '[Your name]',
    'Loan account: [number]',
  )
  return out.join('\n')
}

/** "Documentation fee" -> "documentation fee", but leaves "GST" or "HDFC fee" alone. */
function lowerFirst(s: string): string {
  return /^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s
}

export function whatsAppShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`
}
