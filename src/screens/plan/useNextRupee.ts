import { useMemo } from 'react'
import { rankOptions, type NextRupeeResult } from '../../engine/options'
import type { NextRupeeInput } from '../../engine/types'
import { useAppStore } from '../../state/store'

/** First-visit values on screen 06 (docs/beta-spec.md); later visits use the last inputs. */
export const DEFAULT_NEXT_RUPEE: NextRupeeInput = { amount: 150000, buffer: 30000, assumedReturn: 12 }

/** The ranking for the last inputs compared on 06, or undefined if nothing has been compared yet. */
export function useNextRupee(): { input: NextRupeeInput; result: NextRupeeResult } | undefined {
  const input = useAppStore((s) => s.lastNextRupee)
  const debts = useAppStore((s) => s.debts)
  return useMemo(() => (input ? { input, result: rankOptions(debts, input) } : undefined), [input, debts])
}
