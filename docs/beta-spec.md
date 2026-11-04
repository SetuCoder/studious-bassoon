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
- Logo placeholder, headline "All your debts. One clear picture." with the line "And where your next ₹₹₹ should go.", body "Add your loans and cards in two minutes. We'll show what each one really costs you.", "Private by design" box ("No bank login. No SMS access. Your numbers stay on this phone.").
- One button: **Get started** → 01a How it works, then 03.
- Footer: "Beta. Shows the cost of each option; not financial advice."
- Shown only on first run (until at least one debt is saved).

### 01a How it works
- Its own night screen, no tab bar, opened by **Get started** on Welcome or from Me. Back returns where it came from. From Welcome, **Skip to adding my debts** under Next goes straight to 03.
- Three chapters, swiped or stepped with **Next**, with a chapter bar on top that jumps to any chapter: **See everything you owe** (a mini overview), **Know what your next rupee should do** (the top option with its rolling gain and allocation strip), **Closing a loan? Don't pay what you don't owe.** (the verdict with stamps landing). Each scene uses the sample borrower's real engine results, labelled "Example numbers".
- Last chapter: "No bank login. No SMS access. Nothing leaves your phone. We'll point things out as you go." Then **Add my first debt** (→ 03) or, with debts already saved, **Back to the app**.

### Guided tours (all builds, no special mode)
The first time someone reaches certain screens, the screen dims and a marigold halo rings one feature at a time, with a card saying what it does (**Next**, **Skip the tour**, **Got it** on the last; Escape skips). Each tour runs once per phone (`settings.toursSeen`). Me → **Show me around again** clears them so they replay. Steps whose feature isn't on screen are skipped (a cards-only borrower sees no charge-check step).

| Tour | Screen | Steps |
| --- | --- | --- |
| `start` | 03 Debts, empty | Add your first debt · Take-home (optional) · The tab bar |
| `overview` | 04 Debts overview | Total owed · The costliest debt · Next rupee · Charge check (loans only) · Add another debt |
| `results` | 07 Results | The top option · Where the money goes · Every other option · Would you act on this? |
| `charge` | 10 Charge check, result | What may not be allowed · A stamped charge · The message to your lender |

Each waits for its screen's entrance to finish before dimming.

### 02 Add a debt
- Type chips: Credit card, Personal loan, Home loan, Car loan, Education loan, BNPL, Gold loan, Other. Default: Credit card.
- The same four required numbers, worded for the type:

  | | Card | BNPL | Loans |
  | --- | --- | --- | --- |
  | Name | Card name | App or store | Name (optional) |
  | Balance | How much is on the card? | How much is left to pay? | How much is left on the loan? ("principal outstanding") |
  | Rate | Interest rate (% a year), hint "usually 36–45%… 3–3.75% a month" | Interest or fee rate, hint "Enter 0 if it's interest-free" | Interest rate, with the type's usual range as a hint |
  | Payment | What you usually pay each month ("Paying only the minimum due? Enter that.") | Monthly instalment | Your EMI (gold loans: "Paying only the interest each month? Enter that.") |

- Default name "{Type} {n}", or "{Lender} {type}" when a loan's lender is given ("SBI home loan").
- "About this loan" (loans only): Fixed / Floating / Not sure chips; Sanctioned or renewed on (date, optional); Personal / Business use chips (not asked for home and education loans, which are saved as personal).
- **More details (optional)**, folded on 02 and open on 05: cards: Credit limit, Bill due on (day of the month); BNPL: Instalments left; loans: Lender, Amount you first borrowed, EMIs left. A mistake in them unfolds the section. Each type keeps only its own details when saved.
- Validation per `docs/data-model.md`. The "payment doesn't cover interest" case is a warning, not a block.
- **Save debt** → 04. **Upload a statement instead** → fake-door sheet.

