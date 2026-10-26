import { motion } from 'motion/react'
import { Link, Navigate } from 'react-router'
import { HORIZON_MONTHS, SAVINGS_RATE } from '../../engine/constants'
import { NOTHING_TO_PUT_TO_WORK, allocationRows, optionName, optionNote, topLabel } from '../../engine/explain'
import { isActive } from '../../engine/ledger'
import type { NextRupeeOption } from '../../engine/options'
import type { EngineDebt } from '../../engine/types'
import { track } from '../../lib/analytics'
import { formatDelta, formatINR } from '../../lib/format'
import { useAppStore } from '../../state/store'
import { tap } from '../../ui/haptics'
import { springPress, springSettle, STAGGER } from '../../ui/motion'
import { NightScreen } from '../../ui/NightScreen'
import { Odometer } from '../../ui/Odometer'
import { SlabLink } from '../../ui/SlabButton'
import { SmearIn } from '../../ui/SmearIn'
import { useNextRupee } from './useNextRupee'

const MotionLink = motion.create(Link)

const WOULD_ACT = [
  { value: 'yes', label: 'Yes' },
  { value: 'maybe', label: 'Maybe' },
  { value: 'no', label: 'No' },
] as const

// The reveal, in order (seconds): the hero slab rises, the money pours into the debts,
// the gain smears in and its digits roll, then the other options stack up underneath.
const T = { hero: 0.1, strip: 0.35, figure: 0.55, others: 1.0 }

/** 07 Next rupee, results: the ranked options, revealed as a short ritual. */
export function Results() {
  const nextRupee = useNextRupee()
  const debts = useAppStore((s) => s.debts)
  const wouldAct = useAppStore((s) => s.feedback.wouldAct)
  const setWouldAct = useAppStore((s) => s.setWouldAct)

  if (!nextRupee) return <Navigate to="/plan" replace />
  const { input, result } = nextRupee
  const [best, ...rest] = result.options
  const top = Math.max(0, best?.delta ?? 0)

  return (
    <NightScreen title="Your options" backTo="/plan">
      {result.L <= 0 ? (
        <>
          <p className="rounded-3xl bg-aubergine-raised p-5 text-[15px]">{NOTHING_TO_PUT_TO_WORK}</p>
          <SlabLink to="/plan" variant="outline">Change the amounts</SlabLink>
        </>
      ) : (
        <>
          <motion.p
            className="text-[15px] leading-snug text-mauve"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            Over {HORIZON_MONTHS} months, compared with leaving {formatINR(result.L)} in savings at {SAVINGS_RATE}%:
          </motion.p>

          <ol aria-label="Options, best first" className="flex flex-col gap-3">
            <li>
              <HeroOption option={best} debts={debts} assumedReturn={input.assumedReturn} L={result.L} />
            </li>
            {rest.map((o, i) => (
              <motion.li
                key={o.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springSettle, delay: T.others + i * STAGGER }}
              >
                <OptionSlab rank={i + 2} option={o} debts={debts} assumedReturn={input.assumedReturn} share={top > 0 ? Math.max(0, o.delta) / top : 0} />
              </motion.li>
            ))}
          </ol>

          <motion.section
            aria-labelledby="would-act"
            className="flex flex-col gap-3 rounded-3xl bg-aubergine-raised p-4 shadow-slab"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springSettle, delay: T.others + rest.length * STAGGER }}
          >
            <h2 id="would-act" className="text-[17px] font-extrabold">Would you act on this?</h2>
            <div role="radiogroup" aria-labelledby="would-act" className="flex gap-2">
              {WOULD_ACT.map((a) => {
                const on = wouldAct === a.value
                return (
                  <motion.button
                    key={a.value}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => {
                      tap()
                      setWouldAct(a.value)
                      track('would_act_answered', { answer: a.value, top_option_id: best.id })
                    }}
                    whileTap={{ scale: 0.94 }}
                    transition={springPress}
                    className={`h-11 flex-1 rounded-full text-[15px] font-bold ${on ? 'bg-marigold text-aubergine' : 'bg-aubergine text-ice'}`}
                  >
                    {a.label}
                  </motion.button>
                )
              })}
            </div>
          </motion.section>
        </>
      )}
      <p className="text-xs leading-relaxed text-mauve">Shows the cost of each option. Not financial advice. Tax benefits are not included.</p>
    </NightScreen>
  )
}

