import type { ChargeStatus } from '../engine/types'
import { CHARGE_STATUS_CHIPS } from '../lib/chargeLabels'

const chipStyle: Record<ChargeStatus, string> = {
  doesnt_add_up: 'bg-neutral-800 text-white border-neutral-800',
  ask_lender: 'bg-white text-neutral-900 border-neutral-800',
  not_covered: 'bg-white text-neutral-700 border-neutral-300',
  follows: 'bg-neutral-100 text-neutral-800 border-neutral-100',
  matches: 'bg-neutral-100 text-neutral-800 border-neutral-100',
}

interface ChargeRowProps {
  label: string
  /** Already formatted */
  amount: string
  status: ChargeStatus
  reason: string
}

/** WF Charge row: label and amount, the status chip, then why. */
export function ChargeRow({ label, amount, status, reason }: ChargeRowProps) {
  return (
    <div className="rounded-[10px] border border-neutral-300 bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-neutral-900">{label}</p>
        <p className="whitespace-nowrap font-semibold text-neutral-900">{amount}</p>
      </div>
      <p className="mt-2">
        <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${chipStyle[status]}`}>
          {CHARGE_STATUS_CHIPS[status]}
        </span>
      </p>
      <p className="mt-2 text-xs text-neutral-600">{reason}</p>
    </div>
  )
}
