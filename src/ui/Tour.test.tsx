import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { track } from '../lib/analytics'
import { appStore } from '../state/store'
import { Tour, type TourStep } from './Tour'

// The test setup swaps Tour out for every other screen's tests; these test the real one.
vi.unmock('./Tour')
vi.mock('../lib/analytics', async (original) => ({ ...(await original<typeof import('../lib/analytics')>()), track: vi.fn() }))

const STEPS: TourStep[] = [
  { target: 'total', title: 'Everything you owe', body: 'All of it, added up.' },
  { target: 'missing', title: 'Not on this screen', body: 'Skipped.' },
  { target: 'button', title: 'Ask about the bonus', body: 'Compare every option.' },
]

function renderTour(steps = STEPS) {
  const user = userEvent.setup()
  render(
    <>
      <p data-tour="total">₹45,55,000</p>
      <button type="button" data-tour="button">Compare</button>
      <Tour id="overview" steps={steps} delay={0} />
    </>,
  )
  return user
}

beforeEach(() => {
  act(() => appStore.getState().deleteAllData())
  vi.mocked(track).mockClear()
})

describe('Tour', () => {
  it('walks the steps that are on screen, then remembers it was seen', async () => {
    const user = renderTour()
    const dialog = await screen.findByRole('dialog', { name: 'Everything you owe' })
    expect(dialog).toHaveAccessibleDescription('All of it, added up.')
    expect(screen.getByText('1 of 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByRole('dialog', { name: 'Ask about the bonus' })).toBeInTheDocument()
    expect(screen.getByText('2 of 2')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Skip the tour' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Got it' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(appStore.getState().settings.toursSeen).toEqual(['overview'])
    expect(track).toHaveBeenCalledWith('tour_ended', { tour: 'overview', completed: true, step: 2 })
  })

  it('can be skipped, and then does not come back', async () => {
    const user = renderTour()
    await user.click(await screen.findByRole('button', { name: 'Skip the tour' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(track).toHaveBeenCalledWith('tour_ended', { tour: 'overview', completed: false, step: 1 })

    renderTour()
    await new Promise((r) => setTimeout(r, 10))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes on Escape', async () => {
    const user = renderTour()
    await screen.findByRole('dialog')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(appStore.getState().settings.toursSeen).toEqual(['overview'])
  })

  it('shows again after “Show me around again”', async () => {
    act(() => appStore.getState().markTourSeen('overview'))
    act(() => appStore.getState().resetTours())
    renderTour()
    expect(await screen.findByRole('dialog', { name: 'Everything you owe' })).toBeInTheDocument()
  })

  it('stays away when none of its features are on screen, without marking it seen', async () => {
    renderTour([{ target: 'missing', title: 'Nope', body: 'Nope' }])
    await new Promise((r) => setTimeout(r, 10))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(appStore.getState().settings.toursSeen).toEqual([])
  })
})
