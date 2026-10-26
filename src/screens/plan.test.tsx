import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../App'
import { SAMPLE_DEBTS } from '../engine/testDebts'
import { appStore } from '../state/store'

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

describe('06 next rupee inputs', () => {
  it('pre-fills the first visit and shows the money to put to work', () => {
    renderAt('/plan')
    expect(screen.getByLabelText('Money you have to use')).toHaveValue('1,50,000')
    expect(screen.getByLabelText('Keep aside as a safety buffer')).toHaveValue('30,000')
    expect(screen.getByLabelText('If invested, what yearly return would you assume?')).toHaveValue('12')
    expect(screen.getByRole('status')).toHaveTextContent('₹1,20,000 to put to work')
    expect(screen.getByRole('status')).toHaveTextContent('₹1,50,000 minus your ₹30,000 buffer')
  })

  it('disables Compare when the buffer covers everything', async () => {
    const user = renderAt('/plan')
    const buffer = screen.getByLabelText('Keep aside as a safety buffer')
    await user.clear(buffer)
    await user.type(buffer, '150000')
    expect(screen.getByRole('status')).toHaveTextContent('Nothing to put to work yet')
    expect(screen.getByRole('button', { name: 'Compare options' })).toBeDisabled()
  })

  it('needs a return to compare', async () => {
    const user = renderAt('/plan')
    await user.clear(screen.getByLabelText('If invested, what yearly return would you assume?'))
    await user.click(screen.getByRole('button', { name: 'Compare options' }))
    expect(screen.getByText('Enter a yearly return from 0 to 100, for example 12')).toBeInTheDocument()
    expect(appStore.getState().lastNextRupee).toBeUndefined()
  })
})

describe('07 results and 08 option detail', () => {
  it('ranks the options like the fixtures, records "would you act", and shows the working', async () => {
    const user = renderAt('/plan')
    await user.click(screen.getByRole('button', { name: 'Compare options' }))
    expect(appStore.getState().lastNextRupee).toEqual({ amount: 150000, buffer: 30000, assumedReturn: 12 })

    expect(screen.getByText('Over 36 months, compared with leaving ₹1,20,000 in savings at 3%:')).toBeInTheDocument()
    const cards = within(screen.getByRole('list', { name: 'Options, best first' })).getAllByRole('link')
    expect(cards.map((c) => c.textContent)).toEqual([
      expect.stringMatching(/^Saves the most.*Highest rate first\+₹55,728Clears Credit card 1, Credit card 2 and part of Buy now, pay later$/),
      expect.stringMatching(/Smallest balance first\+₹55,661/),
      expect.stringMatching(/Invest at 12%\+₹40,406Return not guaranteed; the debts keep running$/),
      expect.stringMatching(/Prepay the home loan\+₹24,586Your cheapest debt/),
      expect.stringMatching(/Keep it in savings₹0The baseline/),
    ])

    await user.click(screen.getByRole('radio', { name: 'Maybe' }))
    expect(appStore.getState().feedback.wouldAct).toBe('maybe')

    await user.click(cards[0])
    expect(screen.getByRole('heading', { name: 'Highest rate first' })).toBeInTheDocument()
    expect(screen.getByText('+₹55,728')).toBeInTheDocument()
    expect(screen.getByText('42% · ₹85,000 → ₹0')).toBeInTheDocument()
    expect(screen.getByText('30% · ₹18,000 → ₹5,000')).toBeInTheDocument()
    expect(screen.getByText('Then the ₹8,500 a month you stop paying on Credit card 1 and Credit card 2 rolls to the next most expensive debt.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Show the full working' }))
    const table = screen.getByRole('table')
    expect(within(table).getAllByRole('row')).toHaveLength(37) // header + 36 months
    expect(within(table).getByRole('columnheader', { name: 'Credit card 1' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument()
  })

  it('shows the invested amount for the invest option', async () => {
    act(() => appStore.getState().setLastNextRupee({ amount: 150000, buffer: 30000, assumedReturn: 12 }))
    renderAt('/plan/results/invest')
    expect(screen.getByRole('heading', { name: 'Invest at 12%' })).toBeInTheDocument()
    expect(screen.getByText('At your assumed 12%, not guaranteed')).toBeInTheDocument()
  })

  it('sends you to the inputs when nothing has been compared yet', () => {
    renderAt('/plan/results')
    expect(screen.getByRole('heading', { name: 'Where should this money go?' })).toBeInTheDocument()
  })

  it('goes back to the results for an option that is not shown', () => {
    act(() => appStore.getState().setLastNextRupee({ amount: 150000, buffer: 30000, assumedReturn: 12 }))
    renderAt('/plan/results/split')
    expect(screen.getByRole('heading', { name: 'Your options' })).toBeInTheDocument()
  })
})
