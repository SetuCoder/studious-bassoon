import { useState } from 'react'
import { Button, ButtonLink } from '../../components/Button'
import { ActionRow, StatTile } from '../../components/Cards'
import { Field, RupeeInput } from '../../components/Field'
import { ScreenBody } from '../../components/Layout'
import { Sheet } from '../../components/Sheet'
import { TopBar } from '../../components/TopBar'
import { summariseLedger } from '../../engine/ledger'
import { formatINR, formatRate } from '../../lib/format'
import { useAppStore } from '../../state/store'
import { greeting, homeActions } from './homeActions'

/** 12 Home, M1 version: the total, one focus, and a short to-do list. */
export function Home() {
  const debts = useAppStore((s) => s.debts)
  const profile = useAppStore((s) => s.profile)
  const setTakeHome = useAppStore((s) => s.setTakeHome)
  const [takeHomeOpen, setTakeHomeOpen] = useState(false)
  const [takeHome, setTakeHomeText] = useState('')
  // Read once when Home opens, so the greeting doesn't change under the user.
  const [hour] = useState(() => new Date().getHours())

  const ledger = summariseLedger(debts, profile.takeHomeMonthly)
  const costliest = ledger.sortedByCost[0]
  const actions = homeActions(debts, profile)

  return (
    <>
      <TopBar title="Home" />
      <ScreenBody>
        <div>
          <p className="text-sm text-neutral-600">{greeting(hour)}</p>
          <p className="mt-1 text-3xl font-bold whitespace-nowrap text-neutral-900">{formatINR(ledger.totalOwed)} owed</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatTile label="Paid each month" value={formatINR(ledger.monthlyPayments)} />
          <StatTile label="Interest this month" value={formatINR(ledger.interestThisMonth)} />
        </div>

        {costliest && (
          <div className="rounded-[10px] bg-neutral-100 px-4 py-4">
            <p className="text-xs text-neutral-600">This month's focus</p>
            <p className="mt-1 font-semibold text-neutral-900">
              {costliest.name} costs the most at {formatRate(costliest.apr)}%. Any extra money should go there first.
            </p>
            <div className="mt-2">
              <ButtonLink to="/plan" variant="text">See your options</ButtonLink>
            </div>
          </div>
        )}

        <section aria-labelledby="attention" className="flex flex-col gap-2">
          <h2 id="attention" className="font-semibold text-neutral-900">Needs your attention</h2>
          <ul className="flex flex-col gap-2">
            {actions.map((a) => (
              <li key={a.title}>
                {a.kind === 'link'
                  ? <ActionRow title={a.title} detail={a.detail} to={a.to} />
                  : <ActionRow title={a.title} detail={a.detail} onClick={() => setTakeHomeOpen(true)} />}
              </li>
            ))}
          </ul>
        </section>
      </ScreenBody>

      <Sheet open={takeHomeOpen} title="Your take-home pay" onClose={() => setTakeHomeOpen(false)}>
        <Field label="Monthly take-home pay" hint="Shows what share of your income goes to debt. It stays on this phone.">
          {(p) => <RupeeInput {...p} value={takeHome} onChange={setTakeHomeText} />}
        </Field>
        <Button
          disabled={!Number(takeHome)}
          onClick={() => {
            setTakeHome(Number(takeHome))
            setTakeHomeOpen(false)
          }}
        >
          Save
        </Button>
      </Sheet>
    </>
  )
}
