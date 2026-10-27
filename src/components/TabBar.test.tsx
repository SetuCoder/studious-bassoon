import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { TabBar } from './TabBar'

describe('TabBar', () => {
  it('names every tab for screen readers, though only the active one shows its label', () => {
    render(
      <MemoryRouter initialEntries={['/plan/results']}>
        <TabBar />
      </MemoryRouter>,
    )
    const nav = within(screen.getByRole('navigation', { name: 'Main' }))
    for (const name of ['Home', 'Debts', 'Plan', 'Charges', 'Me']) expect(nav.getByRole('link', { name })).toBeInTheDocument()
    expect(nav.getByRole('link', { name: 'Plan' })).toHaveAttribute('aria-current', 'page')
    expect(nav.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current')
    expect(nav.getByText('Plan')).not.toHaveClass('sr-only')
    expect(nav.getByText('Debts')).toHaveClass('sr-only')
  })
})
