import { act, cleanup, render, screen, within } from '@testing-library/react'
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

/** The balance and payment labels depend on the type: card wording unless `type` is a loan. */
async function fillDebt(user: ReturnType<typeof userEvent.setup>, { type, balance, apr, payment }: { type?: string; balance: string; apr: string; payment: string }) {
  if (type) await user.click(screen.getByRole('radio', { name: type }))
  const loan = type !== undefined && type !== 'Credit card' && type !== 'BNPL'
  await user.type(screen.getByLabelText(loan ? 'How much is left on the loan?' : 'How much is on the card?'), balance)
  await user.type(screen.getByLabelText('Interest rate (% a year)'), apr)
  await user.type(screen.getByLabelText(loan ? 'Your EMI' : 'What you usually pay each month'), payment)
}

beforeEach(() => {
  act(() => appStore.getState().deleteAllData())
})

describe('first run', () => {
  it('goes Welcome → empty debts → add a debt → overview', async () => {
    const user = renderAt('/')
    expect(screen.getByRole('heading', { name: /All your debts\. One clear picture\./ })).toBeInTheDocument()
    expect(screen.getByText('No bank login. No SMS access. Your numbers stay on this phone.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Get started' }))
    expect(screen.getByRole('heading', { name: 'See everything you owe.' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Skip to adding my debts' }))
    expect(screen.getByRole('heading', { name: 'No debts added yet' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()

    await user.type(screen.getByLabelText('Monthly take-home pay (optional)'), '145000')
    expect(screen.getByLabelText('Monthly take-home pay (optional)')).toHaveValue('1,45,000')
    await user.click(screen.getByRole('link', { name: 'Add your first debt' }))
    expect(appStore.getState().profile.takeHomeMonthly).toBe(145000)

    expect(screen.getByRole('heading', { name: 'Add a debt' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Main' })).not.toBeInTheDocument()
    await fillDebt(user, { balance: '85000', apr: '42', payment: '6000' })
    expect(screen.getByLabelText('How much is on the card?')).toHaveValue('85,000')
    await user.click(screen.getByRole('button', { name: 'Save debt' }))

    expect(screen.getByText('Total owed')).toBeInTheDocument()
    expect(screen.getAllByText('₹85,000')).not.toHaveLength(0)
    expect(screen.getByText('42% a year, card')).toBeInTheDocument()
    expect(screen.getByText('Costs the most')).toBeInTheDocument()
    expect(screen.getByText('Share of take-home')).toBeInTheDocument()
    expect(screen.getByText('4%')).toBeInTheDocument() // 6,000 of 1,45,000
    // Cards only: no charge check yet.
    expect(screen.queryByRole('link', { name: 'Closing a loan early? Verify your charges' })).not.toBeInTheDocument()
  })

  it('sends Home back to Debts after Get started, not to Welcome again', async () => {
    const user = renderAt('/')
    await user.click(screen.getByRole('button', { name: 'Get started' }))
    await user.click(screen.getByRole('button', { name: 'Skip to adding my debts' }))
    await user.click(screen.getByRole('link', { name: 'Home' }))
    expect(screen.getByRole('heading', { name: 'No debts added yet' })).toBeInTheDocument()
  })

  it('opens on Home, not Welcome, once a debt exists', () => {
    act(() => { appStore.getState().addDebt({ type: 'credit_card', balance: 1000, apr: 36, monthlyPayment: 500 }) })
    renderAt('/welcome')
    expect(screen.getByRole('heading', { name: /^Good (morning|afternoon|evening)/ })).toBeInTheDocument()
  })

  it('opens how it works from Get started, chapter by chapter, then starts', async () => {
    const user = renderAt('/welcome')
    expect(screen.queryByRole('button', { name: 'How does it work?' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Get started' }))
    expect(screen.getByRole('heading', { name: 'See everything you owe.' })).toBeInTheDocument()
    expect(screen.getByText('Example numbers')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByRole('heading', { name: 'Know what your next rupee should do.' })).toBeInTheDocument()
    expect(screen.getByText('+₹55,728')).toBeInTheDocument()

    // The chapter bar jumps straight to any chapter.
    await user.click(screen.getByRole('tab', { name: 'Chapter 3' }))
    expect(screen.getByRole('heading', { name: 'Closing a loan? Don’t pay what you don’t owe.' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Chapter 3' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('No bank login. No SMS access. Nothing leaves your phone. We’ll point things out as you go.')).toBeInTheDocument()

    expect(screen.queryByRole('button', { name: 'Skip to adding my debts' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Add my first debt' }))
    expect(screen.getByRole('heading', { name: 'No debts added yet' })).toBeInTheDocument()
    expect(appStore.getState().onboardingStarted).toBe(true)
  })

  it('goes back to Welcome from how it works', async () => {
    const user = renderAt('/how-it-works')
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('heading', { name: /All your debts\. One clear picture\./ })).toBeInTheDocument()
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

  it('shows the loan box only for loans, and saves its answers', async () => {
    const user = renderAt('/debts/new')
    expect(screen.queryByRole('region', { name: 'About this loan' })).not.toBeInTheDocument()
    await fillDebt(user, { type: 'Personal loan', balance: '210000', apr: '13', payment: '8237' })
    expect(screen.getByText('Personal loans are usually 11–24% a year.')).toBeInTheDocument()
    const loans = screen.getByRole('region', { name: 'About this loan' })
    await user.click(within(loans).getByRole('radio', { name: 'Floating rate' }))
    await user.type(within(loans).getByLabelText('Sanctioned or renewed on'), '2026-03-14')
    await user.click(within(loans).getByRole('radio', { name: 'Personal use' }))
    await user.click(screen.getByRole('button', { name: 'Save debt' }))

    expect(appStore.getState().debts[0]).toMatchObject({
      name: 'Personal loan 1', type: 'personal_loan', rateType: 'floating', sanctionedOn: '2026-03-14', purpose: 'personal',
    })
    expect(screen.getByRole('link', { name: 'Closing a loan early? Verify your charges' })).toBeInTheDocument()
  })

  it('words the fields for the type, and keeps only that type\'s optional details', async () => {
    const user = renderAt('/debts/new')
    expect(screen.getByLabelText('Card name')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /More details/ }))
    await user.type(screen.getByLabelText('Credit limit'), '150000')
    await user.type(screen.getByLabelText('Bill due on (day of the month)'), '45')

    // Switch to a home loan: loan wording, no purpose question (always personal), loan details.
    await fillDebt(user, { type: 'Home loan', balance: '3800000', apr: '8.75', payment: '33581' })
    expect(screen.queryByRole('radiogroup', { name: 'Personal or business use?' })).not.toBeInTheDocument()
    await user.type(screen.getByLabelText('Lender'), 'SBI')
    await user.type(screen.getByLabelText('Amount you first borrowed'), '5000000')
    await user.type(screen.getByLabelText('EMIs left'), '180')
    await user.click(screen.getByRole('button', { name: 'Save debt' }))

    const saved = appStore.getState().debts[0]
    expect(saved).toMatchObject({ name: 'SBI home loan', lender: 'SBI', originalAmount: 5000000, monthsLeft: 180, purpose: 'personal' })
    expect(saved).not.toHaveProperty('creditLimit')
    expect(saved).not.toHaveProperty('dueDay')
  })

  it('opens More details to show a mistake in it', async () => {
    const user = renderAt('/debts/new')
    await fillDebt(user, { balance: '85000', apr: '42', payment: '6000' })
    await user.click(screen.getByRole('button', { name: /More details/ }))
    await user.type(screen.getByLabelText('Bill due on (day of the month)'), '45')
    await user.click(screen.getByRole('button', { name: /More details/ }))
    await user.click(screen.getByRole('button', { name: 'Save debt' }))
    expect(screen.getByText('Enter a day from 1 to 31')).toBeInTheDocument()
    expect(appStore.getState().debts).toHaveLength(0)
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

    const payment = screen.getByLabelText('What you usually pay each month')
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

  it('shows what the optional details reveal', () => {
    let card = ''
    let loan = ''
    act(() => {
      card = appStore.getState().addDebt({ type: 'credit_card', balance: 85000, apr: 42, monthlyPayment: 6000, creditLimit: 150000, dueDay: 2 })
      loan = appStore.getState().addDebt({ type: 'car_loan', balance: 420000, apr: 9.5, monthlyPayment: 13454, originalAmount: 600000, monthsLeft: 36 })
    })
    renderAt(`/debts/${card}`)
    expect(screen.getByText('Using 57% of your ₹1,50,000 limit.')).toBeInTheDocument()
    expect(screen.getByText('Bill due on the 2nd of each month.')).toBeInTheDocument()
    cleanup()
    renderAt(`/debts/${loan}`)
    expect(screen.getByText('You’ve repaid 30% of the ₹6,00,000 you borrowed.')).toBeInTheDocument()
    expect(screen.getByText('Your lender says 36 EMIs left; at this payment we work out about 36.')).toBeInTheDocument()
  })

  it('goes back to the list for an unknown id', () => {
    renderAt('/debts/nope')
    expect(screen.getByRole('heading', { name: 'No debts added yet' })).toBeInTheDocument()
  })
})
