import { motion } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Sheet } from '../../components/Sheet'
import { monthlyInterest, summariseLedger } from '../../engine/ledger'
import { projectDebtFree } from '../../engine/payoff'
import { track } from '../../lib/analytics'
import { APP_NAME } from '../../lib/constants'
import { debtMeta } from '../../lib/debtTypes'
import { formatDuration, formatINR, formatRate, formatShare, monthYearAfter } from '../../lib/format'
import { useAppStore } from '../../state/store'
import { DayField } from '../../ui/DayField'
import { useEdges } from '../../ui/edges'
import { tap } from '../../ui/haptics'
import { MarigoldMark } from '../../ui/Marigold'
import { springPress, springSettle, STAGGER } from '../../ui/motion'
import { Odometer } from '../../ui/Odometer'
import { SlabButton } from '../../ui/SlabButton'
import { SmearIn } from '../../ui/SmearIn'
import { greeting, homeActions, type HomeAction } from './homeActions'

const MotionLink = motion.create(Link)

// The glance, in order (seconds): the greeting and total smear in, then the cards rise one by one.
const T = { total: 0.15, cards: 0.45 }

/** A card on the day half rising on its turn. */
function Rise({ i, children }: { i: number; children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springSettle, delay: T.cards + i * STAGGER }}>
      {children}
    </motion.div>
  )
}

/**
 * 12 Home: hello by name; where you stand (total, payments, interest, rate); when you'll be
 * debt-free; where this month's payment goes; the costliest debt; your top debts; to-dos.
 */
