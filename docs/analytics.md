# Analytics

Purpose: learn how the 30 beta testers move through the app without ever seeing their money.

## Setup

- `posthog-js` with `autocapture: false`, `capture_pageview: false`, `disable_session_recording: true`, `person_profiles: 'identified_only'` (we never identify, so everyone stays anonymous).
- All calls go through `src/lib/analytics.ts` → `track(event, props)`. Nothing else imports PostHog.
- `track` does nothing when the Me-tab toggle "Share anonymous usage counts" is off.
- Key in `VITE_POSTHOG_KEY` (Vercel environment variable). Never commit keys.

## Never send

Money amounts, interest rates, balances, debt names, lender names, dates of loans, free text, form field values. `track` should reject any property whose name contains `amount`, `balance`, `rate`, `apr`, `name` or `text`, and drop numbers above 100 as a safety net.

## Events

| Event | When | Properties (allowed) |
| --- | --- | --- |
| `app_opened` | App start | `returning: boolean`, `standalone: boolean` (installed PWA) |
| `onboarding_started` | Get started on 01 | none |
| `debt_added` | Save on 02 | `type`, `has_rate_type: boolean`, `has_sanction_date: boolean`, `debt_count` |
| `debt_payment_below_interest` | Warning shown on 02 or 05 | `type` |
| `take_home_set` | Take-home saved | none |
| `overview_viewed` | 04 shown | `debt_count` |
| `next_rupee_compared` | Compare options on 06 | `option_count`, `split_shown: boolean` |
| `option_opened` | Card tapped on 07 | `option_id`, `rank` |
| `working_expanded` | Show the full working on 08 | `option_id` |
| `would_act_answered` | Chip on 07 | `answer: 'yes' \| 'maybe' \| 'no'`, `top_option_id` |
| `upload_fake_door_tapped` | Upload button on 02 or 13 | `screen` |
| `upload_waitlist_clicked` | Button in the fake-door sheet | `screen` |
| `charge_check_started` | 09 opened | `entry: 'overview' \| 'tab' \| 'debt_page'` |
| `charge_check_completed` | 10 shown | `covered: 'yes' \| 'no' \| 'unknown'`, `flag_count`, `ask_count`, `line_count` |
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
