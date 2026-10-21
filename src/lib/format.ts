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
