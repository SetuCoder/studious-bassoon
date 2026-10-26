import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { Sheet } from '../../components/Sheet'
import { summariseLedger } from '../../engine/ledger'
import { payoffTime } from '../../engine/payoff'
import { formatINR } from '../../lib/format'
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

/** What this debt costs on its own, on a small night slab so it reads as the answer. */
function PayoffInfo({ input }: { input: DebtInput }) {
  const time = payoffTime(input.balance, input.apr, input.monthlyPayment)
  const interest = summariseLedger([{ ...input, id: 'edit', name: '' }]).interestThisMonth
  const what = input.type === 'credit_card' ? 'card' : input.type === 'bnpl' ? 'balance' : 'loan'
  return (
    <div className="rounded-3xl bg-aubergine p-4 text-ice shadow-slab">
      <p role="status" className={`text-[16px] leading-snug font-bold ${time.never ? 'text-marigold' : ''}`}>
        {time.never
          ? PAYMENT_BELOW_INTEREST
          : `At ${formatINR(input.monthlyPayment)} a month, this ${what} clears in about ${time.wholeMonths} month${time.wholeMonths === 1 ? '' : 's'}.`}
      </p>
      <p className="mt-1 text-[14px] text-mauve">Interest this month: {formatINR(interest)}</p>
    </div>
  )
}
