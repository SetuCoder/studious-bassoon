import { motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Sheet } from '../../components/Sheet'
import { track } from '../../lib/analytics'
import { APP_NAME } from '../../lib/constants'
import { useAppStore } from '../../state/store'
import { Marigold, MarigoldMark } from '../../ui/Marigold'
import { springSettle, STAGGER } from '../../ui/motion'
import { SlabButton } from '../../ui/SlabButton'

const STEPS = [
  { title: 'Add your debts', body: 'Five fields for each loan or card, about 30 seconds each.' },
  { title: 'See your plan', body: 'We compare what your next rupee could do over 36 months, with the working shown.' },
  { title: 'Check charges', body: "Before you close a loan, check the lender's quote against the RBI rule." },
]

const EASE_OUT = [0.16, 1, 0.3, 1] as const

/** 01 Welcome: the poster from the inspiration board. First run only; no tab bar. */
export function Welcome() {
  const navigate = useNavigate()
  const startOnboarding = useAppStore((s) => s.startOnboarding)
  const [howOpen, setHowOpen] = useState(false)
  const reduce = useReducedMotion()

  const rise = (i: number) => ({
    initial: { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0 },
    transition: { ...springSettle, delay: 0.15 + i * STAGGER },
  })

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-silver px-5 pt-5 pb-6 text-aubergine">
      {/* The board's column rules. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid grid-cols-4">
        <div className="border-r border-silver-line" />
        <div className="border-r border-silver-line" />
        <div className="border-r border-silver-line" />
      </div>

      {/* The marigold streaks in from the left, like the lily on the board. */}
      <motion.div
        className="pointer-events-none absolute top-[120px] -right-[100px]"
        initial={reduce ? false : { opacity: 0, x: -120, filter: 'blur(18px)' }}
        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
        transition={{ duration: 1.1, ease: EASE_OUT, delay: 0.1 }}
      >
        <Marigold size={340} smear />
      </motion.div>

      <div className="relative flex items-center gap-2">
        <MarigoldMark />
        <span className="text-[15px] font-extrabold tracking-[-0.01em]">{APP_NAME}</span>
      </div>

      <div className="flex-1" />

      {/* Each line is its own block for the staggered rise; the spaces keep it one sentence for screen readers. */}
      <h1 className="relative font-black tracking-[-0.05em]">
        <motion.span {...rise(0)} className="block text-[54px] leading-[0.9]">See</motion.span>{' '}
        <motion.span {...rise(1)} className="block text-[54px] leading-[0.9]">everything</motion.span>{' '}
        <motion.span
          {...rise(2)}
          className="block text-[54px] leading-[0.9]"
          style={{ textShadow: '-10px 0 8px rgba(58,15,52,0.35), -24px 0 14px rgba(58,15,52,0.2), -40px 0 22px rgba(234,170,0,0.45)' }}
        >
          you owe.
        </motion.span>{' '}
        <motion.span {...rise(3)} className="mt-3 block text-[22px] leading-tight font-extrabold tracking-[-0.02em]">
          Know what to do with your next rupee.
        </motion.span>
      </h1>

      <motion.div {...rise(4)} className="relative mt-4 flex flex-col gap-3">
        <p className="text-[15px] leading-snug text-plum-muted">
          Add your loans and cards in about two minutes. Get a ranked answer to where your next rupee should go, and check your loan charges.
        </p>
        <div className="rounded-2xl bg-white/70 px-4 py-3">
          <p className="text-[14px] font-extrabold">Private by design</p>
          <p className="mt-0.5 text-[14px] leading-snug">No bank login. No SMS access. Your numbers stay on this phone.</p>
        </div>
      </motion.div>

      <motion.div {...rise(5)} className="relative mt-5 flex flex-col gap-1">
        <SlabButton
          onClick={() => {
            startOnboarding()
            track('onboarding_started')
            navigate('/debts')
          }}
        >
          <span className="flex w-full items-center justify-between">
            Get started
            <span aria-hidden="true" className="-mr-3 flex size-10 items-center justify-center rounded-full bg-aubergine text-marigold">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </span>
        </SlabButton>
        <button type="button" onClick={() => setHowOpen(true)} className="mx-auto min-h-11 px-3 text-[15px] font-bold underline underline-offset-4">
          How does it work?
        </button>
        <p className="text-center text-xs text-plum-muted">Beta. Shows the cost of each option; not financial advice.</p>
      </motion.div>

      <Sheet open={howOpen} title="How it works" onClose={() => setHowOpen(false)}>
        <ol className="flex flex-col gap-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-marigold text-[15px] font-black">{i + 1}</span>
              <div>
                <p className="text-[16px] font-extrabold">{s.title}</p>
                <p className="text-[14px] leading-snug text-plum-muted">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <SlabButton variant="line" onClick={() => setHowOpen(false)}>Got it</SlabButton>
      </Sheet>
    </main>
  )
}
