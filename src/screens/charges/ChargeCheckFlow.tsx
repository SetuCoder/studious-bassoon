import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { isCovered, type CoverageResult } from '../../engine/rules'
import type { ChargeKind, LenderType, Purpose, RateType, YesNoUnknown } from '../../engine/types'
import { track, useTrackOnMount, type ChargeCheckEntry } from '../../lib/analytics'
import { CHARGE_KINDS, CHARGE_KIND_CHIPS, CHARGE_KIND_HELP, LENDER_TYPE_LABELS } from '../../lib/chargeLabels'
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
  buildChargeCheck, chargeSteps, checkableLoans, newLine, prefillFromDebt, stepIsAnswered,
  type ChargeCheckForm, type ChargeLineForm,
} from './chargeCheckState'

const RATE = [
  { value: 'floating', label: 'Floating' },
  { value: 'fixed', label: 'Fixed' },
  { value: 'unknown', label: 'Not sure' },
] as const satisfies readonly { value: RateType; label: string }[]

const WHEN = [
  { value: 'yes', label: 'In 2026 or later' },
  { value: 'no', label: 'Before 2026' },
  { value: 'unknown', label: 'Not sure' },
] as const satisfies readonly { value: YesNoUnknown; label: string }[]

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
const KIND_CHIPS = CHARGE_KINDS.map((k) => ({ value: k, label: CHARGE_KIND_CHIPS[k] }))

/**
 * 09 Charge check, no tab bar. A first check opens with what it is; then the loan (only when
 * there's a choice), the loan's details on one screen, and the charges. `?debt=<id>` picks the loan.
 */
