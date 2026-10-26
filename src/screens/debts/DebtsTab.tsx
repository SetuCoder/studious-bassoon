import { useState } from 'react'
import { ButtonLink } from '../../components/Button'
import { DebtRow, Placeholder, StatTile } from '../../components/Cards'
import { Field, RupeeInput } from '../../components/Field'
import { ScreenBody } from '../../components/Layout'
import { TopBar } from '../../components/TopBar'
import { isActive, isLoan, summariseLedger } from '../../engine/ledger'
import { debtMeta } from '../../lib/debtTypes'
import { formatINR, formatShare } from '../../lib/format'
import { useAppStore } from '../../state/store'

/** Debts tab root: 03 when nothing is added yet, else 04. */
export function DebtsTab() {
  const hasDebts = useAppStore((s) => s.debts.some(isActive))
  return hasDebts ? <DebtsOverview /> : <DebtsEmpty />
}

/** 03 Debts, empty. */
function DebtsEmpty() {
  const saved = useAppStore((s) => s.profile.takeHomeMonthly)
  const setTakeHome = useAppStore((s) => s.setTakeHome)
  const [takeHome, setTakeHomeText] = useState(saved ? String(saved) : '')

  return (
    <>
      <TopBar title="Your debts" />
      <ScreenBody>
        <Placeholder label="Empty-state illustration" />
        <h2 className="text-2xl font-bold text-neutral-900">No debts added yet</h2>
        <p className="text-neutral-600">Add your first loan or card. It takes about 30 seconds, and nothing leaves your phone.</p>
        <Field label="Monthly take-home pay (optional)" hint="Shows what share of your income goes to debt">
          {(p) => (
            <RupeeInput
              {...p}
              value={takeHome}
              onChange={setTakeHomeText}
              onBlur={() => setTakeHome(takeHome ? Number(takeHome) : undefined)}
            />
          )}
        </Field>
        <div className="mt-auto pt-4">
          <ButtonLink to="/debts/new">Add your first debt</ButtonLink>
        </div>
      </ScreenBody>
    </>
  )
}

/** 04 Debts overview: the whole picture, most expensive first. */
function DebtsOverview() {
  const debts = useAppStore((s) => s.debts)
  const takeHome = useAppStore((s) => s.profile.takeHomeMonthly)
  const ledger = summariseLedger(debts, takeHome)
  const hasLoan = ledger.sortedByCost.some((d) => isLoan(d.type))

  return (
    <>
      <TopBar title="Your debts" />
      <ScreenBody>
        <div className="grid grid-cols-2 gap-3">
          <StatTile label="Total owed" value={formatINR(ledger.totalOwed)} />
          <StatTile label="Paid each month" value={formatINR(ledger.monthlyPayments)} />
          {ledger.shareOfTakeHome !== undefined && (
            <StatTile label="Share of take-home" value={formatShare(ledger.shareOfTakeHome)} />
          )}
          <StatTile label="Interest this month" value={formatINR(ledger.interestThisMonth)} />
        </div>

        <section aria-labelledby="costliest" className="flex flex-col gap-3">
          <div>
            <h2 id="costliest" className="font-semibold text-neutral-900">Most expensive first</h2>
            <p className="text-xs text-neutral-500">Sorted by interest rate</p>
          </div>
          <ul className="flex flex-col gap-2">
            {ledger.sortedByCost.map((d, i) => (
              <li key={d.id}>
                <DebtRow
                  name={d.name}
                  meta={i === 0 ? `${debtMeta(d)} · costs the most` : debtMeta(d)}
                  amount={formatINR(d.balance)}
                  to={`/debts/${d.id}`}
                />
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-col gap-3">
          <ButtonLink to="/plan">What should my next rupee do?</ButtonLink>
          {hasLoan && <ButtonLink to="/charges" variant="secondary">Check a closing quote</ButtonLink>}
          <ButtonLink to="/debts/new" variant="text">+ Add another debt</ButtonLink>
        </div>
      </ScreenBody>
    </>
  )
}
