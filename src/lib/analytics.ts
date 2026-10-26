import type { PostHog } from 'posthog-js'
import { useEffect, useRef } from 'react'
import type { DebtType, OptionId } from '../engine/types'
import { appStore } from '../state/store'

// The only file that talks to PostHog (docs/analytics.md). Events carry names and coarse
// properties, never money, rates, names, dates or anything the user typed.

type Answer3 = 'yes' | 'maybe' | 'no'

/** Every event we send, with the properties it may carry. `undefined` means none. */
export interface AnalyticsEvents {
  app_opened: { returning: boolean; standalone: boolean }
  onboarding_started: undefined
  debt_added: { type: DebtType; has_rate_type: boolean; has_sanction_date: boolean; debt_count: number }
  debt_payment_below_interest: { type: DebtType }
  take_home_set: undefined
  overview_viewed: { debt_count: number }
  next_rupee_compared: { option_count: number; split_shown: boolean }
  option_opened: { option_id: OptionId; rank: number }
  working_expanded: { option_id: OptionId }
  would_act_answered: { answer: Answer3; top_option_id: OptionId }
  upload_fake_door_tapped: { screen: UploadScreen }
  upload_waitlist_clicked: { screen: UploadScreen }
  charge_check_started: { entry: ChargeCheckEntry }
  charge_check_completed: { covered: 'yes' | 'no' | 'unknown'; flag_count: number; ask_count: number; line_count: number }
  lender_message_copied: undefined
  lender_message_shared: undefined
  feedback_form_opened: undefined
  recommend_answered: { answer: 'not_likely' | 'maybe' | 'very_likely' }
  data_deleted: undefined
}

export type EventName = keyof AnalyticsEvents
export type UploadScreen = 'add_debt'
export type ChargeCheckEntry = 'overview' | 'tab' | 'debt_page'
type PropsArg<E extends EventName> = AnalyticsEvents[E] extends undefined ? [] : [AnalyticsEvents[E]]
type Clean = Record<string, string | number | boolean>

const BLOCKED_NAME = /amount|balance|rate|apr|name|text/i
// Enum-like values only ('credit_card', 'apr'), so free text can't slip through as a string.
const SAFE_STRING = /^[a-z0-9_]{1,40}$/
const MAX_NUMBER = 100

/**
 * The safety net under the typed events. A yes/no can't carry an amount, so booleans always
 * pass (has_rate_type). Anything else whose name looks like money or text is dropped, as are
 * numbers that aren't whole counts from 0 to 100 and strings that aren't short ids.
 */
export function sanitise(props: Record<string, unknown> = {}): Clean {
  const clean: Clean = {}
  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'boolean') clean[key] = value
    else if (BLOCKED_NAME.test(key)) continue
    else if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_NUMBER) clean[key] = value
    else if (typeof value === 'string' && SAFE_STRING.test(value)) clean[key] = value
  }
  return clean
}

let client: Promise<PostHog | undefined> | undefined

/** PostHog loads on the first event, and only when a key is configured. */
function getClient(): Promise<PostHog | undefined> | undefined {
  const key: string | undefined = import.meta.env.VITE_POSTHOG_KEY
  if (!key) return undefined
  client ??= import('posthog-js')
    .then(({ default: posthog }) => {
      posthog.init(key, {
        api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        disable_session_recording: true,
        disable_surveys: true,
        advanced_disable_flags: true,
        person_profiles: 'identified_only',
        persistence: 'localStorage',
      })
      return posthog
    })
    // If it can't load, the app carries on without counts.
    .catch(() => undefined)
  return client
}

/** Sends one event, unless the user turned off "Share anonymous usage counts" on Me. */
export function track<E extends EventName>(event: E, ...[props]: PropsArg<E>): void {
  if (!appStore.getState().settings.shareUsageCounts) return
  const clean = sanitise(props)
  if (import.meta.env.DEV && import.meta.env.MODE !== 'test') console.debug('[track]', event, clean)
  void getClient()?.then((ph) => ph?.capture(event, clean))
}

/** Sends an event once when a screen first shows (StrictMode's double mount included). */
export function useTrackOnMount<E extends EventName>(event: E, ...props: PropsArg<E>): void {
  const sent = useRef(false)
  useEffect(() => {
    if (sent.current) return
    sent.current = true
    track(event, ...props)
    // Once per mount by design: later prop changes are not new views.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

/** After "Delete all my data": PostHog forgets this phone's anonymous id. */
export function forgetAnalyticsId(): void {
  void client?.then((ph) => ph?.reset())
}
