import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../App'
import { SAMPLE_DEBTS } from '../engine/testDebts'
import { STORAGE_KEY } from '../state/migrations'
import { appStore } from '../state/store'
import { greeting, homeActions } from './home/homeActions'

function renderAt(path: string) {
  const user = userEvent.setup()
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
  return user
}

beforeEach(() => {
  act(() => {
    appStore.getState().deleteAllData()
    for (const d of SAMPLE_DEBTS) appStore.getState().addDebt(d)
  })
})

describe('12 Home (M1)', () => {
  it('greets by name once it is known', () => {
    act(() => appStore.getState().setName('Riya'))
    renderAt('/')
    expect(screen.getByRole('heading', { name: /^Good (morning|afternoon|evening), Riya$/ })).toBeInTheDocument()
  })

  it('shows where you stand, when you are debt-free, where the payment goes, and the top debts', () => {
    renderAt('/')
    expect(screen.getByRole('heading', { name: /^Good (morning|afternoon|evening)$/ })).toBeInTheDocument()
    expect(screen.getByText('Across 6 debts')).toBeInTheDocument()
    expect(screen.getByText('Average rate').nextSibling).toHaveTextContent('9.9%')

    const free = within(screen.getByRole('region', { name: 'Debt-free' }))
    expect(free.getByText(/^by [A-Z][a-z]+ \d{4}$/)).toBeInTheDocument()
    expect(free.getByText(/In about 7 years 6 months, if you keep paying ₹69,771 a month/)).toBeInTheDocument()
    expect(free.getByText('Buy now, pay later')).toBeInTheDocument()

    const split = within(screen.getByRole('region', { name: 'This month’s payments' }))
    expect(split.getByText('54% goes to interest')).toBeInTheDocument()
    expect(split.getByText('Pays down what you owe').nextSibling).toHaveTextContent('₹32,341')

    const top = within(screen.getByRole('region', { name: 'Your debts, costliest first' }))
    expect(top.getAllByRole('listitem')).toHaveLength(3)
    expect(top.getByRole('link', { name: 'See all 6 debts' })).toHaveAttribute('href', '/debts')
  })

  it('shows the total, the focus and the to-do list', async () => {
    const user = renderAt('/')
    expect(screen.getByText('₹45,55,000')).toBeInTheDocument() // the rolling total; screen readers hear "₹45,55,000 owed"
    expect(screen.getByText('owed')).toBeInTheDocument()
    expect(screen.getAllByText('₹69,771')).not.toHaveLength(0)
    expect(screen.getAllByText('₹37,430')).not.toHaveLength(0)
    expect(screen.getByText('Credit card 1, at 42%: about ₹2,975 in interest this month.')).toBeInTheDocument()
    expect(screen.queryByText(/should go there first/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'See where extra money helps most' })).toHaveAttribute('href', '/plan')

    const todo = within(screen.getByRole('region', { name: 'Needs your attention' }))
    expect(todo.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      expect.stringContaining('Add your take-home pay'),
      expect.stringContaining('Bonus or extra cash coming?'),
    ])

    await user.click(todo.getByRole('button', { name: /Add your take-home pay/ }))
    await user.type(screen.getByLabelText('Monthly take-home pay'), '145000')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(appStore.getState().profile.takeHomeMonthly).toBe(145000)
    expect(screen.queryByText('Add your take-home pay')).not.toBeInTheDocument()
  })

  it('asks to complete a loan that is missing what the charge check needs', () => {
    let id = ''
    act(() => { id = appStore.getState().addDebt({ type: 'gold_loan', balance: 50000, apr: 10, monthlyPayment: 5000 }) })
    renderAt('/')
    expect(screen.getByRole('link', { name: /Complete Gold loan 1 for the charge check/ })).toHaveAttribute('href', `/debts/${id}`)
    expect(screen.getByText('Add its rate type and sanction date')).toBeInTheDocument()
  })
})

