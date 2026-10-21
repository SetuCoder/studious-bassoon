# Beta spec

Goal: 30 real testers (two or more loans or cards each) use the app with their own numbers and give feedback. As of 21 October 2026.

## Scope

**In the beta:** manual quick-add of debts, the debts overview, the "next rupee" ranking with its working, the question-based charge check with a drafted lender message, Home, feedback, and on-device data with a delete button.

**Shown but not built ("coming soon" fake doors):** statement upload. Tapping it opens a sheet: "Coming soon. Want early access?" with a button that opens `WAITLIST_FORM_URL`. Count taps (`docs/analytics.md`).

**Not in the beta:** accounts or login, any server or database, bank linking, SMS reading, statement parsing, credit score, offer comparison, card-for-purchase, payments of any kind, push notifications.

## Milestones

| Milestone | Screens (see `docs/design.md`) | Ships when |
| --- | --- | --- |
| **M1, beta for 30 testers** | 01 Welcome, 02 Add a debt, 03 Debts empty, 04 Debts overview, 05 Debt edit, 06 Next rupee inputs, 07 Results, 08 Option detail, 09 Charge check questions, 10 Charge check result, 11 Me, 12 Home (M1 version) | Definition of done below is met |
| **M2, the monthly loop** | 13 Monthly check-in, 14 Check-in summary, 15 Plan, 16 What-if, 17 Debt page (replaces 05 as the tap target), 18 Charges hub, 19 Lender's reply, full Home | After M1 feedback is in |

## Navigation

Bottom tabs on every main screen: **Home · Debts · Plan · Charges · Me**.

| Tab | M1 root screen | M2 root screen |
| --- | --- | --- |
| Home | 12 (M1 version) | 12 (full) |
| Debts | 03 if no debts, else 04 | same |
| Plan | 06 | 15 if a plan is saved, else 06 |
| Charges | 09 (starts a check) | 18 |
| Me | 11 | 11 |

Flows without the tab bar: 01, 02, 09 question steps, 13.

**First run:** 01 Welcome → 03 Debts empty (optional take-home) → 02 Add a debt → after saving, 04 overview with "Add another debt". Once at least one debt exists, all tabs work. The app opens on Home (12) for returning users.

## Screens

### 01 Welcome
- Logo placeholder, headline "See everything you owe. Know what to do with your next rupee.", one-line body, "Private by design" box ("No bank login. No SMS access. Your numbers stay on this phone.").
- Buttons: **Get started** → 03. **How does it work?** → a short sheet with three steps (add debts, see your plan, check charges).
- Footer: "Beta. Shows the cost of each option; not financial advice."
- Shown only on first run (until at least one debt is saved).

### 02 Add a debt
- Type chips: Credit card, Personal loan, Home loan, Car loan, Education loan, BNPL, Gold loan, Other. Default: Credit card.
- Fields: Name (optional; default "{Type} {n}"), How much do you owe? (₹), Interest rate (% a year), What you pay each month (₹).
- Loans only (hidden for credit card and BNPL): Fixed / Floating / Not sure chips; Sanctioned or renewed on (date, optional, hint "Needed for the charge check"); Personal / Business use chips.
- Validation per `docs/data-model.md`. The "payment doesn't cover interest" case is a warning, not a block.
- **Save debt** → 04. **Upload a statement instead** → fake-door sheet.

### 03 Debts, empty
- Placeholder illustration, "No debts added yet", body copy, optional **Monthly take-home pay** field (saved on blur), **Add your first debt** → 02.

### 04 Debts overview
- Stat tiles: Total owed, Paid each month, Share of take-home (hidden if no take-home), Interest this month.
- "Most expensive first" list from `ledger.sortedByCost`; the first row's meta ends "· costs the most".
- Row tap → 05 (M1) or 17 (M2).
- Buttons: **What should my next rupee do?** → 06. **Check a closing quote** → 09 (only if at least one loan exists). **+ Add another debt** → 02.

### 05 Debt edit (M1)
- Same fields as 02, pre-filled. Info box: "At ₹{payment} a month, this clears in about {n} months." (or the never-clears warning) and "Interest this month: ₹{x}".
- **Save changes**, **Delete this debt** (confirm first).

### 06 Next rupee, inputs
- Money you have to use (default 1,50,000 on first visit, then last used), Keep aside as a safety buffer (default 30,000), Assumed yearly return (default 12%, hint "Not guaranteed. We don't recommend any product.").
- Live summary: "₹{L} to put to work" and "₹{amount} minus your ₹{buffer} buffer". If L = 0, the summary says so and the button is disabled.
- **Compare options** → 07.

