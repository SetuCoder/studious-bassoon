import { AnimatePresence, motion } from 'motion/react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { isLoan } from '../../engine/ledger'
import type { DebtType } from '../../engine/types'
import { track } from '../../lib/analytics'
import { DEBT_TYPES, DEBT_TYPE_LABELS } from '../../lib/debtTypes'
import type { DebtInput } from '../../state/store'
import { localToday, validateDebt } from '../../state/validation'
import { DayField } from '../../ui/DayField'
import { springSettle } from '../../ui/motion'
import { PillGroup } from '../../ui/PillGroup'
import { SlabButton } from '../../ui/SlabButton'
import { asksPurpose, formToInput, formValues, type DebtFormState } from './debtFormState'

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

type Kind = 'card' | 'bnpl' | 'loan'

const DETAIL_FIELDS = ['originalAmount', 'monthsLeft', 'creditLimit', 'dueDay'] as const

/** The same four numbers, asked the way each kind of debt talks about them. */
const COPY: Record<Kind, { name: string; namePlaceholder: string; balance: string; balanceHint: string; payment: string; paymentHint: string }> = {
  card: {
    name: 'Card name',
    namePlaceholder: 'e.g. HDFC Millennia',
    balance: 'How much is on the card?',
    balanceHint: 'The total on your latest statement or card app',
    payment: 'What you usually pay each month',
    paymentHint: 'Paying only the minimum due? Enter that.',
  },
  bnpl: {
    name: 'App or store',
    namePlaceholder: 'e.g. Simpl, LazyPay, Amazon Pay Later',
    balance: 'How much is left to pay?',
    balanceHint: 'All the instalments still to come, added up',
    payment: 'Monthly instalment',
    paymentHint: 'What leaves your account each month for this',
  },
  loan: {
    name: 'Name',
    namePlaceholder: 'Optional',
    balance: 'How much is left on the loan?',
    balanceHint: 'Called “principal outstanding” in your lender’s app or statement',
    payment: 'Your EMI',
    paymentHint: 'The fixed amount you pay each month',
  },
}

/** What each kind of debt usually costs, under the rate field. A guide for typing, not a check. */
const RATE_HINTS: Partial<Record<DebtType, string>> = {
  credit_card: 'Cards are usually 36–45% a year. Statements often say 3–3.75% a month.',
  bnpl: 'Enter 0 if it’s interest-free.',
  home_loan: 'Home loans are usually 8–10% a year.',
  car_loan: 'Car loans are usually 9–11% a year.',
  personal_loan: 'Personal loans are usually 11–24% a year.',
  education_loan: 'Education loans are usually 8–13% a year.',
  gold_loan: 'Gold loans are usually 9–18% a year.',
}

function kindOf(type: DebtType): Kind {
  return type === 'credit_card' ? 'card' : type === 'bnpl' ? 'bnpl' : 'loan'
}

interface DebtFormProps {
  initial: DebtFormState
  submitLabel: string
  onSubmit: (input: DebtInput) => void
  /** Shown above the buttons, given the current valid input (05's payoff box). */
  info?: (input: DebtInput | undefined) => ReactNode
  /** Hide the warning under the payment field when `info` already says it. */
  hidePaymentWarning?: boolean
  /** Start with "More details" open (the edit screen). */
  detailsOpen?: boolean
  /** Shown under the submit button. */
  footer?: ReactNode
}

/**
 * The quick-add fields, worded for the kind of debt; the loan questions the charge check needs;
 * and optional details that unlock more on the debt's page (docs/beta-spec.md screen 02).
 */
