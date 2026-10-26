import { motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { Link } from 'react-router'
import { isActive, isLoan, summariseLedger } from '../../engine/ledger'
import { track, useTrackOnMount } from '../../lib/analytics'
import { debtMeta } from '../../lib/debtTypes'
import { formatINR, formatRate, formatShare } from '../../lib/format'
import { useAppStore } from '../../state/store'
import { DayField } from '../../ui/DayField'
import { DayScreen } from '../../ui/DayScreen'
import { tap } from '../../ui/haptics'
import { Marigold } from '../../ui/Marigold'
import { springPress, springSettle, STAGGER } from '../../ui/motion'
import { NightScreen } from '../../ui/NightScreen'
import { Odometer } from '../../ui/Odometer'
import { SlabLink } from '../../ui/SlabButton'
import { SmearIn } from '../../ui/SmearIn'

const MotionLink = motion.create(Link)

/** Debts tab root: 03 when nothing is added yet, else 04. */
export function DebtsTab() {
  const hasDebts = useAppStore((s) => s.debts.some(isActive))
  return hasDebts ? <DebtsOverview /> : <DebtsEmpty />
}

/** 03 Debts, empty: a marigold bud where the list will grow, and the optional take-home. */
function DebtsEmpty() {
  const saved = useAppStore((s) => s.profile.takeHomeMonthly)
  const setTakeHome = useAppStore((s) => s.setTakeHome)
  const [takeHome, setTakeHomeText] = useState(saved ? String(saved) : '')
  const reduce = useReducedMotion()

  return (
    <DayScreen title="Your debts">
      <motion.div
        className="flex justify-center py-4"
        initial={reduce ? false : { scale: 0.6, rotate: -40, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ ...springSettle, delay: 0.1 }}
      >
        <Marigold size={128} />
      </motion.div>
      <div>
        <h2 className="text-[30px] leading-[0.95] font-black tracking-[-0.025em]">No debts added yet</h2>
        <p className="mt-3 text-[15px] leading-snug text-plum-muted">
          Add your first loan or card. It takes about 30 seconds, and nothing leaves your phone.
        </p>
      </div>
      <DayField
        kind="rupees"
        label="Monthly take-home pay (optional)"
        hint="Shows what share of your income goes to debt"
        value={takeHome}
        onChange={setTakeHomeText}
        onBlur={() => {
          const rupees = takeHome ? Number(takeHome) : undefined
          if (rupees && rupees !== saved) track('take_home_set')
          setTakeHome(rupees)
        }}
      />
      <div className="mt-auto pt-4">
        <SlabLink to="/debts/new">Add your first debt</SlabLink>
      </div>
    </DayScreen>
  )
}

// The reveal on 04 (seconds): the total smears in, then the debts drop in, costliest first.
const T = { total: 0.1, stats: 0.45, slabs: 0.7 }

/** 04 Debts overview: the whole picture, most expensive first. */
function DebtsOverview() {
  const debts = useAppStore((s) => s.debts)
  const takeHome = useAppStore((s) => s.profile.takeHomeMonthly)
  const ledger = summariseLedger(debts, takeHome)
  useTrackOnMount('overview_viewed', { debt_count: ledger.sortedByCost.length })
  const hasLoan = ledger.sortedByCost.some((d) => isLoan(d.type))
  const costliest = ledger.sortedByCost[0]
  const maxApr = Math.max(...ledger.sortedByCost.map((d) => d.apr), 1)
  const total = formatINR(ledger.totalOwed)

  const stats = [
    { label: 'Paid each month', value: formatINR(ledger.monthlyPayments) },
    ...(ledger.shareOfTakeHome !== undefined ? [{ label: 'Share of take-home', value: formatShare(ledger.shareOfTakeHome) }] : []),
    { label: 'Interest this month', value: formatINR(ledger.interestThisMonth) },
  ]

  return (
    <NightScreen title="Your debts">
      <section aria-labelledby="total-owed">
        <p id="total-owed" className="text-[14px] text-mauve">Total owed</p>
        <SmearIn ghost={total} delay={T.total} className="mt-1 text-[48px] leading-none font-black tracking-[-0.05em]">
          <Odometer value={total} delay={T.total + 0.1} />
        </SmearIn>
        {costliest && (
          <p className="mt-3 text-[16px] leading-snug font-semibold">
            {costliest.name} costs the most, at {formatRate(costliest.apr)}% a year.
          </p>
        )}
      </section>

      <motion.dl
        className={`grid gap-3 rounded-3xl bg-aubergine-deep p-4 ${stats.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springSettle, delay: T.stats }}
      >
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="text-[12px] leading-tight text-mauve">{s.label}</dt>
            <dd className="mt-1 text-[18px] font-extrabold tracking-[-0.02em]">{s.value}</dd>
          </div>
        ))}
      </motion.dl>

      <section aria-labelledby="costliest" className="flex flex-col gap-3">
        <div>
          <h2 id="costliest" className="text-[17px] font-extrabold">Most expensive first</h2>
          <p className="text-[13px] text-mauve">Sorted by interest rate</p>
        </div>
        <ul className="flex flex-col gap-3">
          {ledger.sortedByCost.map((d, i) => {
            const top = i === 0
            return (
              <motion.li
                key={d.id}
                initial={{ opacity: 0, y: -28, rotate: i % 2 ? 1.5 : -1.5 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ ...springSettle, delay: T.slabs + i * STAGGER }}
              >
                <MotionLink
                  to={`/debts/${d.id}`}
                  onClick={() => tap()}
                  className={`block rounded-3xl px-4 py-3.5 ${top ? 'bg-ice text-aubergine' : 'bg-aubergine-raised shadow-slab'}`}
                  style={top ? { boxShadow: '0 5px 0 0 #9AA5AF' } : undefined}
                  whileTap={{ y: 5, boxShadow: '0 0 0 0 rgba(0,0,0,0)' }}
                  transition={springPress}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate text-[16px] font-bold">{d.name}</span>
                    <span className="text-[17px] font-black tracking-[-0.02em] whitespace-nowrap">{formatINR(d.balance)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <span className={`text-[13px] ${top ? 'text-plum-muted' : 'text-mauve'}`}>{debtMeta(d)}</span>
                    {top && <span className="rounded-full bg-marigold px-2.5 py-0.5 text-[12px] font-extrabold">Costs the most</span>}
                  </div>
                  {/* Heat: the rate as a share of the costliest rate. */}
                  <div aria-hidden="true" className={`mt-2.5 h-1 rounded-full ${top ? 'bg-silver' : 'bg-aubergine'}`}>
                    <motion.div
                      className={`h-full rounded-full ${top ? 'bg-marigold' : 'bg-mauve'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(d.apr / maxApr) * 100}%` }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: T.slabs + i * STAGGER + 0.15 }}
                    />
                  </div>
                </MotionLink>
              </motion.li>
            )
          })}
        </ul>
      </section>

      <div className="flex flex-col gap-3">
        <SlabLink to="/plan">What should my next rupee do?</SlabLink>
        {hasLoan && <SlabLink to="/charges" state={{ entry: 'overview' }} variant="outline">Check a closing quote</SlabLink>}
        <Link to="/debts/new" className="mx-auto flex min-h-11 items-center px-3 text-[15px] font-bold underline underline-offset-4">
          + Add another debt
        </Link>
      </div>
    </NightScreen>
  )
}