interface HeroProps {
  option: NextRupeeOption
  debts: readonly EngineDebt[]
  assumedReturn: number
  L: number
}

/** The top option as the screen's answer: a raised slab with the money flowing into debts. */
function HeroOption({ option, debts, assumedReturn, L }: HeroProps) {
  const rows = allocationRows(debts.filter(isActive), option.allocation)
  const delta = formatDelta(option.delta)
  const best = option.delta > 0

  return (
    <MotionLink
      to={`/plan/results/${option.id}`}
      onClick={() => {
        tap()
        track('option_opened', { option_id: option.id, rank: 1 })
      }}
      className="block rounded-[28px] bg-ice p-5 text-aubergine"
      style={{ boxShadow: '0 6px 0 0 #9AA5AF' }}
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileTap={{ y: 6, boxShadow: '0 0 0 0 rgba(0,0,0,0)' }}
      transition={{ ...springSettle, delay: T.hero }}
    >
      {best && <p className="inline-flex rounded-full bg-marigold px-2.5 py-0.5 text-xs font-extrabold">{topLabel(option)}</p>}
      <p className="mt-2 text-lg font-bold">{optionName(option.id, assumedReturn)}</p>
      <SmearIn ghost={delta} delay={T.figure} className="mt-1 text-[52px] leading-none font-black tracking-[-0.05em]">
        <Odometer value={delta} delay={T.figure + 0.1} />
      </SmearIn>
      <p className="mt-2 text-[14px] leading-snug text-plum-muted">{optionNote(debts, option)}</p>

      {rows.length > 0 && (
        <div className="mt-4">
          <p className="text-[13px] font-semibold text-plum-muted">Where the {formatINR(L)} goes</p>
          <div aria-hidden="true" className="mt-2 flex h-3.5 gap-[3px] overflow-hidden rounded-full">
            {rows.map((r, i) => (
              <motion.span
                key={r.debtId}
                className={r.after <= 0.5 ? 'bg-aubergine' : 'bg-marigold'}
                initial={{ width: 0 }}
                animate={{ width: `${(r.amount / L) * 100}%` }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: T.strip + i * 0.12 }}
              />
            ))}
          </div>
          <ul className="mt-2 flex flex-col gap-0.5 text-[13px]">
            {rows.map((r) => (
              <li key={r.debtId} className="flex justify-between gap-3">
                <span className="flex items-center gap-2">
                  <span aria-hidden="true" className={`size-2 rounded-full ${r.after <= 0.5 ? 'bg-aubergine' : 'bg-marigold'}`} />
                  {r.name}{r.after <= 0.5 ? ', cleared' : ', part'}
                </span>
                <span className="font-bold">{formatINR(r.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </MotionLink>
  )
}

interface SlabProps {
  rank: number
  option: NextRupeeOption
  debts: readonly EngineDebt[]
  assumedReturn: number
  /** 0 to 1: this gain as a share of the top gain. */
  share: number
}

function OptionSlab({ rank, option, debts, assumedReturn, share }: SlabProps) {
  const delta = formatDelta(option.delta)
  return (
    <MotionLink
      to={`/plan/results/${option.id}`}
      onClick={() => {
        tap()
        track('option_opened', { option_id: option.id, rank })
      }}
      className="block rounded-3xl bg-aubergine-raised px-4 py-3.5 shadow-slab"
      whileTap={{ y: 5, boxShadow: '0 0 0 0 rgba(0,0,0,0)' }}
      transition={springPress}
    >
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-aubergine text-[13px] font-bold text-mauve">{rank}</span>
        <span className="min-w-0 flex-1 text-[16px] font-bold">{optionName(option.id, assumedReturn)}</span>
        <span className={`text-[19px] font-black tracking-[-0.03em] ${option.delta > 0.5 ? 'text-ice' : 'text-mauve'}`}>
          <Odometer value={delta} delay={T.others + rank * STAGGER} />
        </span>
      </div>
      <div aria-hidden="true" className="mt-2.5 ml-10 h-1 rounded-full bg-aubergine">
        <motion.div
          className="h-full rounded-full bg-mauve"
          initial={{ width: 0 }}
          animate={{ width: `${Math.round(share * 100)}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: T.others + rank * STAGGER + 0.1 }}
        />
      </div>
      <p className="mt-2 ml-10 text-[13px] leading-snug text-mauve">{optionNote(debts, option)}</p>
    </MotionLink>
  )
}
