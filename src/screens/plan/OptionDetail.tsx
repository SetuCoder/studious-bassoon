import { useId, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { Button } from '../../components/Button'
import { DebtRow, InfoBox } from '../../components/Cards'
import { ScreenBody } from '../../components/Layout'
import { TopBar } from '../../components/TopBar'
import { HORIZON_MONTHS, SAVINGS_RATE } from '../../engine/constants'
import { allocationRows, explainOption, optionName } from '../../engine/explain'
import { isActive, sortByCost } from '../../engine/ledger'
import type { SimulationResult } from '../../engine/simulate'
import type { EngineDebt } from '../../engine/types'
import { formatDelta, formatINR, formatRate } from '../../lib/format'
import { useAppStore } from '../../state/store'
import { useNextRupee } from './useNextRupee'

/** 08 Option detail: where the money goes, why, and the month-by-month working. */
export function OptionDetail() {
  const { optionId } = useParams()
  const navigate = useNavigate()
  const nextRupee = useNextRupee()
  const debts = useAppStore((s) => s.debts)
  const [showWorking, setShowWorking] = useState(false)
  const workingId = useId()

  if (!nextRupee) return <Navigate to="/plan" replace />
  const { input, result } = nextRupee
  const option = result.options.find((o) => o.id === optionId)
  if (!option) return <Navigate to="/plan/results" replace />

  const active = debts.filter(isActive)
  const rows = allocationRows(active, option.allocation)

  return (
    <>
      <TopBar title={optionName(option.id, input.assumedReturn)} backTo="/plan/results" />
      <ScreenBody>
        <div>
          <p className="text-4xl font-bold whitespace-nowrap text-neutral-900">{formatDelta(option.delta)}</p>
          <p className="mt-1 text-sm text-neutral-600">better off after {HORIZON_MONTHS} months than keeping it in savings</p>
        </div>

        <section aria-labelledby="where" className="flex flex-col gap-2">
          <h2 id="where" className="font-semibold text-neutral-900">Where the {formatINR(result.L)} goes</h2>
          <ul className="flex flex-col gap-2">
            {rows.map((r) => (
              <li key={r.debtId}>
                <DebtRow
                  name={r.name}
                  meta={`${formatRate(r.apr)}% · ${formatINR(r.before)} → ${formatINR(r.after)}`}
                  amount={formatINR(r.amount)}
                  to={`/debts/${r.debtId}`}
                />
              </li>
            ))}
            {option.invested > 0 && (
              <li>
                <DebtRow name="Invested" meta={`At your assumed ${input.assumedReturn}%, not guaranteed`} amount={formatINR(option.invested)} />
              </li>
            )}
            {option.kind === 'save' && (
              <li>
                <DebtRow name="Kept in savings" meta={`About ${SAVINGS_RATE}% a year`} amount={formatINR(result.L)} />
              </li>
            )}
          </ul>
        </section>

        <InfoBox>
          <h2 className="font-semibold">Why this order</h2>
          {explainOption(debts, option, result.L, input.assumedReturn).map((p) => (
            <p key={p} className="mt-2">{p}</p>
          ))}
        </InfoBox>

        <Button variant="text" aria-expanded={showWorking} aria-controls={workingId} onClick={() => setShowWorking((v) => !v)}>
          {showWorking ? 'Hide the full working' : 'Show the full working'}
        </Button>
        {showWorking && (
          <div id={workingId}>
            <Working debts={sortByCost(active)} simulation={option.simulation ?? result.base} />
          </div>
        )}

        <div className="mt-auto pt-2">
          <Button onClick={() => navigate('/')}>Done</Button>
        </div>
      </ScreenBody>
    </>
  )
}

/** The month-by-month table: balance of each debt after that month's payments, and interest that month. */
function Working({ debts, simulation }: { debts: EngineDebt[]; simulation: SimulationResult }) {
  const captionId = useId()
  return (
    <div className="flex flex-col gap-2">
      {/* Outside the scrolling box so it never gets cut off at 360 px. */}
      <p id={captionId} className="text-xs text-neutral-600">
        Balance at the end of each month, after payments. Interest is for all debts that month. Scroll sideways for every debt.
      </p>
      <div className="overflow-x-auto rounded-[10px] border border-neutral-300">
      <table aria-describedby={captionId} className="w-full text-right text-xs whitespace-nowrap">
        <thead className="bg-neutral-100 text-neutral-700">
          <tr>
            <th scope="col" className="sticky left-0 bg-neutral-100 px-3 py-2 text-left">Month</th>
            {debts.map((d) => <th key={d.id} scope="col" className="px-3 py-2">{d.name}</th>)}
            <th scope="col" className="px-3 py-2">Interest</th>
          </tr>
        </thead>
        <tbody>
          {simulation.months.map((m) => (
            <tr key={m.month} className="border-t border-neutral-200">
              <th scope="row" className="sticky left-0 bg-white px-3 py-1.5 text-left font-normal">{m.month}</th>
              {debts.map((d) => <td key={d.id} className="px-3 py-1.5">{formatINR(m.balances[d.id] ?? 0)}</td>)}
              <td className="px-3 py-1.5">{formatINR(m.interest)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}
