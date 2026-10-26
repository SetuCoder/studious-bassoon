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
  it('shows the total, the focus and the to-do list', async () => {
    const user = renderAt('/')
    expect(screen.getByText('₹45,55,000')).toBeInTheDocument() // the rolling total; screen readers hear "₹45,55,000 owed"
    expect(screen.getByText('owed')).toBeInTheDocument()
    expect(screen.getByText('₹69,771')).toBeInTheDocument()
    expect(screen.getByText('₹37,430')).toBeInTheDocument()
    expect(screen.getByText('Credit card 1 costs the most at 42%. Any extra money should go there first.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'See your options' })).toHaveAttribute('href', '/plan')

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
  it('saves the recommend answer and the usage-counts setting', async () => {
    const user = renderAt('/me')
    await user.click(screen.getByRole('radio', { name: 'Very likely' }))
    expect(appStore.getState().feedback.recommend).toBe('very_likely')
    const toggle = screen.getByRole('switch', { name: /Share anonymous usage counts/ })
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    await user.click(toggle)
    expect(appStore.getState().settings.shareUsageCounts).toBe(false)
    expect(screen.getByText('Beta 0.1. Shows the cost of each option. Not financial or legal advice.')).toBeInTheDocument()
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
    expect(screen.getByRole('heading', { name: /See everything you owe/ })).toBeInTheDocument()
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