### 07 Results
- Lead: "Over 36 months, compared with leaving ₹{L} in savings at 3%:"
- Ranked option cards (`options.ts`): rank, name, "+₹{delta}" (or ₹0), one-line note, bar proportional to delta (the top option fills the bar).
- "Would you act on this?" chips Yes / Maybe / No. Saving the answer is the key beta metric (`would_act_answered`).
- Footer: "Shows the cost of each option. Not financial advice. Tax benefits are not included."
- Card tap → 08.

### 08 Option detail
- Big "+₹{delta}" and "better off after 36 months than keeping it in savings".
- "Where the ₹{L} goes": a row per allocated debt with "{apr}% · ₹{before} → ₹{after}" and the amount.
- "Why this order" box from `explain.ts`, including the freed-payment sentence when relevant.
- **Show the full working** → expandable month-by-month table (month, balance per debt, interest that month).
- **Done** → Home. M2 adds **Save as my plan**.

### 09 Charge check, questions
- One question per screen with a progress bar ("Question 2 of 5"), Back and Next. Questions and pre-fills in `docs/rules.md`.
- Step 5 lets the user add charge lines (type, amount, disclosed?) with "+ Add another charge". At least one line is required.
- "Why we ask" box on the rate question: "The RBI rule on prepayment charges only covers floating-rate loans."

### 10 Charge check, result
- Summary: "₹{flaggedTotal} of charges on this quote may not be allowed" and "₹{toConfirmTotal} more to confirm with the lender" (each line hidden when 0).
- A row per line with amount, chip and reason (`docs/rules.md`).
- "Message to your lender" with **Copy message** and **Share on WhatsApp**.
- Footer: "A guide to what to ask, not legal advice."
- The check is saved to `chargeChecks`.

### 11 Me
- "Help us build this" with **Open the 2-minute feedback form** (opens `FEEDBACK_FORM_URL` in a new tab).
- "How likely are you to recommend this to a friend?" chips.
- Your data: "Everything you entered is stored only on this phone. We can't see it." **Delete all my data** (confirm).
- Toggle: "Share anonymous usage counts" (default on; when off, no events are sent).
- About: "Beta 0.1. Shows the cost of each option. Not financial or legal advice."

### 12 Home (M1 version)
- "₹{totalOwed} owed", stat tiles (Paid each month, Interest this month).
- Focus box: "{costliest debt} costs the most at {apr}%. Any extra money should go there first." with **See your options** → 06.
- "Needs your attention" list built from data: no take-home set → "Add your take-home pay"; any loan without rate type or sanction date → "Complete {loan} for the charge check"; always → "Bonus or extra cash coming? See what it should do" → 06.
- M2 adds: progress since start, debts cleared, saved so far, check-in reminder, open lender questions.

### 13 to 19 (M2)
Follow the Figma screens and their notes. Key behaviours:
- **13 Check-in:** each active debt with last balance and a field pre-filled with the plan's expected balance; "Everything matches what you expected" fills all; Save creates a `CheckIn` and updates balances.
- **14 Summary:** change in total since the first check-in or since setup, interest this month vs at setup, debts cleared.
- **15 Plan:** saved strategy, projected "debt-free except the home loan" month (from `simulate` with the saved allocation; if beyond 36 months, extend the simulation for this projection only), steps as Done / Now / Next / Later.
- **16 What-if:** sliders for extra each month, one-time amount, assumed return; recompute live; Save replaces the plan.
- **17 Debt page:** balance, rate, purpose, paid since start, monthly payment, interest this month, place in plan, the rule status for loans, balance chart from check-ins.
- **18 Charges hub:** saved total (confirmed outcomes only), open questions, rule status per loan.
- **19 Lender's reply:** outcome chips, amount removed, escalation box ("lender's grievance officer, then the RBI Ombudsman").

## Empty, error and edge states (all screens)

- Storage unavailable: one-line banner, app still works for the session.
- One debt only: ranking still works; "Smallest balance first" and "Highest rate first" become identical, so show only one of them.
- No loans (cards only): hide charge-check entry points and show "The charge check is for loans."
- Very large numbers: format with Indian grouping; never wrap a rupee amount across lines.

## Definition of done for M1

- [ ] All M1 screens built per this spec and checked on a 360 px phone.
- [ ] Engine fixtures pass (`npm test`).
- [ ] Fresh install → add 3 debts → ranking → option detail → charge check → copy message, without errors.
- [ ] Delete all my data works and the app returns to 01.
- [ ] Installable to the home screen (PWA manifest and icon).
- [ ] Analytics events fire as listed, and none carry amounts.
- [ ] Feedback and waitlist form URLs set.
- [ ] Deployed on Vercel from `main`; link tested on Android and iPhone.
