import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { Sheet } from '../../components/Sheet'
import { isActive } from '../../engine/ledger'
import { forgetAnalyticsId, track } from '../../lib/analytics'
import { APP_NAME, APP_VERSION } from '../../lib/constants'
import { useAppStore } from '../../state/store'
import { DaySelect } from '../../ui/DayField'
import { DayScreen } from '../../ui/DayScreen'
import { MarigoldMark } from '../../ui/Marigold'
import { SlabButton, SlabLink } from '../../ui/SlabButton'
import { Switch } from '../../ui/Switch'

type Currency = 'INR' | 'USD' | 'AED' | 'GBP'

// Rupees only for now: the maths and the RBI rules are Indian. The rest show what's coming.
const CURRENCIES = [
  ['INR', '₹ Indian rupee'],
  ['USD', '$ US dollar (soon)', true],
  ['AED', 'د.إ UAE dirham (soon)', true],
  ['GBP', '£ British pound (soon)', true],
] as const satisfies readonly (readonly [Currency, string, boolean?])[]

const LINKS = [
  { title: 'Bank accounts', detail: 'Balances and EMIs update on their own, through RBI’s Account Aggregator.' },
  { title: 'Credit report', detail: 'Every loan and card in your name, found for you.' },
  { title: 'Card and loan statements', detail: 'Forward a statement and we read it.' },
]

/** 11 Me: your account on this phone. Preferences, data control and the disclaimers. Works with or without debts. */
export function Me() {
  const navigate = useNavigate()
  const debtCount = useAppStore((s) => s.debts.filter(isActive).length)
  const checkCount = useAppStore((s) => s.chargeChecks.length)
  const settings = useAppStore((s) => s.settings)
  const setShareUsageCounts = useAppStore((s) => s.setShareUsageCounts)
  const setHaptics = useAppStore((s) => s.setHaptics)
  const setCalmMotion = useAppStore((s) => s.setCalmMotion)
  const deleteAllData = useAppStore((s) => s.deleteAllData)
  const resetTours = useAppStore((s) => s.resetTours)
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <DayScreen title="Your account">
      <section aria-label="This phone" className="surface-night rounded-[28px] p-5 text-ice shadow-slab">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15">
            <MarigoldMark size={26} />
          </span>
          <div>
            <p className="text-[19px] font-black tracking-[-0.02em]">Your {APP_NAME}</p>
            <p className="text-[13px] text-mauve">Saved on this phone. No sign-in needed.</p>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3">
          <Stat label="Debts tracked" value={debtCount} />
          <Stat label="Charge checks" value={checkCount} />
        </dl>
      </section>

      <Group id="linked" title="Linked accounts" note="Coming soon: no more typing your numbers in.">
        <ul className="flex flex-col divide-y divide-silver-line">
          {LINKS.map((l) => (
            <li key={l.title} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-bold">{l.title}</span>
                <span className="block text-[13px] leading-snug text-plum-muted">{l.detail}</span>
              </span>
              <span className="eyebrow mt-1 shrink-0 rounded-full bg-aubergine px-2.5 py-1 text-marigold">Soon</span>
            </li>
          ))}
        </ul>
      </Group>

      <Group id="preferences" title="Preferences">
        <DaySelect<Currency>
          label="Currency"
          hint="Rupees for now. Other currencies are on the way."
          value="INR"
          onChange={() => {}}
          options={CURRENCIES}
        />
        <Switch label="Vibrate on taps" hint="A light buzz on buttons, on phones that support it." checked={settings.haptics} onChange={setHaptics} />
        <Switch label="Calmer animations" hint="Fewer moving parts. Same as your phone's reduce-motion setting." checked={settings.calmMotion} onChange={setCalmMotion} />
      </Group>

      <Group id="help" title="Help">
        <SlabLink to="/how-it-works" state={{ from: 'me' }} variant="line">How it works</SlabLink>
        <SlabButton variant="line" surface="day" disabled={settings.toursSeen.length === 0} onClick={resetTours}>
          {settings.toursSeen.length === 0 ? 'The guide will show on each screen' : 'Show me around again'}
        </SlabButton>
      </Group>

      <Group id="your-data" title="Privacy and your data" note="Everything you enter stays on this phone. We can’t see it.">
        <Switch
          label="Share anonymous usage counts"
          hint="Which screens and buttons get used. Never your amounts, rates or names."
          checked={settings.shareUsageCounts}
          onChange={setShareUsageCounts}
        />
        <SlabButton variant="line" onClick={() => setConfirmOpen(true)}>Delete all my data</SlabButton>
      </Group>

      <section aria-labelledby="about" className="flex flex-col gap-1.5 px-1">
        <h2 id="about" className="flex items-center gap-2 text-[17px] font-extrabold">
          <MarigoldMark size={20} />
          About {APP_NAME}
        </h2>
        <p className="text-[14px] text-plum-muted">Version {APP_VERSION}</p>
        <p className="text-[14px] text-plum-muted">Shows the cost of each option. Not financial advice.</p>
        <p className="text-[14px] text-plum-muted">Charge checks are a guide to what to ask, not legal advice.</p>
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/[0.07] px-4 py-3 ring-1 ring-white/10">
      <dt className="text-[12px] text-mauve">{label}</dt>
      <dd className="mt-0.5 text-[22px] font-black tracking-[-0.02em]">{value}</dd>
    </div>
  )
}

/** A white card holding one group of settings, under a heading. */
function Group({ id, title, note, children }: { id: string; title: string; note?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4 rounded-[28px] bg-white/70 p-5 ring-1 ring-white" style={{ boxShadow: '0 3px 0 0 var(--color-silver-line)' }}>
      <div>
        <h2 id={id} className="text-[17px] font-extrabold">{title}</h2>
        {note && <p className="mt-0.5 text-[14px] leading-snug text-plum-muted">{note}</p>}
      </div>
      {children}
    </section>
  )
}
