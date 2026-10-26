import { Navigate } from 'react-router'
import { ButtonLink } from '../../components/Button'
import { ChipGroup } from '../../components/Chip'
import { InfoBox } from '../../components/Cards'
import { ScreenBody } from '../../components/Layout'
import { OptionCard } from '../../components/OptionCard'
import { TopBar } from '../../components/TopBar'
import { HORIZON_MONTHS, SAVINGS_RATE } from '../../engine/constants'
import { NOTHING_TO_PUT_TO_WORK, optionName, optionNote, topLabel } from '../../engine/explain'
import { formatDelta, formatINR } from '../../lib/format'
import { useAppStore } from '../../state/store'
import { useNextRupee } from './useNextRupee'

const WOULD_ACT = [
  { value: 'yes', label: 'Yes' },
  { value: 'maybe', label: 'Maybe' },
  { value: 'no', label: 'No' },
] as const

/** 07 Next rupee, results: ranked options with the gain over 36 months. */
export function Results() {
  const nextRupee = useNextRupee()
  const debts = useAppStore((s) => s.debts)
  const wouldAct = useAppStore((s) => s.feedback.wouldAct)
  const setWouldAct = useAppStore((s) => s.setWouldAct)

  if (!nextRupee) return <Navigate to="/plan" replace />
  const { input, result } = nextRupee
  const top = Math.max(0, result.options[0]?.delta ?? 0)

  return (
    <>
      <TopBar title="Your options" backTo="/plan" />
      <ScreenBody>
        {result.L <= 0 ? (
          <>
            <InfoBox>{NOTHING_TO_PUT_TO_WORK}</InfoBox>
            <ButtonLink to="/plan" variant="secondary">Change the amounts</ButtonLink>
          </>
        ) : (
          <>
            <p className="text-neutral-600">
              Over {HORIZON_MONTHS} months, compared with leaving {formatINR(result.L)} in savings at {SAVINGS_RATE}%:
            </p>
            <ol aria-label="Options, best first" className="flex flex-col gap-3">
              {result.options.map((o, i) => (
                <li key={o.id}>
                  <OptionCard
                    rank={i + 1}
                    name={optionName(o.id, input.assumedReturn)}
                    delta={formatDelta(o.delta)}
                    note={optionNote(debts, o)}
                    bar={top > 0 ? Math.max(0, o.delta) / top : 0}
                    best={i === 0 && o.delta > 0 ? topLabel(o) : undefined}
                    to={`/plan/results/${o.id}`}
                  />
                </li>
              ))}
            </ol>
            <div className="rounded-[10px] bg-neutral-100 p-4">
              <ChipGroup label="Would you act on this?" options={WOULD_ACT} value={wouldAct} onChange={setWouldAct} />
            </div>
          </>
        )}
        <p className="text-xs text-neutral-500">Shows the cost of each option. Not financial advice. Tax benefits are not included.</p>
      </ScreenBody>
    </>
  )
}