export function DebtForm({ initial, submitLabel, onSubmit, info, hidePaymentWarning, detailsOpen, footer }: DebtFormProps) {
  const [f, setF] = useState(initial)
  const [tried, setTried] = useState(false)
  const hasDetails = [initial.lender, initial.originalAmount, initial.monthsLeft, initial.creditLimit, initial.dueDay].some(Boolean)
  const [moreOpen, setMoreOpen] = useState(detailsOpen || hasDetails)
  const set = <K extends keyof DebtFormState>(key: K, value: DebtFormState[K]) => setF((prev) => ({ ...prev, [key]: value }))

  const kind = kindOf(f.type)
  const copy = COPY[kind]
  const validation = validateDebt(formValues(f))
  const errors = tried ? validation.errors : {}
  const input = formToInput(f)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setTried(true)
    // A mistake in the optional details must be visible to be fixed.
    if (DETAIL_FIELDS.some((k) => validation.errors[k])) setMoreOpen(true)
    if (!input) return
    if (validation.warning) track('debt_payment_below_interest', { type: input.type })
    onSubmit(input)
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-1 flex-col gap-5">
      <PillGroup label="What kind of debt?" options={TYPE_OPTIONS} value={f.type} onChange={(v) => set('type', v)} />

      <DayField kind="text" label={copy.name} value={f.name} onChange={(v) => set('name', v)} placeholder={copy.namePlaceholder} />

      <DayField kind="rupees" label={copy.balance} hint={copy.balanceHint} error={errors.balance} value={f.balance} onChange={(v) => set('balance', v)} />

      <DayField
        kind="rate"
        label={kind === 'bnpl' ? 'Interest or fee rate (% a year)' : 'Interest rate (% a year)'}
        hint={RATE_HINTS[f.type]}
        error={errors.apr}
        value={f.apr}
        onChange={(v) => set('apr', v)}
      />

      <DayField
        kind="rupees"
        label={copy.payment}
        hint={!hidePaymentWarning && validation.warning
          ? <span className="font-semibold text-brick">{validation.warning}</span>
          : f.type === 'gold_loan' ? 'Paying only the interest each month? Enter that.' : copy.paymentHint}
        error={errors.monthlyPayment}
        value={f.monthlyPayment}
        onChange={(v) => set('monthlyPayment', v)}
      />

      {isLoan(f.type) && (
        <motion.section
          aria-label="About this loan"
          className="flex flex-col gap-5 rounded-3xl bg-white/60 p-4 ring-1 ring-white"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springSettle}
        >
          <div>
            <p className="text-[15px] font-extrabold">About this loan</p>
            <p className="text-[13px] text-plum-muted">Needed to check closing charges. All on your sanction letter.</p>
          </div>
          <PillGroup label="Fixed or floating rate?" hideLabel options={RATE_OPTIONS} value={f.rateType} onChange={(v) => set('rateType', v)} />
          <DayField
            kind="date"
            label="Sanctioned or renewed on"
            error={errors.sanctionedOn}
            max={localToday()}
            value={f.sanctionedOn}
            onChange={(v) => set('sanctionedOn', v)}
          />
          {asksPurpose(f.type) && (
            <PillGroup label="Personal or business use?" options={PURPOSE_OPTIONS} value={f.purpose === 'unknown' ? undefined : f.purpose} onChange={(v) => set('purpose', v)} />
          )}
        </motion.section>
      )}

      <section aria-label="More details" className="flex flex-col gap-4">
        <button
          type="button"
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen(!moreOpen)}
          className="flex min-h-11 items-center justify-between rounded-2xl px-1 text-left"
        >
          <span>
            <span className="block text-[15px] font-extrabold">More details <span className="font-semibold text-plum-muted">(optional)</span></span>
            <span className="block text-[13px] text-plum-muted">{MORE_NOTE[kind]}</span>
          </span>
          <motion.svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
            animate={{ rotate: moreOpen ? 180 : 0 }} transition={springSettle}>
            <path d="M6 9l6 6 6-6" />
          </motion.svg>
        </button>
        <AnimatePresence initial={false}>
          {moreOpen && (
            <motion.div
              className="flex flex-col gap-5"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={springSettle}
            >
              {kind === 'card' && (
                <>
                  <DayField kind="rupees" label="Credit limit" hint="Shows how much of the card you’re using" error={errors.creditLimit} value={f.creditLimit} onChange={(v) => set('creditLimit', v)} />
                  <DayField kind="count" label="Bill due on (day of the month)" hint="For example 5 for the 5th" error={errors.dueDay} value={f.dueDay} onChange={(v) => set('dueDay', v)} />
                </>
              )}
              {kind === 'bnpl' && (
                <DayField kind="count" label="Instalments left" error={errors.monthsLeft} value={f.monthsLeft} onChange={(v) => set('monthsLeft', v)} />
              )}
              {kind === 'loan' && (
                <>
                  <DayField kind="text" label="Lender" placeholder="e.g. SBI, HDFC Bank, Bajaj Finance" value={f.lender} onChange={(v) => set('lender', v)} />
                  <DayField
                    kind="rupees"
                    label="Amount you first borrowed"
                    hint="On your sanction letter. Shows how much you’ve repaid."
                    error={errors.originalAmount}
                    value={f.originalAmount}
                    onChange={(v) => set('originalAmount', v)}
                  />
                  <DayField kind="count" label="EMIs left" hint="From your lender’s app or statement" error={errors.monthsLeft} value={f.monthsLeft} onChange={(v) => set('monthsLeft', v)} />
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {info?.(input)}

      <div className="mt-auto flex flex-col gap-3 pt-2">
        <SlabButton type="submit">{submitLabel}</SlabButton>
        {footer}
      </div>
    </form>
  )
}

const MORE_NOTE: Record<Kind, string> = {
  card: 'Credit limit and due date',
  bnpl: 'Instalments left',
  loan: 'Lender, amount borrowed, EMIs left',
}
