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
import { Tour, type TourStep } from '../../ui/Tour'

const MotionLink = motion.create(Link)

const START_TOUR: TourStep[] = [
  { target: 'add-first-debt', title: 'Start here', body: 'Add a loan or card. Five fields, about 30 seconds each.' },
  { target: 'take-home', title: 'Your take-home, if you like', body: 'It shows what share of your income goes to debt. It stays on this phone.' },
  { target: 'tabbar', title: 'Everything else lives here', body: 'Home, Plan and Charges open up once you’ve added a debt. Me holds your data and feedback.' },
]

const OVERVIEW_TOUR: TourStep[] = [
  { target: 'total', title: 'Everything you owe', body: 'All your loans and cards, added up. It updates whenever you edit a debt.' },
  { target: 'costliest', title: 'The costliest one, on top', body: 'Sorted by interest rate. Tap any debt to edit it or see when it clears.' },
  { target: 'next-rupee', title: 'Got some extra money?', body: 'Ask what it should do. We compare every option by what it costs you.' },
  { target: 'charge-check', title: 'Closing a loan?', body: 'Check the lender’s quote against the RBI rule before you pay it.' },
  { target: 'add-debt', title: 'Add the rest', body: 'The more of your debts you add, the better the answer gets.' },
]

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
      <div data-tour="take-home">
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
      </div>
      <div className="mt-auto pt-4">
        <div data-tour="add-first-debt"><SlabLink to="/debts/new">Add your first debt</SlabLink></div>
      </div>
      <Tour id="start" steps={START_TOUR} delay={0.6} />
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
      <section aria-labelledby="total-owed" data-tour="total">
        <p id="total-owed" className="eyebrow text-mauve">Total owed</p>
        <SmearIn ghost={total} delay={T.total} className="bloom mt-1 text-[48px] leading-none font-black tracking-[-0.05em]">
          <Odometer value={total} delay={T.total + 0.1} />
        </SmearIn>
        {costliest && (
          <p className="mt-3 text-[16px] leading-snug font-semibold">
            {costliest.name} costs the most, at {formatRate(costliest.apr)}% a year.
          </p>
        )}
      </section>

      <motion.dl
        className={`grid gap-3 rounded-3xl bg-aubergine-deep/70 p-4 ring-1 ring-white/8 backdrop-blur-sm ${stats.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}
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
                data-tour={top ? 'costliest' : undefined}
                initial={{ opacity: 0, y: -28, rotate: i % 2 ? 1.5 : -1.5 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ ...springSettle, delay: T.slabs + i * STAGGER }}
              >
                <MotionLink
                  to={`/debts/${d.id}`}
                  onClick={() => tap()}
                  className={`block rounded-3xl px-4 py-3.5 ${top ? 'gloss-ice bg-ice text-aubergine' : 'bg-aubergine-raised bg-linear-to-b from-white/[0.06] to-transparent shadow-slab ring-1 ring-white/[0.06]'}`}
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
        <div data-tour="next-rupee"><SlabLink to="/plan">What should my next rupee do?</SlabLink></div>
        {hasLoan && <div data-tour="charge-check"><SlabLink to="/charges" state={{ entry: 'overview' }} variant="outline">Check a closing quote</SlabLink></div>}
        <Link to="/debts/new" data-tour="add-debt" className="mx-auto flex min-h-11 items-center px-3 text-[15px] font-bold underline underline-offset-4">
          + Add another debt
        </Link>
      </div>
      <Tour id="overview" steps={OVERVIEW_TOUR} delay={1.3} />
    </NightScreen>
  )
}
