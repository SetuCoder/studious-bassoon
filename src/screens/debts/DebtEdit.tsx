import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { Sheet } from '../../components/Sheet'
import { cardUsage, monthlyInterest, repaidShare } from '../../engine/ledger'
import { payoffTime } from '../../engine/payoff'
import { formatINR, formatShare } from '../../lib/format'
import type { DebtInput } from '../../state/store'
import { useAppStore } from '../../state/store'
import { PAYMENT_BELOW_INTEREST } from '../../state/validation'
import { DayScreen } from '../../ui/DayScreen'
import { SlabButton } from '../../ui/SlabButton'
import { DebtForm } from './DebtForm'
import { formFromDebt } from './debtFormState'

/** 05 Debt edit (M1). */
export function DebtEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const debt = useAppStore((s) => s.debts.find((d) => d.id === id))
  const updateDebt = useAppStore((s) => s.updateDebt)
  const deleteDebt = useAppStore((s) => s.deleteDebt)
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (!debt) return <Navigate to="/debts" replace />

  return (
    <DayScreen title={debt.name} backTo="/debts">
      <DebtForm
        key={debt.id}
        initial={formFromDebt(debt)}
        submitLabel="Save changes"
        hidePaymentWarning
        detailsOpen
        info={(input) => input && <PayoffInfo input={input} />}
        onSubmit={(input) => {
          updateDebt(debt.id, input)
          navigate('/debts')
        }}
        footer={
          <button type="button" onClick={() => setConfirmOpen(true)} className="mx-auto min-h-11 px-3 text-[15px] font-bold underline underline-offset-4">
            Delete this debt
          </button>
        }
      />
      <Sheet open={confirmOpen} title="Delete this debt?" onClose={() => setConfirmOpen(false)}>
        <p className="text-[15px] leading-snug text-plum-muted">This removes {debt.name} and any charge checks for it from this phone.</p>
        <SlabButton
          variant="ink"
          onClick={() => {
            deleteDebt(debt.id)
            navigate('/debts', { replace: true })
          }}
        >
          Delete
        </SlabButton>
        <SlabButton variant="line" onClick={() => setConfirmOpen(false)}>Keep it</SlabButton>
      </Sheet>
    </DayScreen>
  )
}

/** What this debt costs on its own, plus what its optional details reveal, on a small night slab. */
function PayoffInfo({ input }: { input: DebtInput }) {
  const time = payoffTime(input.balance, input.apr, input.monthlyPayment)
  const what = input.type === 'credit_card' ? 'card' : input.type === 'bnpl' ? 'balance' : 'loan'
  const usage = cardUsage(input)
  const repaid = repaidShare(input)
  const facts: string[] = []
  if (usage !== undefined) facts.push(`Using ${formatShare(usage)} of your ${formatINR(input.creditLimit!)} limit.`)
  if (input.dueDay) facts.push(`Bill due on the ${ordinal(input.dueDay)} of each month.`)
  if (repaid !== undefined) facts.push(`You’ve repaid ${formatShare(repaid)} of the ${formatINR(input.originalAmount!)} you borrowed.`)
  if (input.monthsLeft && !time.never) {
    const count = input.type === 'bnpl' ? 'instalments' : 'EMIs'
    facts.push(`Your lender says ${input.monthsLeft} ${count} left; at this payment we work out about ${time.wholeMonths}.`)
  }
  return (
    <div className="surface-night rounded-3xl p-4 text-ice shadow-slab">
      <p role="status" className={`text-[16px] leading-snug font-bold ${time.never ? 'text-marigold' : ''}`}>
        {time.never
          ? PAYMENT_BELOW_INTEREST
          : `At ${formatINR(input.monthlyPayment)} a month, this ${what} clears in about ${time.wholeMonths} month${time.wholeMonths === 1 ? '' : 's'}.`}
      </p>
      <p className="mt-1 text-[14px] text-mauve">Interest this month: {formatINR(monthlyInterest(input))}</p>
      {facts.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5 border-t border-white/10 pt-3">
          {facts.map((f) => <li key={f} className="text-[14px] leading-snug">{f}</li>)}
        </ul>
      )}
    </div>
  )
}

/** 1 → "1st", 22 → "22nd", 13 → "13th". */
function ordinal(n: number): string {
  const tens = n % 100
  const suffix = tens >= 11 && tens <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'
  return `${n}${suffix}`
}
