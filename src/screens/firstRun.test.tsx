import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../App'
import { appStore } from '../state/store'

function renderAt(path = '/') {
  const user = userEvent.setup()
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
  return user
}

async function fillDebt(user: ReturnType<typeof userEvent.setup>, { type, balance, apr, payment }: { type?: string; balance: string; apr: string; payment: string }) {
  if (type) await user.click(screen.getByRole('radio', { name: type }))
  await user.type(screen.getByLabelText('How much do you owe?'), balance)
  await user.type(screen.getByLabelText('Interest rate (% a year)'), apr)
  await user.type(screen.getByLabelText('What you pay each month'), payment)
}

beforeEach(() => {
  act(() => appStore.getState().deleteAllData())
})

describe('first run', () => {
  it('goes Welcome → empty debts → add a debt → overview', async () => {
    const user = renderAt('/')
    expect(screen.getByRole('heading', { name: /See everything you owe/ })).toBeInTheDocument()
    expect(screen.getByText('No bank login. No SMS access. Your numbers stay on this phone.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Get started' }))
    expect(screen.getByRole('heading', { name: 'No debts added yet' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()

    await user.type(screen.getByLabelText('Monthly take-home pay (optional)'), '145000')
    expect(screen.getByLabelText('Monthly take-home pay (optional)')).toHaveValue('1,45,000')
    await user.click(screen.getByRole('link', { name: 'Add your first debt' }))
    expect(appStore.getState().profile.takeHomeMonthly).toBe(145000)

    expect(screen.getByRole('heading', { name: 'Add a debt' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Main' })).not.toBeInTheDocument()
    await fillDebt(user, { balance: '85000', apr: '42', payment: '6000' })
    expect(screen.getByLabelText('How much do you owe?')).toHaveValue('85,000')
    await user.click(screen.getByRole('button', { name: 'Save debt' }))

    expect(screen.getByText('Total owed')).toBeInTheDocument()
    expect(screen.getAllByText('₹85,000')).not.toHaveLength(0)
    expect(screen.getByText('42% a year · Card · costs the most')).toBeInTheDocument()
    expect(screen.getByText('Share of take-home')).toBeInTheDocument()
    expect(screen.getByText('4%')).toBeInTheDocument() // 6,000 of 1,45,000
    // Cards only: no charge check yet.
    expect(screen.queryByRole('link', { name: 'Check a closing quote' })).not.toBeInTheDocument()
  })

  it('sends Home back to Debts after Get started, not to Welcome again', async () => {
    const user = renderAt('/')
    await user.click(screen.getByRole('button', { name: 'Get started' }))
    await user.click(screen.getByRole('link', { name: 'Home' }))
    expect(screen.getByRole('heading', { name: 'No debts added yet' })).toBeInTheDocument()
  })

  it('opens on Home, not Welcome, once a debt exists', () => {
    act(() => { appStore.getState().addDebt({ type: 'credit_card', balance: 1000, apr: 36, monthlyPayment: 500 }) })
    renderAt('/welcome')
    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument()
  })

  it('explains how it works in a sheet', async () => {
    const user = renderAt('/welcome')
    await user.click(screen.getByRole('button', { name: 'How does it work?' }))
    const sheet = screen.getByRole('dialog', { name: 'How it works' })
    expect(within(sheet).getByText('Check charges')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('add a debt', () => {
  it('shows the errors from the data model and does not save', async () => {
    const user = renderAt('/debts/new')
    await user.click(screen.getByRole('button', { name: 'Save debt' }))
    expect(screen.getByText('Enter how much you owe')).toBeInTheDocument()
    expect(screen.getByText('Enter the yearly rate, for example 13 or 42')).toBeInTheDocument()
    expect(screen.getByText('Enter what you pay each month')).toBeInTheDocument()
    expect(appStore.getState().debts).toHaveLength(0)
  })

  it('warns but still saves when the payment does not cover the interest', async () => {
    const user = renderAt('/debts/new')
    await fillDebt(user, { balance: '100000', apr: '42', payment: '3000' })
    expect(screen.getByText("This payment doesn't cover the monthly interest, so the balance grows.")).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save debt' }))
    expect(appStore.getState().debts).toHaveLength(1)
  })

  it('shows the loans-only box only for loans, and saves its answers', async () => {
    const user = renderAt('/debts/new')
    expect(screen.queryByRole('region', { name: 'Loans only' })).not.toBeInTheDocument()
    await fillDebt(user, { type: 'Personal loan', balance: '210000', apr: '13', payment: '8237' })
    const loans = screen.getByRole('region', { name: 'Loans only' })
    await user.click(within(loans).getByRole('radio', { name: 'Floating rate' }))
    await user.type(within(loans).getByLabelText('Sanctioned or renewed on'), '2026-03-14')
    await user.click(within(loans).getByRole('radio', { name: 'Personal use' }))
    await user.click(screen.getByRole('button', { name: 'Save debt' }))

    expect(appStore.getState().debts[0]).toMatchObject({
      name: 'Personal loan 1', type: 'personal_loan', rateType: 'floating', sanctionedOn: '2026-03-14', purpose: 'personal',
    })
    expect(screen.getByRole('link', { name: 'Check a closing quote' })).toBeInTheDocument()
  })

  it('opens the upload fake door', async () => {
    const user = renderAt('/debts/new')
    await user.click(screen.getByRole('button', { name: 'Upload a statement instead' }))
    expect(screen.getByRole('dialog', { name: 'Coming soon' })).toBeInTheDocument()
  })
})

describe('debt edit', () => {
  it('shows payoff time and interest, saves edits, and deletes after confirming', async () => {
    let id = ''
    act(() => { id = appStore.getState().addDebt({ type: 'credit_card', name: 'Credit card 1', balance: 85000, apr: 42, monthlyPayment: 6000 }) })
    const user = renderAt(`/debts/${id}`)

    expect(screen.getByRole('heading', { name: 'Credit card 1' })).toBeInTheDocument()
    expect(screen.getByText('At ₹6,000 a month, this card clears in about 20 months.')).toBeInTheDocument()
    expect(screen.getByText('Interest this month: ₹2,975')).toBeInTheDocument()

    const payment = screen.getByLabelText('What you pay each month')
    await user.clear(payment)
    await user.type(payment, '2000')
    expect(screen.getByRole('status')).toHaveTextContent("This payment doesn't cover the monthly interest")
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(appStore.getState().debts[0].monthlyPayment).toBe(2000)

    await user.click(screen.getByRole('link', { name: /Credit card 1/ }))
    await user.click(screen.getByRole('button', { name: 'Delete this debt' }))
    await user.click(within(screen.getByRole('dialog', { name: 'Delete this debt?' })).getByRole('button', { name: 'Delete' }))
    expect(appStore.getState().debts).toHaveLength(0)
    expect(screen.getByRole('heading', { name: 'No debts added yet' })).toBeInTheDocument()
  })

  it('goes back to the list for an unknown id', () => {
    renderAt('/debts/nope')
    expect(screen.getByRole('heading', { name: 'No debts added yet' })).toBeInTheDocument()
  })
})
