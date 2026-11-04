import { act } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { appStore } from '../state/store'
import { tap } from './haptics'

afterEach(() => act(() => appStore.getState().deleteAllData()))

describe('haptics', () => {
  it('buzzes only while "Vibrate on taps" is on', () => {
    const vibrate = vi.fn()
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true })
    tap()
    expect(vibrate).toHaveBeenCalledTimes(1)
    act(() => appStore.getState().setHaptics(false))
    tap()
    expect(vibrate).toHaveBeenCalledTimes(1)
  })
})
