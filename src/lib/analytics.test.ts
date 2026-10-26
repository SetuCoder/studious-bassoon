import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const posthog = vi.hoisted(() => ({ init: vi.fn(), capture: vi.fn(), reset: vi.fn() }))
vi.mock('posthog-js', () => ({ default: posthog }))

/** A fresh copy of the wrapper and store, so the lazily created PostHog client starts empty. */
async function load() {
  vi.resetModules()
  const analytics = await import('./analytics')
  const { appStore } = await import('../state/store')
  return { ...analytics, appStore }
}

/** Lets the dynamic import and its .then chain run. */
const settle = () => new Promise((r) => setTimeout(r, 0))

beforeEach(() => {
  vi.clearAllMocks()
  // Each fresh store hydrates from storage, so an earlier test's "off" toggle would carry over.
  localStorage.clear()
  vi.stubEnv('VITE_POSTHOG_KEY', 'phc_test')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('sanitise', () => {
  it('keeps counts, ids and yes/no answers', async () => {
    const { sanitise } = await load()
    expect(sanitise({ type: 'credit_card', debt_count: 3, rank: 1, split_shown: false })).toEqual({
      type: 'credit_card',
      debt_count: 3,
      rank: 1,
      split_shown: false,
    })
  })

  it('drops names that look like money or text, unless the value is a yes/no', async () => {
    const { sanitise } = await load()
    expect(sanitise({
      amount: 5, balance: 3, rate: 12, apr: 42, debt_name: 'card', free_text: 'hi', interest_rate_band: 'high',
      has_rate_type: true,
    })).toEqual({ has_rate_type: true })
  })

  it('drops numbers that are not whole counts from 0 to 100', async () => {
    const { sanitise } = await load()
    expect(sanitise({ a: 0, b: 100, c: 101, d: 85000, e: 2.5, f: -1, g: Number.NaN })).toEqual({ a: 0, b: 100 })
  })

  it('drops strings that are not short ids, so typed text cannot leak', async () => {
    const { sanitise } = await load()
    expect(sanitise({ screen: 'add_debt', a: 'HDFC Millennia card', b: '₹85,000', c: '2026-03-14', d: 'x'.repeat(41) })).toEqual({
      screen: 'add_debt',
    })
  })

  it('drops objects and arrays', async () => {
    const { sanitise } = await load()
    expect(sanitise({ a: { n: 1 }, b: [1], c: null, d: undefined })).toEqual({})
  })
})

describe('track', () => {
  it('starts PostHog with the documented privacy settings and sends the cleaned event', async () => {
    const { track } = await load()
    track('debt_added', { type: 'personal_loan', has_rate_type: true, has_sanction_date: false, debt_count: 2 })
    await settle()
    expect(posthog.init).toHaveBeenCalledOnce()
    expect(posthog.init).toHaveBeenCalledWith('phc_test', expect.objectContaining({
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      person_profiles: 'identified_only',
    }))
    expect(posthog.capture).toHaveBeenCalledWith('debt_added', {
      type: 'personal_loan', has_rate_type: true, has_sanction_date: false, debt_count: 2,
    })
  })

  it('starts PostHog once, however many events are sent', async () => {
    const { track } = await load()
    track('take_home_set')
    track('onboarding_started')
    await settle()
    expect(posthog.init).toHaveBeenCalledOnce()
    expect(posthog.capture).toHaveBeenCalledTimes(2)
  })

  it('sends nothing, and never loads PostHog, when usage counts are turned off', async () => {
    const { track, appStore } = await load()
    appStore.getState().setShareUsageCounts(false)
    track('take_home_set')
    await settle()
    expect(posthog.init).not.toHaveBeenCalled()
    expect(posthog.capture).not.toHaveBeenCalled()
  })

  it('does nothing without a key', async () => {
    vi.stubEnv('VITE_POSTHOG_KEY', '')
    const { track } = await load()
    track('take_home_set')
    await settle()
    expect(posthog.init).not.toHaveBeenCalled()
  })

  it('forgets the anonymous id after the data is deleted', async () => {
    const { track, forgetAnalyticsId } = await load()
    track('data_deleted')
    forgetAnalyticsId()
    await settle()
    expect(posthog.capture).toHaveBeenCalledWith('data_deleted', {})
    expect(posthog.reset).toHaveBeenCalledOnce()
    // The event goes out before the id is cleared.
    expect(posthog.capture.mock.invocationCallOrder[0]).toBeLessThan(posthog.reset.mock.invocationCallOrder[0])
  })
})
