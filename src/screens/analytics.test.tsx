import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { rankOptions } from '../engine/options'
import { SAMPLE_DEBTS } from '../engine/testDebts'
import { appStore } from '../state/store'
import { DEFAULT_NEXT_RUPEE } from './plan/useNextRupee'

// The M1 events from docs/analytics.md, sent from the real screens through the real wrapper.
const posthog = vi.hoisted(() => ({ init: vi.fn(), capture: vi.fn(), reset: vi.fn() }))
vi.mock('posthog-js', () => ({ default: posthog }))

type User = ReturnType<typeof userEvent.setup>
const ids: Record<string, string> = {}

function renderAt(path: string) {
  const user = userEvent.setup()
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
  return user
}

const sent = () => posthog.capture.mock.calls.map(([event, props]) => [event, props])

/** Waits for the event to go out (PostHog loads asynchronously) and returns its properties. */
async function expectSent(event: string, props?: Record<string, unknown>) {
  await waitFor(() => expect(sent().map(([e]) => e)).toContain(event))
  const found = sent().find(([e]) => e === event)![1]
  if (props) expect(found).toEqual(props)
  return found
}

function loadSampleDebts() {
  for (const d of SAMPLE_DEBTS) ids[d.id] = appStore.getState().addDebt(d)
}

beforeAll(() => {
  vi.stubEnv('VITE_POSTHOG_KEY', 'phc_test')
})

afterAll(() => {
  vi.unstubAllEnvs()
})

beforeEach(() => {
  act(() => appStore.getState().deleteAllData())
  posthog.capture.mockClear()
  posthog.reset.mockClear()
})

describe('first run', () => {
  it('sends onboarding, take-home, debt added and overview, without the amounts', async () => {
    const user = renderAt('/')
    await user.click(screen.getByRole('button', { name: 'Get started' }))
    await expectSent('onboarding_started', {})

    await user.type(screen.getByLabelText('Monthly take-home pay (optional)'), '145000')
    await user.click(screen.getByRole('link', { name: 'Add your first debt' }))
    await expectSent('take_home_set', {})

    await user.type(screen.getByLabelText('Name'), 'HDFC Millennia card')
    await user.type(screen.getByLabelText('How much do you owe?'), '85000')
    await user.type(screen.getByLabelText('Interest rate (% a year)'), '42')
    await user.type(screen.getByLabelText('What you pay each month'), '6000')
    await user.click(screen.getByRole('button', { name: 'Save debt' }))

    await expectSent('debt_added', { type: 'credit_card', has_rate_type: false, has_sanction_date: false, debt_count: 1 })
    await expectSent('overview_viewed', { debt_count: 1 })
    expect(sent().map(([e]) => e)).not.toContain('debt_payment_below_interest')

    // Nothing the user typed went out.
    const everything = JSON.stringify(sent())
    for (const typed of ['HDFC', '85000', '145000', '6000', '42']) expect(everything).not.toContain(typed)
  })

  it('counts a debt saved while its payment is below the interest', async () => {
    const user = renderAt('/debts/new')
    await user.type(screen.getByLabelText('How much do you owe?'), '85000')
    await user.type(screen.getByLabelText('Interest rate (% a year)'), '42')
    await user.type(screen.getByLabelText('What you pay each month'), '500')
    await user.click(screen.getByRole('button', { name: 'Save debt' }))
    await expectSent('debt_payment_below_interest', { type: 'credit_card' })
  })

  it('counts taps on the statement-upload fake door', async () => {
    const user = renderAt('/debts/new')
    await user.click(screen.getByRole('button', { name: 'Upload a statement instead' }))
    await expectSent('upload_fake_door_tapped', { screen: 'add_debt' })
  })
})

describe('next rupee', () => {
  beforeEach(() => act(loadSampleDebts))

  it('sends the comparison, the option opened, the working and the would-act answer', async () => {
    const { options } = rankOptions(appStore.getState().debts, DEFAULT_NEXT_RUPEE)
    const user = renderAt('/plan')
    await user.click(screen.getByRole('button', { name: 'Compare options' }))
    await expectSent('next_rupee_compared', { option_count: options.length, split_shown: options.some((o) => o.id === 'split') })

    await user.click(screen.getByRole('radio', { name: 'Yes' }))
    await expectSent('would_act_answered', { answer: 'yes', top_option_id: options[0].id })

    const list = screen.getByRole('list', { name: 'Options, best first' })
    await user.click(within(list).getAllByRole('link')[1])
    await expectSent('option_opened', { option_id: options[1].id, rank: 2 })

    await user.click(screen.getByRole('button', { name: 'Show the full working' }))
    await expectSent('working_expanded', { option_id: options[1].id })
    // Hiding it again is not another expand.
    await user.click(screen.getByRole('button', { name: 'Hide the full working' }))
    expect(sent().filter(([e]) => e === 'working_expanded')).toHaveLength(1)
  })
})

describe('charge check', () => {
  beforeEach(() => act(loadSampleDebts))

  it('knows the check was opened from the overview', async () => {
    const user = renderAt('/debts')
    await user.click(screen.getByRole('link', { name: 'Check a closing quote' }))
    await expectSent('charge_check_started', { entry: 'overview' })
  })

  it('sends the verdict as counts, then the copy and the share', async () => {
    const user = renderAt(`/charges?debt=${ids.personal}`)
    await expectSent('charge_check_started', { entry: 'tab' })
    for (let i = 0; i < 4; i++) await user.click(screen.getByRole('button', { name: 'Next' }))
    await addCharge(user, 1, 'Foreclosure charge', '6300', 'Yes')
    await addCharge(user, 2, 'Admin or documentation fee', '750', 'No')
    await addCharge(user, 3, 'GST', '1539')
    await user.click(screen.getByRole('button', { name: 'Check the charges' }))
    await expectSent('charge_check_completed', { covered: 'yes', flag_count: 1, ask_count: 1, line_count: 3 })

    await user.click(screen.getByRole('button', { name: 'Copy message' }))
    await expectSent('lender_message_copied', {})
    await user.click(screen.getByRole('link', { name: 'Share on WhatsApp' }))
    await expectSent('lender_message_shared', {})
  })
})

async function addCharge(user: User, n: number, kind: string, amount: string, disclosed?: 'Yes' | 'No') {
  if (n > 1) await user.click(screen.getByRole('button', { name: '+ Add another charge' }))
  const line = screen.getByRole('listitem', { name: `Charge ${n}` })
  await user.selectOptions(within(line).getByLabelText('Type of charge'), kind)
  await user.type(within(line).getByLabelText('Amount'), amount)
  if (disclosed) await user.click(within(line).getByRole('radio', { name: disclosed }))
}

describe('Me', () => {
  it('sends the recommend answer only while usage counts are on', async () => {
    const user = renderAt('/me')
    await user.click(screen.getByRole('radio', { name: 'Very likely' }))
    await expectSent('recommend_answered', { answer: 'very_likely' })

    await user.click(screen.getByRole('switch', { name: /Share anonymous usage counts/ }))
    posthog.capture.mockClear()
    await user.click(screen.getByRole('radio', { name: 'Maybe' }))
    await new Promise((r) => setTimeout(r, 0))
    expect(posthog.capture).not.toHaveBeenCalled()
  })

  it('sends data_deleted, then forgets the anonymous id', async () => {
    const user = renderAt('/me')
    await user.click(screen.getByRole('button', { name: 'Delete all my data' }))
    await user.click(screen.getByRole('button', { name: 'Delete everything' }))
    await expectSent('data_deleted', {})
    await waitFor(() => expect(posthog.reset).toHaveBeenCalledOnce())
  })
})
