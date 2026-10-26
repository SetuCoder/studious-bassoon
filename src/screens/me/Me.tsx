import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '../../components/Button'
import { buttonClass } from '../../components/buttonStyles'
import { ChipGroup } from '../../components/Chip'
import { ScreenBody } from '../../components/Layout'
import { Sheet } from '../../components/Sheet'
import { Switch } from '../../components/Switch'
import { TopBar } from '../../components/TopBar'
import { FEEDBACK_FORM_URL } from '../../lib/constants'
import { useAppStore } from '../../state/store'

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
    <>
      <TopBar title="Me" />
      <ScreenBody>
        <section aria-labelledby="feedback" className="flex flex-col gap-4">
          <h2 id="feedback" className="text-2xl font-bold text-neutral-900">Help us build this</h2>
          <p className="text-neutral-600">You're one of our first 30 testers. Two minutes of feedback shapes what we build next.</p>
          {FEEDBACK_FORM_URL ? (
            <a href={FEEDBACK_FORM_URL} target="_blank" rel="noreferrer" className={`${buttonClass('primary')} h-12`}>
              Open the 2-minute feedback form
            </a>
          ) : (
            <Button disabled>Feedback form coming soon</Button>
          )}
          <ChipGroup label="How likely are you to recommend this to a friend?" options={RECOMMEND} value={recommend} onChange={setRecommend} />
        </section>

        <hr className="border-neutral-200" />

        <section aria-labelledby="your-data" className="flex flex-col gap-3">
          <h2 id="your-data" className="font-semibold text-neutral-900">Your data</h2>
          <p className="text-sm text-neutral-700">Everything you entered is stored only on this phone. We can't see it.</p>
          <Switch
            label="Share anonymous usage counts"
            hint="Which screens and buttons get used. Never your amounts, rates or names."
            checked={shareUsageCounts}
            onChange={setShareUsageCounts}
          />
          <Button variant="secondary" onClick={() => setConfirmOpen(true)}>Delete all my data</Button>
        </section>

        <section aria-labelledby="about" className="flex flex-col gap-2">
          <h2 id="about" className="font-semibold text-neutral-900">About</h2>
          <p className="text-sm text-neutral-500">Beta 0.1. Shows the cost of each option. Not financial or legal advice.</p>
        </section>
      </ScreenBody>

      <Sheet open={confirmOpen} title="Delete all your data?" onClose={() => setConfirmOpen(false)}>
        <p className="text-sm text-neutral-700">
          This removes every debt, plan and charge check from this phone. It can't be undone.
        </p>
        <Button
          onClick={() => {
            deleteAllData()
            navigate('/', { replace: true })
          }}
        >
          Delete everything
        </Button>
        <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Keep my data</Button>
      </Sheet>
    </>
  )
}
