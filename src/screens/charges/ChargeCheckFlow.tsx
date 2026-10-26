import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { isCovered, type CoverageResult } from '../../engine/rules'
import type { ChargeKind, LenderType, Purpose, RateType, YesNoUnknown } from '../../engine/types'
import { track, useTrackOnMount, type ChargeCheckEntry } from '../../lib/analytics'
import { CHARGE_KINDS, CHARGE_KIND_LABELS, LENDER_TYPE_LABELS } from '../../lib/chargeLabels'
import { debtMeta } from '../../lib/debtTypes'
import { formatDate } from '../../lib/format'
import { useAppStore } from '../../state/store'
import { ChoiceList } from '../../ui/ChoiceList'
import { DayField, DaySelect } from '../../ui/DayField'
import { DayScreen } from '../../ui/DayScreen'
import { springSettle } from '../../ui/motion'
import { PillGroup } from '../../ui/PillGroup'
import { SlabButton, SlabLink } from '../../ui/SlabButton'
import {
  buildChargeCheck, checkableLoans, newLine, prefillFromDebt, stepIsAnswered, type ChargeCheckForm, type ChargeLineForm,
} from './chargeCheckState'

const STEPS = 5

const RATE = [
  { value: 'floating', label: 'Floating' },
  { value: 'fixed', label: 'Fixed' },
  { value: 'unknown', label: 'Not sure' },
] as const satisfies readonly { value: RateType; label: string }[]

const YES_NO = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unknown', label: 'Not sure' },
] as const satisfies readonly { value: YesNoUnknown; label: string }[]

const PURPOSE = [
  { value: 'personal', label: 'Personal' },
  { value: 'business', label: 'Business' },
  { value: 'unknown', label: 'Not sure' },
] as const satisfies readonly { value: Purpose; label: string }[]

const LENDERS = Object.entries(LENDER_TYPE_LABELS) as [LenderType, string][]
const COVERED: Record<CoverageResult['coverage'], 'yes' | 'no' | 'unknown'> = { covered: 'yes', not_covered: 'no', unknown: 'unknown' }

const KINDS = CHARGE_KINDS.map((k) => [k, CHARGE_KIND_LABELS[k]] as const)

