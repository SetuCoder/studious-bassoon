import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { Button } from '../../components/Button'
import { InfoBox } from '../../components/Cards'
import { ScreenBody } from '../../components/Layout'
import { Sheet } from '../../components/Sheet'
import { TopBar } from '../../components/TopBar'
import { summariseLedger } from '../../engine/ledger'
import { payoffTime } from '../../engine/payoff'
import { formatINR } from '../../lib/format'
import type { DebtInput } from '../../state/store'
import { useAppStore } from '../../state/store'
import { PAYMENT_BELOW_INTEREST } from '../../state/validation'
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
    <>
      <TopBar title={debt.name} backTo="/debts" />
      <ScreenBody>
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
          footer={<Button variant="text" onClick={() => setConfirmOpen(true)}>Delete this debt</Button>}
        />
      </ScreenBody>
      <Sheet open={confirmOpen} title="Delete this debt?" onClose={() => setConfirmOpen(false)}>
        <p className="text-sm text-neutral-700">This removes {debt.name} and any charge checks for it from this phone.</p>
        <Button
          onClick={() => {
            deleteDebt(debt.id)
            navigate('/debts', { replace: true })
          }}
        >
          Delete
        </Button>
        <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Keep it</Button>
      </Sheet>
    </>
  )
}

function PayoffInfo({ input }: { input: DebtInput }) {
  const time = payoffTime(input.balance, input.apr, input.monthlyPayment)
  const interest = summariseLedger([{ ...input, id: 'edit', name: '' }]).interestThisMonth
  const what = input.type === 'credit_card' ? 'card' : input.type === 'bnpl' ? 'balance' : 'loan'
  return (
    <InfoBox>
      <p role="status">
        {time.never
          ? PAYMENT_BELOW_INTEREST
          : `At ${formatINR(input.monthlyPayment)} a month, this ${what} clears in about ${time.wholeMonths} month${time.wholeMonths === 1 ? '' : 's'}.`}
      </p>
      <p className="mt-1 text-neutral-600">Interest this month: {formatINR(interest)}</p>
    </InfoBox>
  )
}
