import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '../../components/Button'
import { ScreenBody } from '../../components/Layout'
import { TopBar } from '../../components/TopBar'
import { useAppStore } from '../../state/store'
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
      <TopBar title="Add a debt" backTo="/debts" />
      <ScreenBody>
        <DebtForm
          initial={emptyForm()}
          submitLabel="Save debt"
          onSubmit={(input) => {
            addDebt(input)
            navigate('/debts')
          }}
          footer={
            <Button variant="secondary" onClick={() => setUploadOpen(true)}>
              Upload a statement instead
            </Button>
          }
        />
      </ScreenBody>
      <UploadFakeDoor open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  )
}