/** 09 Charge check: five questions, one per screen, no tab bar. `?debt=<id>` picks the loan. */
export function ChargeCheckFlow() {
  const navigate = useNavigate()
  const location = useLocation()
  const debts = useAppStore((s) => s.debts)
  const saveChargeCheck = useAppStore((s) => s.saveChargeCheck)
  const loans = checkableLoans(debts)
  const reduce = useReducedMotion()

  const [form, setForm] = useState<ChargeCheckForm>(() => {
    const wanted = new URLSearchParams(location.search).get('debt')
    const loan = loans.find((d) => d.id === wanted) ?? (loans.length === 1 ? loans[0] : undefined)
    const start: ChargeCheckForm = { lines: [newLine(1)] }
    return loan ? prefillFromDebt(start, loan) : start
  })
  const [step, setStep] = useState(1)
  // +1 when going forward, -1 back: the next question slides in from that side.
  const [direction, setDirection] = useState(1)
  const [nextKey, setNextKey] = useState(2)

  // Opened from the overview's button, or from the Charges tab (no state).
  const entry = (location.state as { entry?: ChargeCheckEntry } | null)?.entry ?? 'tab'
  useTrackOnMount('charge_check_started', { entry })

  // Each question starts at the top, even after tapping Next at the bottom of a long one.
  useEffect(() => {
    document.scrollingElement?.scrollTo?.(0, 0)
  }, [step])

  const back = () => {
    if (step > 1) {
      setDirection(-1)
      setStep(step - 1)
    } else if (location.key !== 'default') navigate(-1)
    else navigate('/debts')
  }

  if (loans.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col">
        <DayScreen title="Check a closing quote" onBack={back}>
          <p className="rounded-3xl bg-white/70 p-5 text-[16px] leading-snug">The charge check is for loans. Add a loan to check its closing quote.</p>
          <SlabLink to="/debts/new" variant="line">Add a loan</SlabLink>
        </DayScreen>
      </div>
    )
  }

  const set = (patch: Partial<ChargeCheckForm>) => setForm((f) => ({ ...f, ...patch }))
  const setLine = (key: number, patch: Partial<ChargeLineForm>) =>
    setForm((f) => ({ ...f, lines: f.lines.map((l) => (l.key === key ? { ...l, ...patch } : l)) }))
  const debt = loans.find((d) => d.id === form.debtId)

  const next = () => {
    if (step < STEPS) {
      setDirection(1)
      setStep(step + 1)
      return
    }
    if (!debt) return
    const check = buildChargeCheck(debt, form)
    const id = saveChargeCheck(check)
    track('charge_check_completed', {
      covered: COVERED[isCovered(check.answers).coverage],
      flag_count: check.results.filter((r) => r.status === 'doesnt_add_up').length,
      ask_count: check.results.filter((r) => r.status === 'ask_lender').length,
      line_count: check.lines.length,
    })
    navigate(`/charges/${id}`, { replace: true })
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <DayScreen title="Check a closing quote" onBack={back}>
        <Progress step={step} of={STEPS} />

        <motion.div
          key={step}
          className="flex flex-col gap-5"
          initial={reduce ? false : { opacity: 0, x: 40 * direction }}
          animate={{ opacity: 1, x: 0 }}
          transition={springSettle}
        >
          {step === 1 && (
            <Question title="Which loan is the quote for?" help="The charge check is for loans, not cards or BNPL.">
              <ChoiceList
                label="Which loan is the quote for?"
                options={loans.map((d) => ({ value: d.id, label: d.name, meta: debtMeta(d) }))}
                value={form.debtId}
                onChange={(id) => setForm((f) => prefillFromDebt(f, loans.find((d) => d.id === id)!))}
              />
            </Question>
          )}

          {step === 2 && (
            <Question title="Is this loan's interest rate fixed or floating?" help="It's on your sanction letter or loan statement.">
              <ChoiceList label="Fixed or floating?" options={RATE} value={form.rateType} onChange={(v) => set({ rateType: v })} />
              <div className="rounded-3xl bg-aubergine p-4 text-ice">
                <p className="text-[14px] font-extrabold text-marigold">Why we ask</p>
                <p className="mt-1 text-[15px] leading-snug">The RBI rule on prepayment charges only covers floating-rate loans.</p>
              </div>
            </Question>
          )}

          {step === 3 && (
            <Question
              title="Was it sanctioned or renewed on or after 1 January 2026?"
              help={debt?.sanctionedOn
                ? `Your debt details say ${formatDate(debt.sanctionedOn)}.`
                : "It's on your sanction letter, or on the latest renewal letter."}
            >
              <ChoiceList label="On or after 1 January 2026?" options={YES_NO} value={form.sanctionedOnOrAfter2026} onChange={(v) => set({ sanctionedOnOrAfter2026: v })} />
            </Question>
          )}

          {step === 4 && (
            <Question title="Is this loan for personal or business use?" help="The rule treats business loans differently.">
              <ChoiceList label="Personal or business use?" options={PURPOSE} value={form.purpose} onChange={(v) => set({ purpose: v })} />
              {form.purpose === 'business' && (
                <>
                  <DaySelect
                    label="Who lent it?"
                    hint="Your sanction letter names the lender. Not sure? Choose Not sure."
                    placeholder="Choose the type of lender"
                    value={form.lenderType ?? ''}
                    onChange={(v) => set({ lenderType: v })}
                    options={LENDERS}
                  />
                  <PillGroup
                    label="Was the sanctioned amount ₹50 lakh or less?"
                    options={YES_NO}
                    value={form.sanctionedAmountUpTo50L}
                    onChange={(v) => set({ sanctionedAmountUpTo50L: v })}
                  />
                </>
              )}
            </Question>
          )}

          {step === 5 && (
            <Question
              title="Which charges are on the quote?"
              help="Add each charge from the lender's closing quote. Leave out the principal and the interest."
            >
              <ol className="flex flex-col gap-3">
                {form.lines.map((l, i) => (
                  <motion.li
                    key={l.key}
                    aria-label={`Charge ${i + 1}`}
                    className="flex flex-col gap-4 rounded-3xl bg-white/60 p-4"
                    initial={reduce || i === 0 ? false : { opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={springSettle}
                  >
                    <DaySelect<ChargeKind> label="Type of charge" value={l.kind} onChange={(v) => setLine(l.key, { kind: v })} options={KINDS} />
                    {l.kind === 'other' && (
                      <DayField kind="text" label="What the quote calls it" placeholder="Optional" value={l.name} onChange={(v) => setLine(l.key, { name: v })} />
                    )}
                    <DayField kind="rupees" label="Amount" value={l.amount} onChange={(v) => setLine(l.key, { amount: v })} />
                    {l.kind !== 'gst' && (
                      <PillGroup
                        label="Is it listed in your sanction letter or Key Facts Statement?"
                        options={YES_NO}
                        value={l.disclosed}
                        onChange={(v) => setLine(l.key, { disclosed: v })}
                      />
                    )}
                    {form.lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => set({ lines: form.lines.filter((x) => x.key !== l.key) })}
                        className="mx-auto min-h-11 px-3 text-[14px] font-bold text-plum-muted underline underline-offset-4"
                      >
                        Remove this charge
                      </button>
                    )}
                  </motion.li>
                ))}
              </ol>
              <button
                type="button"
                onClick={() => {
                  const used = new Set(form.lines.map((x) => x.kind))
                  set({ lines: [...form.lines, newLine(nextKey, CHARGE_KINDS.find((k) => !used.has(k)) ?? 'other')] })
                  setNextKey(nextKey + 1)
                }}
                className="mx-auto min-h-11 px-3 text-[15px] font-bold underline underline-offset-4"
              >
                + Add another charge
              </button>
            </Question>
          )}
        </motion.div>

        <div className="mt-auto pt-2">
          <SlabButton surface="day" onClick={next} disabled={!stepIsAnswered(form, step)}>
            {step < STEPS ? 'Next' : 'Check the charges'}
          </SlabButton>
        </div>
      </DayScreen>
    </div>
  )
}

/** "Question 2 of 5" over an aubergine bar that grows with each step. */
function Progress({ step, of }: { step: number; of: number }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[13px] font-semibold text-plum-muted">Question {step} of {of}</p>
      <div role="progressbar" aria-label="Progress" aria-valuemin={1} aria-valuemax={of} aria-valuenow={step} className="h-2 rounded-full bg-white/70">
        <motion.div
          className="h-full rounded-full bg-aubergine"
          initial={false}
          animate={{ width: `${(step / of) * 100}%` }}
          transition={springSettle}
        />
      </div>
    </div>
  )
}

function Question({ title, help, children }: { title: string; help: string; children: ReactNode }) {
  return (
    <section aria-labelledby="question" className="flex flex-col gap-4">
      <div>
        <h2 id="question" className="text-[28px] leading-[1.02] font-black tracking-[-0.03em] text-balance">{title}</h2>
        <p className="mt-2 text-[15px] leading-snug text-plum-muted">{help}</p>
      </div>
      {children}
    </section>
  )
}
