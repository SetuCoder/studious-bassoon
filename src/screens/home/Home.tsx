import { motion } from 'motion/react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Sheet } from '../../components/Sheet'
import { summariseLedger } from '../../engine/ledger'
import { formatINR, formatRate } from '../../lib/format'
import { useAppStore } from '../../state/store'
import { DayField } from '../../ui/DayField'
import { tap } from '../../ui/haptics'
import { MarigoldMark } from '../../ui/Marigold'
import { springPress, springSettle, STAGGER } from '../../ui/motion'
import { Odometer } from '../../ui/Odometer'
import { SlabButton } from '../../ui/SlabButton'
import { SmearIn } from '../../ui/SmearIn'
import { greeting, homeActions, type HomeAction } from './homeActions'

const MotionLink = motion.create(Link)

// The glance, in order (seconds): the total smears in, the focus card rises, the to-dos stack.
const T = { total: 0.1, focus: 0.45, todos: 0.65 }

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
  const total = formatINR(ledger.totalOwed)

  return (
    <div className="flex flex-1 flex-col bg-silver text-aubergine">
      {/* The night band: where you stand, at a glance. */}
      <section className="rounded-b-[32px] bg-aubergine px-5 pt-3 pb-6 text-ice">
        <header className="flex h-11 items-center gap-2">
          <MarigoldMark />
          <h1 className="text-lg font-bold">Home</h1>
        </header>
        <p className="mt-4 text-[14px] text-mauve">{greeting(hour)}</p>
        <SmearIn ghost={total} delay={T.total} className="mt-1 text-[40px] leading-none font-black tracking-[-0.045em]">
          <p className="whitespace-nowrap">
            <Odometer value={total} delay={T.total + 0.1} /> <span className="text-[24px] tracking-[-0.02em] text-mauve">owed</span>
          </p>
        </SmearIn>
        <dl className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-aubergine-raised px-4 py-3">
            <dt className="text-[12px] text-mauve">Paid each month</dt>
            <dd className="mt-0.5 text-[20px] font-extrabold tracking-[-0.02em]">{formatINR(ledger.monthlyPayments)}</dd>
          </div>
          <div className="rounded-2xl bg-aubergine-raised px-4 py-3">
            <dt className="text-[12px] text-mauve">Interest this month</dt>
            <dd className="mt-0.5 text-[20px] font-extrabold tracking-[-0.02em]">{formatINR(ledger.interestThisMonth)}</dd>
          </div>
        </dl>
      </section>

      <main className="flex flex-1 flex-col gap-5 px-5 pt-5 pb-8">
        {costliest && (
          // The one marigold surface on the screen: this month's focus.
          <motion.section
            aria-labelledby="focus"
            className="rounded-3xl bg-marigold p-5 text-aubergine"
            style={{ boxShadow: 'var(--shadow-slab-marigold)' }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springSettle, delay: T.focus }}
          >
            <h2 id="focus" className="text-[13px] font-extrabold">This month's focus</h2>
            <p className="mt-1.5 text-[19px] leading-snug font-extrabold tracking-[-0.01em]">
              {costliest.name} costs the most at {formatRate(costliest.apr)}%. Any extra money should go there first.
            </p>
            <Link to="/plan" onClick={() => tap()} className="mt-3 inline-flex min-h-11 items-center gap-2 text-[15px] font-extrabold underline underline-offset-4">
              See your options
            </Link>
          </motion.section>
        )}

        <section aria-labelledby="attention" className="flex flex-col gap-3">
          <h2 id="attention" className="text-[17px] font-extrabold">Needs your attention</h2>
          <ul className="flex flex-col gap-3">
            {actions.map((a, i) => (
              <motion.li
                key={a.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springSettle, delay: T.todos + i * STAGGER }}
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
  const shadow = { boxShadow: '0 3px 0 0 #C5CCD3' }
  const pressed = { y: 3, boxShadow: '0 0 0 0 rgba(0,0,0,0)' }
  return action.kind === 'link'
    ? <MotionLink to={action.to} onClick={() => tap()} className={box} style={shadow} whileTap={pressed} transition={springPress}>{body}</MotionLink>
    : (
      <motion.button type="button" onClick={() => { tap(); onTakeHome() }} className={box} style={shadow} whileTap={pressed} transition={springPress}>
        {body}
      </motion.button>
    )
}
