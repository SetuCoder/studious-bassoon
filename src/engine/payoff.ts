/**
 * EMI for principal P at apr % a year over n months. Used to build fixtures and as a
 * suggestion only; in the app the user enters their own monthly payment.
 */
export function pmt(principal: number, apr: number, months: number): number {
  const r = apr / 1200
  return r === 0 ? principal / months : (principal * r) / (1 - Math.pow(1 + r, -months))
}

export type PayoffTime =
  | { never: false; months: number; wholeMonths: number }
  | { never: true }

/**
 * Months to clear one debt at a fixed monthly payment, ignoring the other debts.
 * `never` when the payment doesn't cover the monthly interest, so the balance grows.
 * `wholeMonths` is rounded up for display ("about 20 months").
 */
export function payoffTime(balance: number, apr: number, monthlyPayment: number): PayoffTime {
  if (balance <= 0) return { never: false, months: 0, wholeMonths: 0 }
  if (monthlyPayment <= 0) return { never: true }
  const r = apr / 1200
  if (r === 0) return done(balance / monthlyPayment)
  if (monthlyPayment <= r * balance) return { never: true }
  return done(-Math.log(1 - (r * balance) / monthlyPayment) / Math.log(1 + r))
}

function done(months: number): PayoffTime {
  // The small tolerance stops float noise (12.0000000001) rounding up a whole extra month.
  return { never: false, months, wholeMonths: Math.ceil(months - 1e-9) }
}
