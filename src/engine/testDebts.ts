import fixtures from '../../docs/reference/engine-fixtures.json'
import type { EngineDebt } from './types'

/** The sample borrower from docs/reference/engine-fixtures.json. Test-only. */
export const SAMPLE_DEBTS = fixtures.debts as EngineDebt[]

export function debt(overrides: Partial<EngineDebt> & Pick<EngineDebt, 'id'>): EngineDebt {
  return { name: overrides.id, type: 'credit_card', balance: 10000, apr: 36, monthlyPayment: 1000, ...overrides }
}