### 03 Debts, empty
- Placeholder illustration, "No debts added yet", body copy, optional **Your first name** (for Home's greeting) and **Monthly take-home pay** fields (saved on blur), **Add your first debt** → 02.

### 04 Debts overview
- Stat tiles: Total owed, Paid each month, Share of take-home (hidden if no take-home), Interest this month.
- "Costing you the most, on top" list from `ledger.sortedByCost`; the first row's meta ends "· costs the most".
- Row tap → 05 (M1) or 17 (M2).
- Buttons: **Got extra money? See where it helps most** → 06. **Closing a loan early? Verify your charges** → 09 (only if at least one loan exists). **+ Add another debt** → 02.

### 05 Debt edit (M1)
- Same fields as 02, pre-filled, More details open. Info box: "At ₹{payment} a month, this clears in about {n} months." (or the never-clears warning) and "Interest this month: ₹{x}". Then, when the details allow: "Using {x}% of your ₹{limit} limit.", "Bill due on the {nth} of each month.", "You've repaid {x}% of the ₹{original} you borrowed.", "Your lender says {n} EMIs left; at this payment we work out about {m}."
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
Written for someone who has never heard of a closing quote. Questions and pre-fills in `docs/rules.md`.
- **Explainer** (the person's first check only): "Make sure you're not overcharged.", what a closing quote is and that RBI bars many closing charges since 2026, a night card "What you get" (a verdict per charge, how much may not be allowed, a message for the lender), and "You'll need the closing quote" (also called a foreclosure letter or closure statement; where to ask for it). **Start the check**.
- **Which loan are you closing?** Only when there are several loans and none was chosen by the link.
- **About your {loan}**: the three things the rule depends on, on one screen, each with a line on why it matters, pre-filled from the debt's details.
- **What charges are on the quote?** Charge lines: the type as chips (Foreclosure, Prepayment fee, Admin fee, GST, Something else) with a one-line explanation of the chosen one, the amount, and "Is this charge written in your loan papers?" (explained as the sanction letter or Key Facts Statement). "+ Add another charge". At least one line is required.
- Progress reads "Step 1 of 2" (the explainer isn't counted). Back steps through the screens.

### 10 Charge check, result
- Summary: "₹{flaggedTotal} of charges on this quote may not be allowed" and "₹{toConfirmTotal} more to confirm with the lender" (each line hidden when 0).
- A row per line with amount, chip and reason (`docs/rules.md`).
- "Message to your lender" with **Copy message** and **Share on WhatsApp**.
- Footer: "A guide to what to ask, not legal advice."
- The check is saved to `chargeChecks`.

### 11 Me ("Your account")
- A night card: "Your Vektrr", "Saved on this phone. No sign-in needed.", with counts of debts tracked and charge checks.
- Linked accounts, each marked **Soon**: bank accounts (Account Aggregator), credit report, card and loan statements. Not built; nothing to tap.
- Preferences: **Currency** (₹ Indian rupee; US dollar, UAE dirham and British pound listed but disabled, "soon"), **Vibrate on taps** (default on; turns off every buzz), **Calmer animations** (default off; same effect as the phone's reduce-motion setting).
- Help: **How it works** (→ 01a) and **Show me around again** (replays the guided tours; reads "The guide will show on each screen" when none have been seen yet).
- Privacy and your data: "Everything you enter stays on this phone. We can't see it." Toggle "Share anonymous usage counts" (default on; when off, no events are sent). **Delete all my data** (confirm).
- About: version, "Shows the cost of each option. Not financial advice." and "Charge checks are a guide to what to ask, not legal advice."

### 12 Home (M1 version)
- Night band: "Good morning" (or afternoon, evening), with the first name in marigold on its own line when it's known (asked on 03 and on Me, optional). "₹{totalOwed} owed", "Across {n} debts", and four tiles: Paid each month, Interest this month, Average rate (weighted by balance), Of your take-home (or the number of debts when take-home isn't set).
- "Debt-free by {Month Year}": "In about {x years y months}, if you keep paying ₹{monthlyPayments} a month and each payment that frees up goes to the costliest debt left." Then "First to clear: {debt}, in about {n months}." When a debt never clears: "Not at today's payments".
- "This month's payments": "{x}% goes to interest", a bar, and the split in rupees (Interest; Pays down what you owe).
- "Your debts, costliest first": the top three, each opening its page, and **See all {n} debts** → 04.
- Focus box "Costs you the most": "{costliest debt}, at {apr}%: about ₹{its interest this month} in interest this month." with **See where extra money helps most** → 06. A fact, not a recommendation: whether extra money should go there depends on the comparison (an assumed return can beat a cheap loan).
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

## Demo mode

For live demos, any build accepts `?demo`: it loads the sample borrower from `docs/reference/engine-fixtures.json` (named Riya, with the two cards shown as HDFC Infinia and Axis Magnus, with limits and due dates; the numbers are the fixture's) plus a saved check of the fixture's personal-loan closing quote, and opens Debts. `?demo=charge` opens that saved check (loading the demo first if needed). If the browser holds someone's own debts, the app asks before replacing them and changes nothing on "Cancel". The dev server also keeps `?sample` (borrower only, opens Plan).

## Definition of done for M1

- [ ] All M1 screens built per this spec and checked on a 360 px phone.
- [ ] Engine fixtures pass (`npm test`).
- [ ] Fresh install → add 3 debts → ranking → option detail → charge check → copy message, without errors.
- [ ] Delete all my data works and the app returns to 01.
- [x] Installable to the home screen (PWA manifest and icon).
- [ ] Analytics events fire as listed, and none carry amounts.
- [ ] Feedback and waitlist form URLs set.
- [ ] Deployed on Vercel from `main`; link tested on Android and iPhone.
