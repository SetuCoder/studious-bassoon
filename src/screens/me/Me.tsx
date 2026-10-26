import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Sheet } from '../../components/Sheet'
import { forgetAnalyticsId, track } from '../../lib/analytics'
import { APP_NAME, FEEDBACK_FORM_URL } from '../../lib/constants'
import { useAppStore } from '../../state/store'
import { DayScreen } from '../../ui/DayScreen'
import { MarigoldMark } from '../../ui/Marigold'
import { PillGroup } from '../../ui/PillGroup'
import { SlabButton } from '../../ui/SlabButton'
import { Switch } from '../../ui/Switch'

const RECOMMEND = [
  { value: 'not_likely', label: 'Not likely' },
  { value: 'maybe', label: 'Maybe' },
  { value: 'very_likely', label: 'Very likely' },
] as const

/** 11 Me: feedback, data control and the disclaimer in one place. Works with or without debts. */
export function Me() {
  const navigate = useNavigate()
  const recommend = useAppStore((s) => s.feedback.recommend)
  const setRecommend = useAppStore((s) => s.setRecommend)
  const shareUsageCounts = useAppStore((s) => s.settings.shareUsageCounts)
  const setShareUsageCounts = useAppStore((s) => s.setShareUsageCounts)
  const deleteAllData = useAppStore((s) => s.deleteAllData)
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <DayScreen title="Me">
      <section aria-labelledby="feedback" className="flex flex-col gap-4">
        <h2 id="feedback" className="text-[30px] leading-[0.95] font-black tracking-[-0.03em]">Help us build this</h2>
        <p className="text-[15px] leading-snug text-plum-muted">You're one of our first 30 testers. Two minutes of feedback shapes what we build next.</p>
        {FEEDBACK_FORM_URL ? (
          <a
            href={FEEDBACK_FORM_URL}
            target="_blank"
            rel="noreferrer"
            onClick={() => track('feedback_form_opened')}
            className="flex h-14 items-center justify-center rounded-full bg-marigold text-[17px] font-extrabold"
            style={{ boxShadow: 'var(--shadow-slab-marigold)' }}
          >
            Open the 2-minute feedback form
          </a>
        ) : (
          <SlabButton surface="day" disabled>Feedback form coming soon</SlabButton>
        )}
        <PillGroup label="How likely are you to recommend this to a friend?" options={RECOMMEND} value={recommend}
          onChange={(answer) => {
            setRecommend(answer)
            track('recommend_answered', { answer })
          }}
        />
      </section>

      <section aria-labelledby="your-data" className="flex flex-col gap-4 rounded-3xl bg-white/60 p-5">
        <h2 id="your-data" className="text-[17px] font-extrabold">Your data</h2>
        <p className="text-[15px] leading-snug">Everything you entered is stored only on this phone. We can't see it.</p>
        <Switch
          label="Share anonymous usage counts"
          hint="Which screens and buttons get used. Never your amounts, rates or names."
          checked={shareUsageCounts}
          onChange={setShareUsageCounts}
        />
        <SlabButton variant="line" onClick={() => setConfirmOpen(true)}>Delete all my data</SlabButton>
      </section>

      <section aria-labelledby="about" className="flex flex-col gap-2">
        <h2 id="about" className="flex items-center gap-2 text-[17px] font-extrabold">
          <MarigoldMark size={20} />
          About
        </h2>
        <p className="text-[14px] text-plum-muted">{APP_NAME}</p>
        <p className="text-[14px] text-plum-muted">Beta 0.1. Shows the cost of each option. Not financial or legal advice.</p>
      </section>

      <Sheet open={confirmOpen} title="Delete all your data?" onClose={() => setConfirmOpen(false)}>
        <p className="text-[15px] leading-snug text-plum-muted">
          This removes every debt, plan and charge check from this phone. It can't be undone.
        </p>
        <SlabButton
          variant="ink"
          onClick={() => {
            track('data_deleted')
            deleteAllData()
            forgetAnalyticsId()
            navigate('/', { replace: true })
          }}
        >
          Delete everything
        </SlabButton>
        <SlabButton variant="line" onClick={() => setConfirmOpen(false)}>Keep my data</SlabButton>
      </Sheet>
    </DayScreen>
  )
}
