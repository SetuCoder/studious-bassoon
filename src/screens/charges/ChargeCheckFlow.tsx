import { useEffect, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Button, ButtonLink } from '../../components/Button'
import { InfoBox } from '../../components/Cards'
import { ChipGroup } from '../../components/Chip'
import { Field, RupeeInput, TextInput } from '../../components/Field'
import { ScreenBody } from '../../components/Layout'
import { OptionList } from '../../components/OptionList'
import { ProgressBar } from '../../components/ProgressBar'
import { TopBar } from '../../components/TopBar'
import type { ChargeKind, LenderType, Purpose, RateType, YesNoUnknown } from '../../engine/types'
import { CHARGE_KINDS, CHARGE_KIND_LABELS, LENDER_TYPE_LABELS } from '../../lib/chargeLabels'
import { debtMeta } from '../../lib/debtTypes'
import { formatDate } from '../../lib/format'
import { useAppStore } from '../../state/store'
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

/** 09 Charge check: five questions, one per screen, no tab bar. `?debt=<id>` picks the loan. */
export function ChargeCheckFlow() {
  const navigate = useNavigate()
  const location = useLocation()
  const debts = useAppStore((s) => s.debts)
  const saveChargeCheck = useAppStore((s) => s.saveChargeCheck)
  const loans = checkableLoans(debts)

  const [form, setForm] = useState<ChargeCheckForm>(() => {
    const wanted = new URLSearchParams(location.search).get('debt')
    const loan = loans.find((d) => d.id === wanted) ?? (loans.length === 1 ? loans[0] : undefined)
    const start: ChargeCheckForm = { lines: [newLine(1)] }
    return loan ? prefillFromDebt(start, loan) : start
  })
  const [step, setStep] = useState(1)
  const [nextKey, setNextKey] = useState(2)

  // Each question starts at the top, even after tapping Next at the bottom of a long one.
  useEffect(() => {
    document.scrollingElement?.scrollTo?.(0, 0)
  }, [step])

  const back = () => {
    if (step > 1) setStep(step - 1)
    else if (location.key !== 'default') navigate(-1)
    else navigate('/debts')
  }

  if (loans.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col">
        <TopBar title="Check a closing quote" onBack={back} />
        <ScreenBody>
          <InfoBox>The charge check is for loans. Add a loan to check its closing quote.</InfoBox>
          <ButtonLink to="/debts/new" variant="secondary">Add a loan</ButtonLink>
        </ScreenBody>
      </div>
    )
  }

  const set = (patch: Partial<ChargeCheckForm>) => setForm((f) => ({ ...f, ...patch }))
  const setLine = (key: number, patch: Partial<ChargeLineForm>) =>
    setForm((f) => ({ ...f, lines: f.lines.map((l) => (l.key === key ? { ...l, ...patch } : l)) }))
  const debt = loans.find((d) => d.id === form.debtId)

  const next = () => {
    if (step < STEPS) {
      setStep(step + 1)
      return
    }
    if (!debt) return
    const id = saveChargeCheck(buildChargeCheck(debt, form))
    navigate(`/charges/${id}`, { replace: true })
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar title="Check a closing quote" onBack={back} />
      <ScreenBody>
        <ProgressBar step={step} of={STEPS} />

        {step === 1 && (
          <Question title="Which loan is the quote for?" help="The charge check is for loans, not cards or BNPL.">
            <OptionList
              label="Which loan is the quote for?"
              options={loans.map((d) => ({ value: d.id, label: d.name, meta: debtMeta(d) }))}
              value={form.debtId}
              onChange={(id) => setForm((f) => prefillFromDebt(f, loans.find((d) => d.id === id)!))}
            />
          </Question>
        )}

        {step === 2 && (
          <Question title="Is this loan's interest rate fixed or floating?" help="It's on your sanction letter or loan statement.">
            <OptionList label="Fixed or floating?" options={RATE} value={form.rateType} onChange={(v) => set({ rateType: v })} />
            <InfoBox>
              <p className="font-semibold">Why we ask</p>
              <p className="mt-1">The RBI rule on prepayment charges only covers floating-rate loans.</p>
            </InfoBox>
          </Question>
        )}

        {step === 3 && (
          <Question
            title="Was it sanctioned or renewed on or after 1 January 2026?"
            help={debt?.sanctionedOn
              ? `Your debt details say ${formatDate(debt.sanctionedOn)}.`
              : "It's on your sanction letter, or on the latest renewal letter."}
          >
            <OptionList label="On or after 1 January 2026?" options={YES_NO} value={form.sanctionedOnOrAfter2026} onChange={(v) => set({ sanctionedOnOrAfter2026: v })} />
          </Question>
        )}

        {step === 4 && (
          <Question title="Is this loan for personal or business use?" help="The rule treats business loans differently.">
            <OptionList label="Personal or business use?" options={PURPOSE} value={form.purpose} onChange={(v) => set({ purpose: v })} />
            {form.purpose === 'business' && (
              <>
                <Field label="Who lent it?" hint="Your sanction letter names the lender. Not sure? Choose Not sure.">
                  {(p) => (
                    <select
                      id={p.id}
                      aria-describedby={p.describedBy}
                      value={form.lenderType ?? ''}
                      onChange={(e) => set({ lenderType: e.target.value as LenderType })}
                      className="h-12 rounded-[10px] border border-neutral-300 bg-white px-3 text-base"
                    >
                      <option value="" disabled>Choose the type of lender</option>
                      {LENDERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  )}
                </Field>
                <ChipGroup
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
                <li key={l.key} aria-label={`Charge ${i + 1}`} className="flex flex-col gap-3 rounded-[10px] border border-neutral-300 p-4">
                  <Field label="Type of charge">
                    {(p) => (
                      <select
                        id={p.id}
                        value={l.kind}
                        onChange={(e) => setLine(l.key, { kind: e.target.value as ChargeKind })}
                        className="h-12 rounded-[10px] border border-neutral-300 bg-white px-3 text-base"
                      >
                        {CHARGE_KINDS.map((k) => <option key={k} value={k}>{CHARGE_KIND_LABELS[k]}</option>)}
                      </select>
                    )}
                  </Field>
                  {l.kind === 'other' && (
                    <Field label="What the quote calls it">
                      {(p) => <TextInput {...p} value={l.name} onChange={(v) => setLine(l.key, { name: v })} placeholder="Optional" />}
                    </Field>
                  )}
                  <Field label="Amount">
                    {(p) => <RupeeInput {...p} value={l.amount} onChange={(v) => setLine(l.key, { amount: v })} />}
                  </Field>
                  {l.kind !== 'gst' && (
                    <ChipGroup
                      label="Is it listed in your sanction letter or Key Facts Statement?"
                      options={YES_NO}
                      value={l.disclosed}
                      onChange={(v) => setLine(l.key, { disclosed: v })}
                    />
                  )}
                  {form.lines.length > 1 && (
                    <Button variant="text" onClick={() => set({ lines: form.lines.filter((x) => x.key !== l.key) })}>
                      Remove this charge
                    </Button>
                  )}
                </li>
              ))}
            </ol>
            <Button
              variant="text"
              onClick={() => {
                const used = new Set(form.lines.map((x) => x.kind))
                set({ lines: [...form.lines, newLine(nextKey, CHARGE_KINDS.find((k) => !used.has(k)) ?? 'other')] })
                setNextKey(nextKey + 1)
              }}
            >
              + Add another charge
            </Button>
          </Question>
        )}

        <div className="mt-auto pt-2">
          <Button onClick={next} disabled={!stepIsAnswered(form, step)}>
            {step < STEPS ? 'Next' : 'Check the charges'}
          </Button>
        </div>
      </ScreenBody>
    </div>
  )
}

function Question({ title, help, children }: { title: string; help: string; children: ReactNode }) {
  return (
    <section aria-labelledby="question" className="flex flex-col gap-4">
      <div>
        <h2 id="question" className="text-2xl leading-tight font-bold text-neutral-900">{title}</h2>
        <p className="mt-2 text-sm text-neutral-600">{help}</p>
      </div>
      {children}
    </section>
  )
}
