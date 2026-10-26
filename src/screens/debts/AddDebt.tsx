import { useState } from 'react'
import { useNavigate } from 'react-router'
import { isActive } from '../../engine/ledger'
import { track } from '../../lib/analytics'
import { useAppStore } from '../../state/store'
import { DayScreen } from '../../ui/DayScreen'
import { SlabButton } from '../../ui/SlabButton'
import { DebtForm } from './DebtForm'
import { emptyForm } from './debtFormState'
import { UploadFakeDoor } from './UploadFakeDoor'

/** 02 Add a debt. No tab bar. */
export function AddDebt() {
  const navigate = useNavigate()
  const addDebt = useAppStore((s) => s.addDebt)
  const activeCount = useAppStore((s) => s.debts.filter(isActive).length)
  const [uploadOpen, setUploadOpen] = useState(false)

  return (
    <div className="flex min-h-dvh flex-col">
      <DayScreen title="Add a debt" backTo="/debts">
        <DebtForm
          initial={emptyForm()}
          submitLabel="Save debt"
          onSubmit={(input) => {
            addDebt(input)
            track('debt_added', {
              type: input.type,
              has_rate_type: input.rateType === 'fixed' || input.rateType === 'floating',
              has_sanction_date: Boolean(input.sanctionedOn),
              debt_count: activeCount + 1,
            })
            navigate('/debts')
          }}
          footer={
            <SlabButton variant="line" onClick={() => {
              track('upload_fake_door_tapped', { screen: 'add_debt' })
              setUploadOpen(true)
            }}>
              Upload a statement instead
            </SlabButton>
          }
        />
      </DayScreen>
      <UploadFakeDoor screen="add_debt" open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  )
}
