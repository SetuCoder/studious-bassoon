# Analytics

Purpose: learn how the 30 beta testers move through the app without ever seeing their money.

## Setup

- `posthog-js` with `autocapture: false`, `capture_pageview: false`, `capture_pageleave: false`, `disable_session_recording: true`, `disable_surveys: true`, `advanced_disable_flags: true`, `person_profiles: 'identified_only'` (we never identify, so everyone stays anonymous), `persistence: 'localStorage'` (no cookies).
- All calls go through `src/lib/analytics.ts` → `track(event, props)`, typed against the event table below. `useTrackOnMount` sends a "screen shown" event once per visit. Nothing else imports PostHog.
- PostHog is loaded lazily on the first event, and only when a key is set. Without a key (local dev, tests) nothing is sent; in dev each event is logged to the console as `[track]`.
- `track` does nothing when the Me-tab toggle "Share anonymous usage counts" is off.
- "Delete all my data" sends `data_deleted`, then resets PostHog's anonymous id, so a fresh start is a new anonymous user.
- Key in `VITE_POSTHOG_KEY` (Vercel environment variable; copy `.env.example` to `.env.local` locally). `VITE_POSTHOG_HOST` is optional and defaults to PostHog's US cloud. Never commit keys.
- In the PostHog project settings, turn on "Discard client IP data".

## Never send

Money amounts, interest rates, balances, debt names, lender names, dates of loans, free text, form field values. As a safety net under the typed events, `track` (`sanitise`):
- drops any property whose name contains `amount`, `balance`, `rate`, `apr`, `name` or `text`, unless its value is a boolean (a yes/no can't carry an amount, so `has_rate_type` passes);
- keeps numbers only when they are whole counts from 0 to 100;
- keeps strings only when they are short ids (`a-z`, `0-9`, `_`, up to 40 characters), so typed text, rupee figures and dates can't slip through;
- drops everything else (objects, arrays, null).

## Events

| Event | When | Properties (allowed) |
| --- | --- | --- |
| `app_opened` | App start | `returning: boolean` (at least one debt saved on this phone), `standalone: boolean` (installed PWA) |
| `onboarding_started` | Get started on 01 | none |
| `debt_added` | Save on 02 | `type`, `has_rate_type: boolean`, `has_sanction_date: boolean`, `debt_count` |
| `debt_payment_below_interest` | Debt saved on 02 or 05 while the warning shows (not while typing, which would count passing values) | `type` |
| `take_home_set` | Take-home saved | none |
| `overview_viewed` | 04 shown | `debt_count` |
| `next_rupee_compared` | Compare options on 06 | `option_count`, `split_shown: boolean` |
| `option_opened` | Card tapped on 07 | `option_id`, `rank` |
| `working_expanded` | Show the full working on 08 | `option_id` |
| `would_act_answered` | Chip on 07 | `answer: 'yes' \| 'maybe' \| 'no'`, `top_option_id` |
| `upload_fake_door_tapped` | Upload button on 02 or 13 | `screen: 'add_debt'` (M2 adds the check-in) |
| `upload_waitlist_clicked` | Button in the fake-door sheet | `screen` |
| `charge_check_started` | 09 opened | `entry: 'overview' \| 'tab' \| 'debt_page'` (M1 has no debt-page entry yet) |
| `charge_check_completed` | "Check the charges" on 09, as 10 opens (not on revisits) | `covered: 'yes' \| 'no' \| 'unknown'`, `flag_count` (doesn't add up), `ask_count` (ask the lender), `line_count` |
| `lender_message_copied` | Copy on 10 | none |
| `lender_message_shared` | WhatsApp on 10 | none |
| `feedback_form_opened` | Button on 11 | none |
| `recommend_answered` | Chip on 11 | `answer` |
| `data_deleted` | Confirmed delete | none |
| M2: `checkin_saved` | Save on 13 | `changed_count`, `matched_all: boolean` |
| M2: `plan_saved` | Save plan on 08 or 16 | `strategy` |
| M2: `whatif_used` | Slider moved on 16 | none (send once per visit) |
| M2: `charge_outcome_saved` | Save on 19 | `status` |

## The beta funnel

`app_opened` → `onboarding_started` → `debt_added` (at least 2) → `overview_viewed` → `next_rupee_compared` → `would_act_answered` → `charge_check_completed` → `feedback_form_opened`.

Also watch: share answering "yes" to `would_act_answered`, and `upload_fake_door_tapped` per tester (demand for statement upload).
