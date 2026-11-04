import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { isActive } from '../../engine/ledger'
import { track, useTrackOnMount } from '../../lib/analytics'
import { useAppStore } from '../../state/store'
import { Stamp } from '../../ui/Celebrate'
import { springSettle, STAGGER } from '../../ui/motion'
import { NightScreen } from '../../ui/NightScreen'
import { Odometer } from '../../ui/Odometer'
import { SlabButton } from '../../ui/SlabButton'

// The sample borrower's real engine results (docs/reference/engine-fixtures.json), shown as examples.
const CHAPTERS = [
  {
    title: 'See everything you owe.',
    body: 'Every loan and card on one screen, the costliest first.',
    vignette: <Ledger />,
  },
  {
    title: 'Know what your next rupee should do.',
    body: 'Every option ranked by what it costs you, with the working shown.',
    vignette: <NextRupee />,
  },
  {
    title: 'Catch charges that don’t add up.',
    body: 'Check a closing quote against the RBI rule, and get a polite question for your lender.',
    vignette: <Charges />,
  },
] as const

/** 01a How it works: three chapters, each with a small live scene, then Get started. From Welcome or Me. */
export function HowItWorks() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: 'me' } | null)?.from === 'me' ? 'me' : 'welcome'
  const hasDebts = useAppStore((s) => s.debts.some(isActive))
  const startOnboarding = useAppStore((s) => s.startOnboarding)
  const reduce = useReducedMotion()
  const [page, setPage] = useState(0)
  const [direction, setDirection] = useState(1)
  useTrackOnMount('how_it_works_opened', { from })

  const last = page === CHAPTERS.length - 1
  const go = (to: number) => {
    if (to < 0 || to >= CHAPTERS.length) return
    setDirection(to > page ? 1 : -1)
    setPage(to)
  }
  const chapter = CHAPTERS[page]

  return (
    <div className="flex min-h-dvh flex-col">
      <NightScreen title="How it works" backTo={from === 'me' ? '/me' : '/welcome'}>
        <div className="flex gap-1.5" role="tablist" aria-label="Chapters">
          {CHAPTERS.map((c, i) => (
            <button
              key={c.title}
              type="button"
              role="tab"
              aria-selected={i === page}
              aria-label={`Chapter ${i + 1}`}
              onClick={() => go(i)}
              className="flex h-11 flex-1 items-center"
            >
              <span className="relative h-1.5 w-full overflow-hidden rounded-full bg-aubergine-raised">
                {/* Chapters read stay filled; the current one fills in. */}
                {i < page && <span className="absolute inset-0 rounded-full bg-marigold/70" />}
                {i === page && (
                  <motion.span
                    key={page}
                    className="absolute inset-y-0 left-0 rounded-full bg-marigold"
                    initial={reduce ? false : { width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}
              </span>
            </button>
          ))}
        </div>

        <div className="relative flex-1">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.section
              key={page}
              aria-labelledby="chapter-title"
              className="flex h-full flex-col gap-5"
              custom={direction}
              initial={reduce ? false : { opacity: 0, x: 48 * direction }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: -48 * direction }}
              transition={springSettle}
              drag={reduce ? false : 'x'}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.25}
              onDragEnd={(_, info) => {
                if (info.offset.x < -60) go(page + 1)
                else if (info.offset.x > 60) go(page - 1)
              }}
            >
              <div>
                <p className="text-[15px] font-extrabold text-marigold">0{page + 1}</p>
                <h2 id="chapter-title" className="mt-1 text-[38px] leading-[0.95] font-black tracking-[-0.045em] text-balance">{chapter.title}</h2>
                <p className="mt-3 text-[16px] leading-snug text-mauve">{chapter.body}</p>
              </div>
              <div className="flex flex-col gap-2">
                {chapter.vignette}
                <p className="text-center text-[12px] text-mauve">Example numbers</p>
              </div>
            </motion.section>
          </AnimatePresence>
        </div>

        <div className="flex flex-col gap-3">
          {last && (
            <p className="text-center text-[14px] leading-snug text-mauve">
              No bank login. No SMS access. Nothing leaves your phone. We’ll point things out as you go.
            </p>
          )}
          {!last ? (
            <SlabButton onClick={() => go(page + 1)}>Next</SlabButton>
          ) : hasDebts ? (
            <SlabButton onClick={() => navigate(from === 'me' ? '/me' : '/')}>Back to the app</SlabButton>
          ) : (
            <SlabButton
              onClick={() => {
                startOnboarding()
                track('onboarding_started')
                navigate('/debts')
              }}
            >
              Get started
            </SlabButton>
          )}
        </div>
      </NightScreen>
    </div>
  )
}