export function Home() {
  const debts = useAppStore((s) => s.debts)
  const profile = useAppStore((s) => s.profile)
  const setTakeHome = useAppStore((s) => s.setTakeHome)
  const [takeHomeOpen, setTakeHomeOpen] = useState(false)
  const [takeHome, setTakeHomeText] = useState('')
  // Read once when Home opens, so the greeting and dates don't change under the user.
  const [now] = useState(() => new Date())
  useEdges('home')

  const ledger = summariseLedger(debts, profile.takeHomeMonthly)
  const projection = projectDebtFree(debts)
  const costliest = ledger.sortedByCost[0]
  const firstCleared = ledger.sortedByCost.find((d) => d.id === projection.firstCleared?.debtId)
  const actions = homeActions(debts, profile)
  const total = formatINR(ledger.totalOwed)
  const count = ledger.sortedByCost.length

  const stats = [
    { label: 'Paid each month', value: formatINR(ledger.monthlyPayments) },
    { label: 'Interest this month', value: formatINR(ledger.interestThisMonth) },
    { label: 'Average rate', value: `${formatRate(Math.round(ledger.weightedApr * 10) / 10)}%` },
    ledger.shareOfTakeHome !== undefined
      ? { label: 'Of your take-home', value: formatShare(ledger.shareOfTakeHome) }
      : { label: 'Debts', value: String(count) },
  ]

  return (
    <div className="surface-day flex flex-1 flex-col text-aubergine">
      {/* The night band: hello, and where you stand at a glance. */}
      <section className="surface-night rounded-b-[32px] px-5 pt-3 pb-6 text-ice shadow-[0_18px_40px_-20px_rgb(34_8_30/0.7)]">
        <header className="flex h-11 items-center gap-2">
          <MarigoldMark />
          <span className="text-[15px] font-extrabold">{APP_NAME}</span>
        </header>
        <h1 className="mt-4 text-[30px] leading-[1.02] font-black tracking-[-0.035em]">
          {greeting(now.getHours())}
          {/* The space keeps "Good morning, Riya" one phrase for screen readers across the line break. */}
          {profile.name ? <>,{' '}<br /><span className="text-marigold">{profile.name}</span></> : null}
        </h1>
        <SmearIn ghost={total} delay={T.total} className="bloom mt-5 text-[40px] leading-none font-black tracking-[-0.045em]">
          <p className="whitespace-nowrap">
            <Odometer value={total} delay={T.total + 0.1} /> <span className="text-[22px] tracking-[-0.02em] text-mauve">owed</span>
          </p>
        </SmearIn>
        <p className="mt-2 text-[14px] text-mauve">Across {count} {count === 1 ? 'debt' : 'debts'}</p>
        <dl className="mt-5 grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-white/[0.07] px-4 py-3 ring-1 ring-white/10 backdrop-blur-sm">
              <dt className="text-[12px] text-mauve">{s.label}</dt>
              <dd className="mt-0.5 text-[20px] font-extrabold tracking-[-0.02em]">{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <main className="flex flex-1 flex-col gap-4 px-5 pt-5 pb-8">
        <Rise i={0}>
          <section aria-labelledby="debt-free" className="surface-night rounded-3xl p-5 text-ice shadow-slab">
            <h2 id="debt-free" className="eyebrow text-marigold">Debt-free</h2>
            {projection.months !== undefined ? (
              <>
                <p className="mt-1.5 text-[30px] leading-none font-black tracking-[-0.04em]">by {monthYearAfter(projection.months, now)}</p>
                <p className="mt-2 text-[14px] leading-snug text-mauve">
                  In about {formatDuration(projection.months)}, if you keep paying {formatINR(ledger.monthlyPayments)} a month
                  and each payment that frees up goes to the costliest debt left.
                </p>
              </>
            ) : (
              <>
                <p className="mt-1.5 text-[24px] leading-tight font-black tracking-[-0.03em]">Not at today’s payments</p>
                <p className="mt-2 text-[14px] leading-snug text-mauve">At least one debt grows faster than it’s paid. Open it on Debts to see which.</p>
              </>
            )}
            {firstCleared && projection.firstCleared && (
              <p className="mt-3 border-t border-white/10 pt-3 text-[14px] leading-snug">
                First to clear: <b>{firstCleared.name}</b>, in about {formatDuration(projection.firstCleared.months)}.
              </p>
            )}
          </section>
        </Rise>

        {costliest && (
          <Rise i={1}>
            {/* A fact, not a recommendation: whether extra money should go here depends on the
                comparison on Plan (an assumed return can beat a cheap loan). */}
            <section
              aria-labelledby="focus"
              className="rounded-3xl bg-marigold bg-linear-to-br from-marigold-light via-marigold to-[#DD9300] p-5 text-aubergine"
              style={{ boxShadow: 'var(--shadow-slab-marigold)' }}
            >
              <h2 id="focus" className="eyebrow">Costs you the most</h2>
              <p className="mt-1.5 text-[19px] leading-snug font-extrabold tracking-[-0.01em]">
                {costliest.name}, at {formatRate(costliest.apr)}%: about {formatINR(monthlyInterest(costliest))} in interest this month.
              </p>
              <Link to="/plan" onClick={() => tap()} className="mt-3 inline-flex min-h-11 items-center gap-2 text-[15px] font-extrabold underline underline-offset-4">
                See where extra money helps most
              </Link>
            </section>
          </Rise>
        )}

        <Rise i={2}>
          <section aria-labelledby="split" className="rounded-3xl bg-white p-5" style={{ boxShadow: '0 3px 0 0 var(--color-silver-line)' }}>
            <h2 id="split" className="eyebrow text-plum-muted">This month’s payments</h2>
            <p className="mt-1.5 text-[22px] leading-tight font-black tracking-[-0.03em]">
              {formatShare(ledger.interestShareOfPayments)} goes to interest
            </p>
            <div aria-hidden="true" className="mt-3 flex h-3 gap-[3px] overflow-hidden rounded-full">
              <motion.span
                className="rounded-l-full bg-linear-to-r from-marigold-light to-[#DD9300]"
                initial={{ width: 0 }}
                animate={{ width: `${ledger.interestShareOfPayments * 100}%` }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: T.cards + 2 * STAGGER + 0.2 }}
              />
              <span className="flex-1 rounded-r-full bg-aubergine" />
            </div>
            <dl className="mt-3 flex flex-col gap-1 text-[14px]">
              <div className="flex items-center gap-2">
                <span aria-hidden="true" className="size-2.5 rounded-full bg-marigold" />
                <dt className="flex-1 text-plum-muted">Interest</dt>
                <dd className="font-extrabold">{formatINR(ledger.interestThisMonth)}</dd>
              </div>
              <div className="flex items-center gap-2">
                <span aria-hidden="true" className="size-2.5 rounded-full bg-aubergine" />
                <dt className="flex-1 text-plum-muted">Pays down what you owe</dt>
                <dd className="font-extrabold">{formatINR(ledger.principalThisMonth)}</dd>
              </div>
            </dl>
          </section>
        </Rise>

        <Rise i={3}>
          <section aria-labelledby="your-debts" className="rounded-3xl bg-white p-5" style={{ boxShadow: '0 3px 0 0 var(--color-silver-line)' }}>
            <h2 id="your-debts" className="eyebrow text-plum-muted">Your debts, costliest first</h2>
            <ul className="mt-2 flex flex-col divide-y divide-silver-line">
              {ledger.sortedByCost.slice(0, 3).map((d) => (
                <li key={d.id}>
                  <Link to={`/debts/${d.id}`} onClick={() => tap()} className="flex min-h-12 items-center gap-3 py-2">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-bold">{d.name}</span>
                      <span className="block text-[13px] text-plum-muted">{debtMeta(d)}</span>
                    </span>
                    <span className="text-[15px] font-black tracking-[-0.02em] whitespace-nowrap">{formatINR(d.balance)}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link to="/debts" onClick={() => tap()} className="mt-1 inline-flex min-h-11 items-center text-[15px] font-extrabold underline underline-offset-4">
              {count > 3 ? `See all ${count} debts` : 'See your debts'}
            </Link>
          </section>
        </Rise>

        <section aria-labelledby="attention" className="mt-2 flex flex-col gap-3">
          <h2 id="attention" className="text-[17px] font-extrabold">Needs your attention</h2>
          <ul className="flex flex-col gap-3">
            {actions.map((a, i) => (
              <motion.li
                key={a.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springSettle, delay: T.cards + (4 + i) * STAGGER }}
              >
                <ActionSlab action={a} onTakeHome={() => setTakeHomeOpen(true)} />
              </motion.li>
            ))}
          </ul>
        </section>
      </main>

      <Sheet open={takeHomeOpen} title="Your take-home pay" onClose={() => setTakeHomeOpen(false)}>
        <DayField
          kind="rupees"
          label="Monthly take-home pay"
          hint="Shows what share of your income goes to debt. It stays on this phone."
          value={takeHome}
          onChange={setTakeHomeText}
        />
        <SlabButton
          surface="day"
          disabled={!Number(takeHome)}
          onClick={() => {
            setTakeHome(Number(takeHome))
            track('take_home_set')
            setTakeHomeOpen(false)
          }}
        >
          Save
        </SlabButton>
      </Sheet>
    </div>
  )
}

const ICONS: Record<string, string> = {
  take_home: 'M7 4h10M7 8.5h10M9 4c3.5 0 5 1.8 5 4.3S12.5 13 9 13H7l7 7',
  complete: 'M9 4h6v3H9zM6 6h12v15H6zM9.5 13.5l2 2 3.5-4',
  plan: 'M3 17l6-6 4 4 8-8M14 7h7v7',
}

/** A to-do as a raised white slab: a small aubergine disc with its icon, the title, why it matters. */
function ActionSlab({ action, onTakeHome }: { action: HomeAction; onTakeHome: () => void }) {
  const icon = action.kind === 'take_home' ? ICONS.take_home : action.to === '/plan' ? ICONS.plan : ICONS.complete
  const body = (
    <>
      <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-aubergine text-marigold">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={icon} />
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] leading-snug font-bold">{action.title}</span>
        <span className="block text-[13px] text-plum-muted">{action.detail}</span>
      </span>
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
        <path d="M9 6l6 6-6 6" />
      </svg>
    </>
  )
  const box = 'flex min-h-16 w-full items-center gap-3 rounded-3xl bg-white px-4 py-3 text-left'
  const shadow = { boxShadow: '0 3px 0 0 var(--color-silver-line)' }
  const pressed = { y: 3, boxShadow: '0 0 0 0 rgba(0,0,0,0)' }
  return action.kind === 'link'
    ? <MotionLink to={action.to} onClick={() => tap()} className={box} style={shadow} whileTap={pressed} transition={springPress}>{body}</MotionLink>
    : (
      <motion.button type="button" onClick={() => { tap(); onTakeHome() }} className={box} style={shadow} whileTap={pressed} transition={springPress}>
        {body}
      </motion.button>
    )
}
