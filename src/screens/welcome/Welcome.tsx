import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '../../components/Button'
import { InfoBox, Placeholder } from '../../components/Cards'
import { Sheet } from '../../components/Sheet'
import { APP_NAME } from '../../lib/constants'
import { useAppStore } from '../../state/store'

const STEPS = [
  { title: 'Add your debts', body: 'Five fields for each loan or card, about 30 seconds each.' },
  { title: 'See your plan', body: 'We compare what your next rupee could do over 36 months, with the working shown.' },
  { title: 'Check charges', body: "Before you close a loan, check the lender's quote against the RBI rule." },
]

/** 01 Welcome. First run only; no tab bar. */
export function Welcome() {
  const navigate = useNavigate()
  const startOnboarding = useAppStore((s) => s.startOnboarding)
  const [howOpen, setHowOpen] = useState(false)

  return (
    <main className="flex min-h-dvh flex-col gap-4 px-5 py-5">
      <Placeholder label={`Logo · ${APP_NAME}`} className="h-14" />
      <div className="flex flex-1 flex-col justify-center gap-4">
        <h1 className="text-[28px] leading-tight font-bold text-neutral-900">
          See everything you owe. Know what to do with your next rupee.
        </h1>
        <p className="text-neutral-600">
          Add your loans and cards in about two minutes. Get a ranked answer to where your next rupee should go, and check your loan charges.
        </p>
        <InfoBox>
          <p className="font-semibold">Private by design</p>
          <p className="mt-1">No bank login. No SMS access. Your numbers stay on this phone.</p>
        </InfoBox>
      </div>
      <div className="flex flex-col gap-3">
        <Button
          onClick={() => {
            startOnboarding()
            navigate('/debts')
          }}
        >
          Get started
        </Button>
        <Button variant="text" onClick={() => setHowOpen(true)}>How does it work?</Button>
        <p className="text-center text-xs text-neutral-500">Beta. Shows the cost of each option; not financial advice.</p>
      </div>
      <Sheet open={howOpen} title="How it works" onClose={() => setHowOpen(false)}>
        <ol className="flex flex-col gap-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-sm font-semibold text-white">{i + 1}</span>
              <div>
                <p className="font-semibold text-neutral-900">{s.title}</p>
                <p className="text-sm text-neutral-600">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <Button variant="secondary" onClick={() => setHowOpen(false)}>Got it</Button>
      </Sheet>
    </main>
  )
}
