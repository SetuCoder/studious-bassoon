const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

/** ₹45,55,000 style: Indian digit grouping, no decimals. */
export function formatINR(rupees: number): string {
  // `|| 0` turns -0 into 0 so tiny negatives never show as "-₹0".
  return inr.format(Math.round(rupees) || 0)
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** '2026-03-14' -> '14 March 2026'. Parsed by hand so the time zone can't shift the day. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}

/** The calendar month `months` from `from`: 90 months from November 2026 -> "May 2034". */
export function monthYearAfter(months: number, from: Date): string {
  const d = new Date(from.getFullYear(), from.getMonth() + months, 1)
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** 4 -> "4 months", 12 -> "1 year", 90 -> "7 years 6 months". */
export function formatDuration(months: number): string {
  const years = Math.floor(months / 12)
  const rest = months % 12
  const y = years === 1 ? '1 year' : `${years} years`
  const m = rest === 1 ? '1 month' : `${rest} months`
  return years === 0 ? m : rest === 0 ? y : `${y} ${m}`
}

const grouped = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
const rate = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 })

/** A rate as typed by the user: 8.75 -> "8.75", 42 -> "42". */
export function formatRate(apr: number): string {
  return rate.format(apr)
}

/** 0.4812 -> "48%" */
export function formatShare(fraction: number): string {
  return `${Math.round(fraction * 100)}%`
}

/** What a rupee input shows while typing: "8500000" -> "85,00,000". */
export function groupDigits(digits: string): string {
  return digits ? grouped.format(Number(digits)) : ''
}

/** Rupee input text -> digits only, no leading zeros, at most 12 digits. */
export function rupeeDigits(text: string): string {
  return text.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 12)
}

/** Rate input text -> digits and one decimal point, at most 2 decimals. */
export function rateText(text: string): string {
  const [whole, ...rest] = text.replace(/[^\d.]/g, '').split('.')
  return rest.length ? `${whole}.${rest.join('').slice(0, 2)}` : whole
}

/** An option's gain: "+₹55,728", "₹0", or "−₹1,200". */
export function formatDelta(rupees: number): string {
  const r = Math.round(rupees)
  if (r > 0) return `+${formatINR(r)}`
  if (r < 0) return `−${formatINR(-r)}`
  return formatINR(0)
}