describe('11 Me', () => {
  it('is an account page: counts, linked accounts coming soon, and working preferences', async () => {
    const user = renderAt('/me')
    expect(screen.getByRole('heading', { name: 'Your account' })).toBeInTheDocument()
    expect(screen.queryByText(/testers|feedback/i)).not.toBeInTheDocument()
    expect(screen.getByText('Debts tracked').nextSibling).toHaveTextContent('6')
    expect(within(screen.getByRole('region', { name: 'Linked accounts' })).getAllByText('Soon')).toHaveLength(3)

    const currency = screen.getByLabelText('Currency')
    expect(currency).toHaveValue('INR')
    expect(within(currency).getByRole('option', { name: '$ US dollar (soon)' })).toBeDisabled()

    for (const [name, key, before] of [
      [/Share anonymous usage counts/, 'shareUsageCounts', true],
      [/Vibrate on taps/, 'haptics', true],
      [/Calmer animations/, 'calmMotion', false],
    ] as const) {
      const toggle = screen.getByRole('switch', { name })
      expect(toggle).toHaveAttribute('aria-checked', String(before))
      await user.click(toggle)
      expect(appStore.getState().settings[key]).toBe(!before)
    }
    expect(screen.getByText('Shows the cost of each option. Not financial advice.')).toBeInTheDocument()
  })

  it('replays the guides and reopens how it works, coming back to Me', async () => {
    act(() => appStore.getState().markTourSeen('overview'))
    const user = renderAt('/me')
    await user.click(screen.getByRole('button', { name: 'Show me around again' }))
    expect(appStore.getState().settings.toursSeen).toEqual([])
    expect(screen.getByRole('button', { name: 'The guide will show on each screen' })).toBeDisabled()

    await user.click(screen.getByRole('link', { name: 'How it works' }))
    await user.click(screen.getByRole('tab', { name: 'Chapter 3' }))
    await user.click(screen.getByRole('button', { name: 'Back to the app' }))
    expect(screen.getByRole('heading', { name: 'Your account' })).toBeInTheDocument()
  })

  it('keeps everything if you back out of deleting', async () => {
    const user = renderAt('/me')
    await user.click(screen.getByRole('button', { name: 'Delete all my data' }))
    await user.click(screen.getByRole('button', { name: 'Keep my data' }))
    expect(appStore.getState().debts).toHaveLength(6)
  })

  it('deletes all data after confirming and returns to Welcome', async () => {
    const user = renderAt('/me')
    await user.click(screen.getByRole('button', { name: 'Delete all my data' }))
    await user.click(within(screen.getByRole('dialog', { name: 'Delete all your data?' })).getByRole('button', { name: 'Delete everything' }))
    expect(appStore.getState().debts).toHaveLength(0)
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(screen.getByRole('heading', { name: /All your debts\. One clear picture\./ })).toBeInTheDocument()
  })

  it('works before any debt is added', () => {
    act(() => appStore.getState().deleteAllData())
    renderAt('/me')
    expect(screen.getByRole('button', { name: 'Delete all my data' })).toBeInTheDocument()
  })
})

describe('homeActions', () => {
  it('nudges only for missing details and always offers the next-rupee check', () => {
    const loan = { id: 'l', name: 'Car loan', type: 'car_loan' as const, balance: 1, apr: 9, monthlyPayment: 1 }
    expect(homeActions([{ ...loan, rateType: 'fixed', sanctionedOn: '2023-04-05' }], { takeHomeMonthly: 1 }).map((a) => a.title))
      .toEqual(['Bonus or extra cash coming?'])
    expect(homeActions([{ ...loan, sanctionedOn: '2023-04-05' }], { takeHomeMonthly: 1 })[0].detail).toBe('Add its rate type')
    expect(homeActions([{ ...loan, rateType: 'fixed' }], { takeHomeMonthly: 1 })[0].detail).toBe('Add its sanction date')
    expect(homeActions([{ ...loan, paidOffOn: '2026-01-01' }], { takeHomeMonthly: 1 })).toHaveLength(1)
  })

  it('greets by time of day', () => {
    expect(greeting(9)).toBe('Good morning')
    expect(greeting(13)).toBe('Good afternoon')
    expect(greeting(20)).toBe('Good evening')
  })
})