export function ChargeCheckFlow() {
  const navigate = useNavigate()
  const location = useLocation()
  const debts = useAppStore((s) => s.debts)
  const firstCheck = useAppStore((s) => s.chargeChecks.length === 0)
  const saveChargeCheck = useAppStore((s) => s.saveChargeCheck)
  const loans = checkableLoans(debts)
  const reduce = useReducedMotion()

  const [form, setForm] = useState<ChargeCheckForm>(() => {
    const wanted = new URLSearchParams(location.search).get('debt')
    const loan = loans.find((d) => d.id === wanted) ?? (loans.length === 1 ? loans[0] : undefined)
    const start: ChargeCheckForm = { lines: [newLine(1)] }
    return loan ? prefillFromDebt(start, loan) : start
  })
  // Decided once, so picking a loan on its step doesn't remove that step from under the user.
  const [steps] = useState(() => chargeSteps({ firstCheck, loanChosen: form.debtId !== undefined }))
  const [at, setAt] = useState(0)
  // +1 when going forward, -1 back: the next screen slides in from that side.
  const [direction, setDirection] = useState(1)
  const [nextKey, setNextKey] = useState(2)
  const step = steps[at]

  // Opened from the overview's button, or from the Charges tab (no state).
  const entry = (location.state as { entry?: ChargeCheckEntry } | null)?.entry ?? 'tab'
  useTrackOnMount('charge_check_started', { entry })

  // Each screen starts at the top, even after tapping Next at the bottom of a long one.
  useEffect(() => {
    document.scrollingElement?.scrollTo?.(0, 0)
  }, [at])

  const back = () => {
    if (at > 0) {
      setDirection(-1)
      setAt(at - 1)
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
  const counted = steps.filter((s) => s !== 'intro')

  const next = () => {
    if (at < steps.length - 1) {
      setDirection(1)
      setAt(at + 1)
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
        {step !== 'intro' && <Progress step={counted.indexOf(step) + 1} of={counted.length} />}

        <motion.div
          key={step}
          className="flex flex-col gap-5"
          initial={reduce ? false : { opacity: 0, x: 40 * direction }}
          animate={{ opacity: 1, x: 0 }}
          transition={springSettle}
        >
          {step === 'intro' && <Intro />}

          {step === 'loan' && (
            <Question title="Which loan are you closing?" help="The check is for loans. Cards and pay-later don’t have closing charges.">
              <ChoiceList
                label="Which loan are you closing?"
                options={loans.map((d) => ({ value: d.id, label: d.name, meta: debtMeta(d) }))}
                value={form.debtId}
                onChange={(id) => setForm((f) => prefillFromDebt(f, loans.find((d) => d.id === id)!))}
              />
            </Question>
          )}

          {step === 'about' && (
            <Question
              title={`About your ${debt?.name ?? 'loan'}`}
              help="The RBI rule depends on these three things. We filled in what your debt details already say; check them."
            >
              <Ask
                label="Is its interest rate fixed or floating?"
                why="Floating means the rate moves when RBI’s rates move. The rule only covers floating-rate loans."
              >
                <PillGroup label="Is its interest rate fixed or floating?" hideLabel options={RATE} value={form.rateType} onChange={(v) => set({ rateType: v })} />
              </Ask>
              <Ask
                label="When did you take it, or last renew it?"
                why={debt?.sanctionedOn
                  ? `Your debt details say ${formatDate(debt.sanctionedOn)}. The rule covers loans from 1 January 2026.`
                  : 'The date is on your sanction letter. The rule covers loans from 1 January 2026.'}
              >
                <PillGroup label="When did you take it, or last renew it?" hideLabel options={WHEN} value={form.sanctionedOnOrAfter2026} onChange={(v) => set({ sanctionedOnOrAfter2026: v })} />
              </Ask>
              <Ask label="Is it for personal or business use?" why="Business loans are covered only by some lenders.">
                <PillGroup label="Is it for personal or business use?" hideLabel options={PURPOSE} value={form.purpose} onChange={(v) => set({ purpose: v })} />
                {form.purpose === 'business' && (
                  <div className="mt-2 flex flex-col gap-4">
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
                  </div>
                )}
              </Ask>
            </Question>
          )}

          {step === 'charges' && (
            <Question
              title="What charges are on the quote?"
              help="Copy each extra charge from the quote. Leave out what’s left of the loan itself and the interest: we only check the charges."
            >
              <ol className="flex flex-col gap-3">
                {form.lines.map((l, i) => (
                  <motion.li
                    key={l.key}
                    aria-label={`Charge ${i + 1}`}
                    className="flex flex-col gap-4 rounded-3xl bg-white/70 p-4 ring-1 ring-white"
                    initial={reduce || i === 0 ? false : { opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={springSettle}
                  >
                    <div className="flex flex-col gap-2">
                      <PillGroup<ChargeKind> label="Type of charge" options={KIND_CHIPS} value={l.kind} onChange={(v) => setLine(l.key, { kind: v })} />
                      <p className="text-[13px] leading-snug text-plum-muted">{CHARGE_KIND_HELP[l.kind]}</p>
                    </div>
                    {l.kind === 'other' && (
                      <DayField kind="text" label="What the quote calls it" placeholder="Optional" value={l.name} onChange={(v) => setLine(l.key, { name: v })} />
                    )}
                    <DayField kind="rupees" label="Amount" value={l.amount} onChange={(v) => setLine(l.key, { amount: v })} />
                    {l.kind !== 'gst' && (
                      <div className="flex flex-col gap-1.5">
                        <PillGroup
                          label="Is this charge written in your loan papers?"
                          options={YES_NO}
                          value={l.disclosed}
                          onChange={(v) => setLine(l.key, { disclosed: v })}
                        />
                        <p className="text-[13px] leading-snug text-plum-muted">
                          Look in your sanction letter or Key Facts Statement: the short summary you got when the loan started.
                        </p>
                      </div>
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
            {step === 'intro' ? 'Start the check' : step === 'charges' ? 'Check the charges' : 'Next'}
          </SlabButton>
        </div>
      </DayScreen>
    </div>
  )
}

const GETS = [
  { n: '1', text: 'A verdict on each charge: allowed, not allowed, or one to ask about' },
  { n: '2', text: 'How much may not be allowed, in rupees' },
  { n: '3', text: 'A polite message for your lender, ready to send yourself' },
]

/** First check only: what a closing quote is, what the check does, what you'll need. */
function Intro() {
  return (
    <section aria-labelledby="question" className="flex flex-col gap-5">
      <div>
        <p className="eyebrow text-plum-muted">Before you pay to close a loan</p>
        <h2 id="question" className="mt-2 text-[34px] leading-[0.98] font-black tracking-[-0.04em] text-balance">
          Make sure you’re not overcharged.
        </h2>
        <p className="mt-3 text-[16px] leading-snug">
          When you close a loan early, the lender sends a <b>closing quote</b>: what’s left to pay, plus some charges.
          Since 2026, RBI says many loans can’t charge you anything for closing early.
        </p>
      </div>

      <div className="surface-night rounded-[28px] p-5 text-ice shadow-slab">
        <p className="eyebrow text-marigold">What you get</p>
        <ol className="mt-3 flex flex-col gap-3">
          {GETS.map((g) => (
            <li key={g.n} className="flex items-start gap-3">
              <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-marigold text-[14px] font-black text-aubergine">{g.n}</span>
              <span className="text-[15px] leading-snug font-semibold">{g.text}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-col gap-1 rounded-3xl bg-white/70 p-4 ring-1 ring-white">
        <p className="text-[15px] font-extrabold">You’ll need the closing quote</p>
        <p className="text-[14px] leading-snug text-plum-muted">
          Lenders also call it a foreclosure letter or closure statement. Ask for it in the lender’s app, by email, or at the branch. It takes about two minutes after that.
        </p>
      </div>
    </section>
  )
}

/** "Step 2 of 3" over an aubergine bar that grows with each step. */
function Progress({ step, of }: { step: number; of: number }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[13px] font-semibold text-plum-muted">Step {step} of {of}</p>
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

/** One question on the loan screen: the question, a line on why it matters, then the answers. */
function Ask({ label, why, children }: { label: string; why: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-3xl bg-white/70 p-4 ring-1 ring-white">
      <p className="text-[16px] font-extrabold">{label}</p>
      <p className="-mt-1 text-[13px] leading-snug text-plum-muted">{why}</p>
      {children}
    </div>
  )
}
