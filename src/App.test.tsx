import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App'
import { appStore } from './state/store'

describe('App shell', () => {
  afterEach(() => act(() => appStore.setState({ storageAvailable: true })))

  function renderApp() {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )
  }

  it('shows no storage notice when data can be saved', () => {
    renderApp()
    expect(screen.queryByText("Your data won't be saved on this device.")).not.toBeInTheDocument()
  })

  it('says so when data cannot be saved', () => {
    renderApp()
    act(() => appStore.setState({ storageAvailable: false }))
    expect(screen.getByText("Your data won't be saved on this device.")).toBeInTheDocument()
  })
})
