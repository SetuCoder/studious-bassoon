import { useState, type FormEvent, type ReactNode } from 'react'
import { Button } from '../../components/Button'
import { ChipGroup } from '../../components/Chip'
import { Field, RateInput, RupeeInput, TextInput } from '../../components/Field'
import { isLoan } from '../../engine/ledger'
import { DEBT_TYPES, DEBT_TYPE_LABELS } from '../../lib/debtTypes'
import type { DebtInput } from '../../state/store'
import { localToday, validateDebt } from '../../state/validation'
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
    <form noValidate onSubmit={submit} className="flex flex-1 flex-col gap-4">
      <ChipGroup label="What kind of debt?" options={TYPE_OPTIONS} value={f.type} onChange={(v) => set('type', v)} />

      <Field label="Name">
        {(p) => (
          <TextInput
            {...p}
            value={f.name}
            onChange={(v) => set('name', v)}
            placeholder={f.type === 'credit_card' ? 'e.g. HDFC Millennia card' : 'Optional'}
            autoComplete="off"
          />
        )}
      </Field>

      <Field label="How much do you owe?" hint="From your lender app or latest statement" error={errors.balance}>
        {(p) => <RupeeInput {...p} value={f.balance} onChange={(v) => set('balance', v)} />}
      </Field>

      <Field
        label="Interest rate (% a year)"
        hint={f.type === 'credit_card' ? 'Cards are usually 36–45% a year. Check your statement.' : undefined}
        error={errors.apr}
      >
        {(p) => <RateInput {...p} value={f.apr} onChange={(v) => set('apr', v)} />}
      </Field>

      <Field
        label="What you pay each month"
        hint={!hidePaymentWarning && validation.warning
          ? <span className="text-amber-800">{validation.warning}</span>
          : 'Your EMI, or what you usually pay on the card'}
        error={errors.monthlyPayment}
      >
        {(p) => <RupeeInput {...p} value={f.monthlyPayment} onChange={(v) => set('monthlyPayment', v)} />}
      </Field>

      {isLoan(f.type) && (
        <section aria-label="Loans only" className="flex flex-col gap-4 rounded-[10px] bg-neutral-100 p-4">
          <p className="text-xs font-medium text-neutral-600">Loans only</p>
          <ChipGroup label="Fixed or floating rate?" hideLabel options={RATE_OPTIONS} value={f.rateType} onChange={(v) => set('rateType', v)} />
          <Field label="Sanctioned or renewed on" hint="Needed for the charge check" error={errors.sanctionedOn}>
            {(p) => (
              <TextInput {...p} type="date" max={localToday()} value={f.sanctionedOn} onChange={(v) => set('sanctionedOn', v)} />
            )}
          </Field>
          <ChipGroup label="Personal or business use?" options={PURPOSE_OPTIONS} value={f.purpose === 'unknown' ? undefined : f.purpose} onChange={(v) => set('purpose', v)} />
        </section>
      )}

      {info?.(input)}

      <div className="mt-auto flex flex-col gap-3 pt-2">
        <Button type="submit">{submitLabel}</Button>
        {footer}
      </div>
    </form>
  )
}
