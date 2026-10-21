import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App'
import { APP_NAME } from './lib/constants'
import { appStore } from './state/store'

describe('App shell', () => {
  afterEach(() => act(() => appStore.setState({ storageAvailable: true })))

  it('renders the app name', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: APP_NAME })).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('says so when data cannot be saved', () => {
    render(<App />)
    act(() => appStore.setState({ storageAvailable: false }))
    expect(screen.getByRole('status')).toHaveTextContent("Your data won't be saved on this device.")
  })
})
