import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { SAMPLE_DEBTS } from '../engine/testDebts'
import { appStore } from '../state/store'
import { buildChargeCheck, newLine, prefillFromDebt } from './charges/chargeCheckState'

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

async function next(user: User) {
  await user.click(screen.getByRole('button', { name: 'Next' }))
}

/** Fill charge line `n` (1-based) on the charges step, adding it first if needed. */
async function charge(user: User, n: number, kind: string, amount: string, disclosed?: 'Yes' | 'No' | 'Not sure') {
  if (n > 1) await user.click(screen.getByRole('button', { name: '+ Add another charge' }))
  const line = screen.getByRole('listitem', { name: `Charge ${n}` })
  await user.click(within(within(line).getByRole('radiogroup', { name: 'Type of charge' })).getByRole('radio', { name: kind }))
  await user.type(within(line).getByLabelText('Amount'), amount)
  if (disclosed) await user.click(within(line).getByRole('radio', { name: disclosed }))
}

beforeEach(() => {
  act(() => {
    appStore.getState().deleteAllData()
    for (const d of SAMPLE_DEBTS) ids[d.id] = appStore.getState().addDebt(d)
  })
})

describe('09 charge check questions → 10 result', () => {
  it('explains itself first, pre-fills the loan, then flags the quote like the fixture', async () => {
    const user = renderAt(`/charges?debt=${ids.personal}`)
    expect(screen.queryByRole('navigation', { name: 'Main' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Make sure you’re not overcharged.' })).toBeInTheDocument()
    expect(screen.getByText('You’ll need the closing quote')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Start the check' }))

    // The loan was chosen by the link, so its details come next, pre-filled from the ledger.
    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'About your Personal loan' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Floating' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText('Your debt details say 14 March 2026. The rule covers loans from 1 January 2026.')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'In 2026 or later' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Personal' })).toHaveAttribute('aria-checked', 'true')
    await next(user)

    expect(screen.getByText('Step 2 of 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Check the charges' })).toBeDisabled()
    expect(screen.getByText('A fee for closing the whole loan early. Often 2–5% of what’s left.')).toBeInTheDocument()
    await charge(user, 1, 'Foreclosure', '6300', 'Yes')
    await charge(user, 2, 'Prepayment fee', '1500', 'Yes')
    await charge(user, 3, 'Admin fee', '750', 'No')
    await charge(user, 4, 'GST', '1539')
    await user.click(screen.getByRole('button', { name: 'Check the charges' }))

    expect(screen.getByRole('heading', { name: 'Your quote check' })).toBeInTheDocument()
    expect(screen.getByText('₹9,204')).toBeInTheDocument()
    expect(screen.getByText('₹885 more to confirm with the lender')).toBeInTheDocument()
    const rows = within(screen.getByRole('list', { name: 'Charges on the quote' })).getAllByRole('listitem')
    expect(rows.map((r) => r.textContent)).toEqual([
      expect.stringContaining("Foreclosure charge₹6,300Doesn't add upRBI bars"),
      expect.stringContaining("Prepayment fee₹1,500Doesn't add upSame rule applies."),
      expect.stringContaining('Admin or documentation fee₹750Ask the lenderNot listed in your sanction letter'),
      expect.stringContaining('GST₹1,539Follows the chargesFalls away on any charge that comes off.'),
    ])

    const message = screen.getByLabelText<HTMLTextAreaElement>('Message to your lender')
    expect(message.value).toContain('I am preparing to close my Personal loan (floating rate, sanctioned 14 March 2026). Your quote includes:')
    expect(message.value).toContain('Please also show me where the admin or documentation fee (₹750) is disclosed')
    expect(screen.getByRole('link', { name: 'Share on WhatsApp' })).toHaveAttribute('href', expect.stringMatching(/^https:\/\/wa\.me\/\?text=Subject%3A/))
    expect(screen.getByText('A guide to what to ask, not legal advice.')).toBeInTheDocument()

    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    await user.type(message, ' Thanks.')
    await user.click(screen.getByRole('button', { name: 'Copy message' }))
    expect(writeText).toHaveBeenCalledWith(expect.stringMatching(/Loan account: \[number\] Thanks\.$/))
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument()

    expect(appStore.getState().chargeChecks).toHaveLength(1)
    expect(appStore.getState().chargeChecks[0]).toMatchObject({ debtId: ids.personal, flaggedTotal: 9204, toConfirmTotal: 885 })
  })

  it('shows the fixed-rate car loan as not covered, with nothing to ask', async () => {
    const user = renderAt(`/charges?debt=${ids.car}`)
    await user.click(screen.getByRole('button', { name: 'Start the check' }))
    await next(user)
    await charge(user, 1, 'Foreclosure', '8400', 'Yes')
    await charge(user, 2, 'GST', '1512')
    await user.click(screen.getByRole('button', { name: 'Check the charges' }))

    expect(screen.getByText('No charges to question')).toBeInTheDocument()
    expect(screen.getByText('Rule does not cover it')).toBeInTheDocument()
    expect(screen.getByText('Applies only if the charge above stands.')).toBeInTheDocument()
    expect(screen.queryByLabelText('Message to your lender')).not.toBeInTheDocument()
  })

  it('asks who lent it, and whether it was up to ₹50 lakh, for business loans', async () => {
    const user = renderAt(`/charges?debt=${ids.personal}`)
    await user.click(screen.getByRole('button', { name: 'Start the check' }))
    await user.click(screen.getByRole('radio', { name: 'Business' }))
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    await user.selectOptions(screen.getByLabelText('Who lent it?'), 'Small finance bank')
    await user.click(within(screen.getByRole('radiogroup', { name: 'Was the sanctioned amount ₹50 lakh or less?' })).getByRole('radio', { name: 'Yes' }))
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()
  })

  it('steps back through the screens with the back arrow', async () => {
    const user = renderAt(`/charges?debt=${ids.personal}`)
    await user.click(screen.getByRole('button', { name: 'Start the check' }))
    await next(user)
    expect(screen.getByText('Step 2 of 2')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('button', { name: 'Start the check' })).toBeInTheDocument()
  })

  it('asks which loan when there are several, and skips the explainer after the first check', async () => {
    act(() => { appStore.getState().saveChargeCheck(buildChargeCheck(SAMPLE_DEBTS[0], { lines: [] })) })
    const user = renderAt('/charges')
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: /Credit card/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    await user.click(screen.getByRole('radio', { name: /Car loan/ }))
    await next(user)
    expect(screen.getByRole('heading', { name: 'About your Car loan' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Fixed' })).toHaveAttribute('aria-checked', 'true')
  })

  it('says the check is for loans when there are only cards', () => {
    act(() => {
      appStore.getState().deleteAllData()
      appStore.getState().addDebt({ type: 'credit_card', balance: 85000, apr: 42, monthlyPayment: 6000 })
    })
    renderAt('/charges')
    expect(screen.getByText('The charge check is for loans. Add a loan to check its closing quote.')).toBeInTheDocument()
  })

  it('goes back to the check for an unknown result', () => {
    renderAt('/charges/nope')
    expect(screen.getByRole('button', { name: 'Start the check' })).toBeInTheDocument()
  })
})

describe('prefillFromDebt', () => {
  it('answers "₹50 lakh or less?" from the amount first borrowed, when the debt has it', () => {
    const personal = SAMPLE_DEBTS.find((d) => d.id === 'personal')!
    expect(prefillFromDebt({ lines: [] }, { ...personal, originalAmount: 300000 }).sanctionedAmountUpTo50L).toBe('yes')
    expect(prefillFromDebt({ lines: [] }, { ...personal, originalAmount: 6000000 }).sanctionedAmountUpTo50L).toBe('no')
    expect(prefillFromDebt({ lines: [] }, personal).sanctionedAmountUpTo50L).toBeUndefined()
  })
})

describe('buildChargeCheck', () => {
  it('quotes the ledger date only when it matches the answer', () => {
    const personal = SAMPLE_DEBTS.find((d) => d.id === 'personal')!
    const form = prefillFromDebt({ lines: [{ ...newLine(1), amount: '6300', disclosed: 'yes' }] }, personal)
    expect(buildChargeCheck(personal, form).message).toContain('sanctioned 14 March 2026')
    const contradicted = buildChargeCheck(personal, { ...form, sanctionedOnOrAfter2026: 'unknown' })
    expect(contradicted.message).not.toContain('sanctioned 14 March 2026')
    expect(contradicted.results[0].status).toBe('ask_lender')
  })
})
