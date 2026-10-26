import { motion } from 'motion/react'
import { useId, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { HORIZON_MONTHS, SAVINGS_RATE } from '../../engine/constants'
import { allocationRows, explainOption, optionName } from '../../engine/explain'
import { isActive, sortByCost } from '../../engine/ledger'
import type { SimulationResult } from '../../engine/simulate'
import type { EngineDebt } from '../../engine/types'
import { formatDelta, formatINR, formatRate } from '../../lib/format'
import { useAppStore } from '../../state/store'
import { ClearedStamp } from '../../ui/Celebrate'
import { Coin } from '../../ui/Coin'
import { springSettle, STAGGER } from '../../ui/motion'
import { NightScreen } from '../../ui/NightScreen'
import { Odometer } from '../../ui/Odometer'
import { SlabButton } from '../../ui/SlabButton'
import { SmearIn } from '../../ui/SmearIn'
import { useNextRupee } from './useNextRupee'

const EASE_OUT = [0.16, 1, 0.3, 1] as const

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
  const delta = formatDelta(option.delta)

  return (
    <NightScreen title={optionName(option.id, input.assumedReturn)} backTo="/plan/results">
      <div>
        <SmearIn ghost={delta} delay={0.1} className="text-[56px] leading-none font-black tracking-[-0.05em]">
          <Odometer value={delta} delay={0.2} />
        </SmearIn>
        <p className="mt-2 text-[15px] text-mauve">better off after {HORIZON_MONTHS} months than keeping it in savings</p>
      </div>

      <section aria-labelledby="where" className="flex flex-col gap-3">
        <h2 id="where" className="text-[17px] font-extrabold">Where the {formatINR(result.L)} goes</h2>
        <ul className="flex flex-col gap-3">
          {rows.map((r, i) => {
            const cleared = r.after <= 0.5
            const barStart = 0.45 + i * 0.18
            return (
              <motion.li
                key={r.debtId}
                className="rounded-3xl bg-aubergine-raised p-4 shadow-slab"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springSettle, delay: 0.2 + i * STAGGER }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[16px] font-bold">{r.name}</p>
                    <p className="text-[13px] text-mauve">{formatRate(r.apr)}% a year</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[18px] font-black tracking-[-0.03em] text-marigold">{formatINR(r.amount)}</span>
                    {cleared && <ClearedStamp delay={barStart + 0.75} />}
                  </div>
                </div>
                {/* The balance draining to what is left after the money goes in. */}
                <div aria-hidden="true" className="mt-3 h-2.5 overflow-hidden rounded-full bg-aubergine">
                  <motion.div
                    className="h-full rounded-full bg-mauve"
                    initial={{ width: '100%' }}
                    animate={{ width: `${(r.after / r.before) * 100}%` }}
                    transition={{ duration: 0.8, ease: EASE_OUT, delay: barStart }}
                  />
                </div>
                <p className="mt-1.5 text-[13px] text-mauve">{formatINR(r.before)} → {formatINR(r.after)}</p>
              </motion.li>
            )
          })}
          {option.invested > 0 && (
            <MoneyRow title="Invested" detail={`At your assumed ${input.assumedReturn}%, not guaranteed`} amount={option.invested} delay={0.2 + rows.length * STAGGER} />
          )}
          {option.kind === 'save' && (
            <MoneyRow title="Kept in savings" detail={`About ${SAVINGS_RATE}% a year`} amount={result.L} delay={0.2} />
          )}
        </ul>
      </section>

      <motion.section
        aria-labelledby="why"
        className="rounded-3xl bg-aubergine-deep p-5 text-[15px] leading-relaxed"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.9 }}
      >
        <h2 id="why" className="text-[17px] font-extrabold">Why this order</h2>
        {explainOption(debts, option, result.L, input.assumedReturn).map((p) => (
          <p key={p} className="mt-2">{p}</p>
        ))}
      </motion.section>

      <button
        type="button"
        aria-expanded={showWorking}
        aria-controls={workingId}
        onClick={() => setShowWorking((v) => !v)}
        className="mx-auto min-h-11 px-3 text-[15px] font-bold text-ice underline underline-offset-4"
      >
        {showWorking ? 'Hide the full working' : 'Show the full working'}
      </button>
      {showWorking && (
        <div id={workingId}>
          <Working debts={sortByCost(active)} simulation={option.simulation ?? result.base} />
        </div>
      )}

      <div className="mt-auto pt-2">
        <SlabButton onClick={() => navigate('/')}>Done</SlabButton>
      </div>
    </NightScreen>
  )
}

function MoneyRow({ title, detail, amount, delay }: { title: string; detail: string; amount: number; delay: number }) {
  return (
    <motion.li
      className="flex items-center gap-4 rounded-3xl bg-aubergine-raised p-4 shadow-slab"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springSettle, delay }}
    >
      <Coin pulse={amount} size={44} />
      <div className="min-w-0 flex-1">
        <p className="text-[16px] font-bold">{title}</p>
        <p className="text-[13px] text-mauve">{detail}</p>
      </div>
      <span className="text-[18px] font-black tracking-[-0.03em] text-marigold">{formatINR(amount)}</span>
    </motion.li>
  )
}

/** The month-by-month table: balance of each debt after that month's payments, and interest that month. */
function Working({ debts, simulation }: { debts: EngineDebt[]; simulation: SimulationResult }) {
  const captionId = useId()
  return (
    <div className="flex flex-col gap-2">
      <p id={captionId} className="text-[13px] text-mauve">
        Balance at the end of each month, after payments. Interest is for all debts that month. Scroll sideways for every debt.
      </p>
      <div className="overflow-x-auto rounded-2xl bg-aubergine-deep">
        <table aria-describedby={captionId} className="num w-full text-right text-xs whitespace-nowrap">
          <thead className="text-mauve">
            <tr>
              <th scope="col" className="sticky left-0 bg-aubergine-deep px-3 py-2.5 text-left font-semibold">Month</th>
              {debts.map((d) => <th key={d.id} scope="col" className="px-3 py-2.5 font-semibold">{d.name}</th>)}
              <th scope="col" className="px-3 py-2.5 font-semibold">Interest</th>
            </tr>
          </thead>
          <tbody>
            {simulation.months.map((m) => (
              <tr key={m.month} className="border-t border-aubergine-raised">
                <th scope="row" className="sticky left-0 bg-aubergine-deep px-3 py-1.5 text-left font-normal text-mauve">{m.month}</th>
                {debts.map((d) => {
                  const bal = m.balances[d.id] ?? 0
                  return <td key={d.id} className={`px-3 py-1.5 ${bal <= 0.5 ? 'text-mauve' : ''}`}>{formatINR(bal)}</td>
                })}
                <td className="px-3 py-1.5">{formatINR(m.interest)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
