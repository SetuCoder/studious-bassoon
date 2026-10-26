import { useState } from 'react'
import { useNavigate } from 'react-router'
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
  const [uploadOpen, setUploadOpen] = useState(false)

  return (
    <div className="flex min-h-dvh flex-col">
      <DayScreen title="Add a debt" backTo="/debts">
        <DebtForm
          initial={emptyForm()}
          submitLabel="Save debt"
          onSubmit={(input) => {
            addDebt(input)
            navigate('/debts')
          }}
          footer={
            <SlabButton variant="line" onClick={() => setUploadOpen(true)}>
              Upload a statement instead
            </SlabButton>
          }
        />
      </DayScreen>
      <UploadFakeDoor open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  )
}
