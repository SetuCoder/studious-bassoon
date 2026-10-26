import { motion } from 'motion/react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { isLoan } from '../../engine/ledger'
import { DEBT_TYPES, DEBT_TYPE_LABELS } from '../../lib/debtTypes'
import type { DebtInput } from '../../state/store'
import { localToday, validateDebt } from '../../state/validation'
import { DayField } from '../../ui/DayField'
import { springSettle } from '../../ui/motion'
import { PillGroup } from '../../ui/PillGroup'
import { SlabButton } from '../../ui/SlabButton'
import { formToInput, num, type DebtFormState } from './debtFormState'

const TYPE_OPTIONS = DEBT_TYPES.map((t) => ({ value: t, label: DEBT_TYPE_LABELS[t] }))
const RATE_OPTIONS = [
  { value: 'fixed', label: 'Fixed rate' },
  { value: 'floating', label: 'Floating rate' },
  { value: 'unknown', label: 'Not sure' },
] as const
const PURPOSE_OPTIONS = [
  { value: 'personal', label: 'Personal use' },
  { value: 'business', label: 'Business use' },
] as const

interface DebtFormProps {
  initial: DebtFormState
  submitLabel: string
  onSubmit: (input: DebtInput) => void
  /** Shown above the buttons, given the current valid input (05's payoff box). */
  info?: (input: DebtInput | undefined) => ReactNode
  /** Hide the warning under the payment field when `info` already says it. */
  hidePaymentWarning?: boolean
  /** Shown under the submit button. */
  footer?: ReactNode
}

/** The five quick-add fields, plus the loans-only box (docs/beta-spec.md screen 02). */
export function DebtForm({ initial, submitLabel, onSubmit, info, hidePaymentWarning, footer }: DebtFormProps) {
  const [f, setF] = useState(initial)
  const [tried, setTried] = useState(false)
  const set = <K extends keyof DebtFormState>(key: K, value: DebtFormState[K]) => setF((prev) => ({ ...prev, [key]: value }))

  const validation = validateDebt({
    balance: num(f.balance),
    apr: num(f.apr),
    monthlyPayment: num(f.monthlyPayment),
    sanctionedOn: isLoan(f.type) ? f.sanctionedOn || undefined : undefined,
  })
  const errors = tried ? validation.errors : {}
  const input = formToInput(f)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setTried(true)
    if (input) onSubmit(input)
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-1 flex-col gap-5">
      <PillGroup label="What kind of debt?" options={TYPE_OPTIONS} value={f.type} onChange={(v) => set('type', v)} />

      <DayField
        kind="text"
        label="Name"
        value={f.name}
        onChange={(v) => set('name', v)}
        placeholder={f.type === 'credit_card' ? 'e.g. HDFC Millennia card' : 'Optional'}
      />

      <DayField kind="rupees" label="How much do you owe?" hint="From your lender app or latest statement" error={errors.balance} value={f.balance} onChange={(v) => set('balance', v)} />

      <DayField
        kind="rate"
        label="Interest rate (% a year)"
        hint={f.type === 'credit_card' ? 'Cards are usually 36–45% a year. Check your statement.' : undefined}
        error={errors.apr}
        value={f.apr}
        onChange={(v) => set('apr', v)}
      />

      <DayField
        kind="rupees"
        label="What you pay each month"
        hint={!hidePaymentWarning && validation.warning
          ? <span className="font-semibold text-brick">{validation.warning}</span>
          : 'Your EMI, or what you usually pay on the card'}
        error={errors.monthlyPayment}
        value={f.monthlyPayment}
        onChange={(v) => set('monthlyPayment', v)}
      />

      {isLoan(f.type) && (
        <motion.section
          aria-label="Loans only"
          className="flex flex-col gap-5 rounded-3xl bg-white/60 p-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springSettle}
        >
          <p className="text-[13px] font-extrabold text-plum-muted">Loans only</p>
          <PillGroup label="Fixed or floating rate?" hideLabel options={RATE_OPTIONS} value={f.rateType} onChange={(v) => set('rateType', v)} />
          <DayField
            kind="date"
            label="Sanctioned or renewed on"
            hint="Needed for the charge check"
            error={errors.sanctionedOn}
            max={localToday()}
            value={f.sanctionedOn}
            onChange={(v) => set('sanctionedOn', v)}
          />
          <PillGroup label="Personal or business use?" options={PURPOSE_OPTIONS} value={f.purpose === 'unknown' ? undefined : f.purpose} onChange={(v) => set('purpose', v)} />
        </motion.section>
      )}

      {info?.(input)}

      <div className="mt-auto flex flex-col gap-3 pt-2">
        <SlabButton type="submit">{submitLabel}</SlabButton>
        {footer}
      </div>
    </form>
  )
}