/** A small slab like the overview's, dropping in on its turn. */
function MiniSlab({ i, top, children }: { i: number; top?: boolean; children: ReactNode }) {
  return (
    <motion.div
      className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 ${top ? 'bg-ice text-aubergine' : 'bg-aubergine-raised shadow-slab'}`}
      style={top ? { boxShadow: '0 4px 0 0 #9AA5AF' } : undefined}
      initial={{ opacity: 0, y: -24, rotate: i % 2 ? 1.5 : -1.5 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ ...springSettle, delay: 0.35 + i * STAGGER }}
    >
      {children}
    </motion.div>
  )
}

function Ledger() {
  return (
    <div className="flex flex-col gap-3 rounded-3xl bg-aubergine-deep p-4">
      <div>
        <p className="text-[13px] text-mauve">Total owed</p>
        <p className="text-[34px] leading-none font-black tracking-[-0.05em]"><Odometer value="₹45,55,000" delay={0.15} /></p>
      </div>
      <MiniSlab i={0} top>
        <span className="text-[15px] font-bold">Credit card</span>
        <span className="flex items-center gap-2">
          <span className="rounded-full bg-marigold px-2 py-0.5 text-[11px] font-extrabold">Costs the most</span>
          <span className="text-[14px] font-black">42%</span>
        </span>
      </MiniSlab>
      <MiniSlab i={1}>
        <span className="text-[15px] font-bold">Personal loan</span>
        <span className="text-[14px] font-black">13%</span>
      </MiniSlab>
      <MiniSlab i={2}>
        <span className="text-[15px] font-bold">Home loan</span>
        <span className="text-[14px] font-black">8.75%</span>
      </MiniSlab>
    </div>
  )
}

const SPLIT = [
  { name: 'Credit card 1', share: 85000 / 120000, cleared: true },
  { name: 'Credit card 2', share: 22000 / 120000, cleared: true },
  { name: 'Pay later', share: 13000 / 120000, cleared: false },
]

function NextRupee() {
  return (
    <div className="rounded-3xl bg-ice p-5 text-aubergine" style={{ boxShadow: '0 5px 0 0 #9AA5AF' }}>
      <p className="inline-flex rounded-full bg-marigold px-2.5 py-0.5 text-xs font-extrabold">Saves the most</p>
      <p className="mt-2 text-[16px] font-bold">Highest rate first</p>
      <p className="mt-1 text-[42px] leading-none font-black tracking-[-0.05em]"><Odometer value="+₹55,728" delay={0.3} /></p>
      <p className="mt-2 text-[13px] text-plum-muted">Over 36 months, compared with keeping ₹1,20,000 in savings</p>
      <div aria-hidden="true" className="mt-3 flex h-3 gap-[3px] overflow-hidden rounded-full">
        {SPLIT.map((s, i) => (
          <motion.span
            key={s.name}
            className={s.cleared ? 'bg-aubergine' : 'bg-marigold'}
            initial={{ width: 0 }}
            animate={{ width: `${s.share * 100}%` }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.5 + i * 0.12 }}
          />
        ))}
      </div>
      <p className="mt-2 text-[13px]">Clears both cards and part of pay later</p>
    </div>
  )
}

function Charges() {
  return (
    <div className="flex flex-col gap-3 rounded-3xl bg-aubergine-deep p-4">
      <div>
        <p className="text-[13px] text-mauve">Personal loan, closing quote</p>
        <p className="text-[38px] leading-none font-black tracking-[-0.05em] text-marigold"><Odometer value="₹9,204" delay={0.15} /></p>
        <p className="mt-1 text-[14px] font-semibold">of charges may not be allowed</p>
      </div>
      <div className="rounded-2xl bg-aubergine-raised px-4 py-3 shadow-slab">
        <div className="flex items-baseline justify-between">
          <span className="text-[15px] font-bold">Foreclosure charge</span>
          <span className="text-[15px] font-black">₹6,300</span>
        </div>
        <div className="mt-2"><Stamp tone="solid" delay={0.7}>Doesn't add up</Stamp></div>
      </div>
      <div className="rounded-2xl bg-aubergine-raised px-4 py-3 shadow-slab">
        <div className="flex items-baseline justify-between">
          <span className="text-[15px] font-bold">Admin fee</span>
          <span className="text-[15px] font-black">₹750</span>
        </div>
        <div className="mt-2"><Stamp tone="ice" delay={1.05}>Ask the lender</Stamp></div>
      </div>
    </div>
  )
}
