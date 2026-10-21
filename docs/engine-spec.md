# Engine spec

The engine is a set of pure TypeScript functions in `src/engine/`. No React, no storage, no randomness, no clock (pass dates in). Port the logic from `docs/reference/prototype.html` (between `/*ENGINE_START*/` and `/*ENGINE_END*/`) and make it pass `docs/reference/engine-fixtures.json`.

## Constants

| Name | Value | Meaning |
| --- | --- | --- |
| `HORIZON_MONTHS` | 36 | Months every option is compared over |
| `SAVINGS_RATE` | 3 | % a year earned by the "keep it in savings" baseline |
| `GST_RATE` | 0.18 | GST on lender charges |
| `CLEARED_EPSILON` | 0.5 | A balance at or below ₹0.50 counts as cleared |

## 1. Ledger summary (`ledger.ts`)

For the list of active debts (not paid off):

- `totalOwed = Σ balance`
- `monthlyPayments = Σ monthlyPayment`
- `shareOfTakeHome = monthlyPayments / takeHomeMonthly` (only if take-home is set)
- `interestThisMonth = Σ balance × apr / 1200`
- `weightedApr = Σ (balance × apr) / totalOwed`
- `sortedByCost`: debts sorted by `apr` descending; ties by larger balance first. The first one is labelled "costs the most".

## 2. EMI helper (`pmt`)

`pmt(P, apr, n) = P × r / (1 − (1 + r)^−n)` with `r = apr / 1200`; if `r = 0`, `P / n`.
Used only to build test fixtures and as a suggestion; in the app, the user enters their own monthly payment.

## 3. Payoff time for one debt (`payoff.ts`)

`months = −ln(1 − r × B / A) / ln(1 + r)` with `r = apr / 1200`, balance `B`, monthly payment `A`.

- If `r = 0`: `months = B / A`.
- If `A ≤ r × B`: return `{ never: true }`. The UI says "This payment doesn't cover the monthly interest, so the balance grows."
- Round up to whole months for display ("about 20 months").

## 4. Month-by-month simulation (`simulate.ts`)

`simulate(debts, lump)` where `lump` maps debt id → rupees paid off today.

1. Start balances: `max(0, balance − lump[id])`.
2. `budget = Σ monthlyPayment` over all debts (fixed for the whole run; payments freed by cleared debts stay in the budget).
3. For each month `m = 1 … 36`:
   1. Interest accrues on every debt: `bal += bal × apr / 1200`; add to `totalInterest`.
   2. Each debt gets its own scheduled payment: `p = min(monthlyPayment, bal)`; `bal −= p`; `avail = budget − Σ p`.
   3. Any `avail` left (from cleared or nearly cleared debts) goes to the remaining debts in order of highest `apr` first, each taking `min(avail, bal)`.
   4. Whatever is still left is added to `spare` (it earns nothing in this version).
   5. Record `cleared[id] = m` the first month a balance falls to ≤ ₹0.50.
4. Return `{ totalInterest, spare, remaining: Σ max(0, bal), cleared }`.

## 5. Ranking options for the next rupee (`options.ts`)

Input: `{ amount, buffer, assumedReturn }`. Let `L = max(0, amount − buffer)` and `fv(rate) = (1 + rate / 1200)^36`.

`base = simulate(debts, {})`.

For a debt option with allocation `alloc` (total `used`):

```
s = simulate(debts, alloc)
delta = (base.remaining − s.remaining) + (s.spare − base.spare) − used × fv(SAVINGS_RATE)
```

`delta` is how much better off the user is after 36 months than if they had kept `L` in savings. Allocation fills debts in the given order, each up to its balance, until `L` runs out.

| Option id | Name in UI | Allocation order / value |
| --- | --- | --- |
| `apr` | Highest rate first | Debts by `apr` descending |
| `size` | Smallest balance first | Debts by `balance` ascending |
| `home` | Prepay the home loan | All of `L` to the home loan. Show only if a `home_loan` exists; if several, the largest balance |
| `invest` | Invest it | `delta = L × (fv(assumedReturn) − fv(SAVINGS_RATE))`; debts run as scheduled |
| `save` | Keep it in savings | `delta = 0` (the baseline) |
| `split` | Clear the costliest debts, invest the rest | See below; shown only sometimes |

**Split option.** Let `above` = debts with `apr > assumedReturn`, by `apr` descending. For `k = 1 … above.length`: allocate `L` across the first `k` debts; skip if nothing is used or everything is used (`used ≥ L − 0.5`); `delta = debt-part delta + (L − used) × (fv(assumedReturn) − fv(SAVINGS_RATE))`. Keep the best `k`. Show the split option only if its `delta > 1.05 × bestDebtDelta` (the best of `apr`, `size`, `home`) and `bestDebtDelta > 0`.

Sort all options by `delta` descending (stable). The first is labelled "Saves the most" (or "Comes out ahead" for `invest`).

If `L = 0`, every option's delta is 0. Show: "There is nothing left to put to work after the cash you are keeping aside."

## 6. Option detail (`explain.ts`)

Template sentences built from engine numbers only. No AI-generated numbers.

- `apr`: "{top debt} costs {apr}% a year. No savings account pays anywhere near that, and an investment return is never guaranteed, so the money goes there first." Then the allocation list, then "Freed-up monthly payments then roll to the next highest-rate debt."
- Other debt options: "This puts the money where you chose, not where it saves the most interest." plus the allocation list.
- `invest`: if `assumedReturn < top apr`: "...so paying it down comes out ahead." Otherwise: "Your assumed return is above that rate, so this wins on paper. Returns are not guaranteed and the debt cost is."
- `save`: "The money stays safe and earns about 3% while {top debt} keeps charging {apr}%."
- Freed monthly payment = Σ monthlyPayment of debts the allocation pays off completely (balance after the lump sum = 0). For the default fixture that is card 1 + card 2 = ₹8,500.
- Split option: prototype shows it whenever `delta > 1.05 × bestDebtDelta`. The added `bestDebtDelta > 0` guard is deliberate, so a negative best-debt delta can't make a weak split look good.

## 7. Charge check

See `docs/rules.md` for the decision table. Totals:

- `flaggedTotal = Σ amount of lines with status doesnt_add_up × (1 + GST_RATE)`
- `toConfirmTotal = Σ amount of lines with status ask_lender × (1 + GST_RATE)`
- GST lines are never flagged themselves; they always get status `follows`. Reason: "Falls away on any charge that comes off." when any line it applies to is `doesnt_add_up` or `ask_lender`, otherwise "Applies only if the charge above stands."

The lender message (`message.ts`) is built from the flagged and ask-lender lines. Template in `docs/rules.md`.

## Test fixtures (must pass, ±₹1)

Sample borrower (from the prototype). Loan monthly payments are `pmt(balance, apr, months)`:

| id | type | apr | balance | monthlyPayment | rateType | sanctionedOn |
| --- | --- | --- | --- | --- | --- | --- |
| home | home_loan | 8.75 | 38,00,000 | 33,581.01 (240 months) | floating | 2021-06-10 |
| car | car_loan | 9.5 | 4,20,000 | 13,453.84 (36 months) | fixed | 2023-04-05 |
| personal | personal_loan | 13 | 2,10,000 | 8,236.53 (30 months) | floating | 2026-03-14 |
| card1 | credit_card | 42 | 85,000 | 6,000 | | |
| card2 | credit_card | 38 | 22,000 | 2,500 | | |
| bnpl | bnpl | 30 | 18,000 | 6,000 | | |

Take-home: ₹1,45,000.

| Case | Expected |
| --- | --- |
| Ledger | total 45,55,000 · monthly 69,771.37 · share 48.12% · interest this month 37,430 · weighted APR 9.86% |
| Base simulation | cleared months: bnpl 4, card1 11, card2 11, personal 18, car 24; remaining after 36 months 30,96,948.87 |
| Next rupee 1,50,000 / buffer 30,000 / return 12% | L = 1,20,000. Order and deltas: apr +55,727.66 (card1 85,000, card2 22,000, bnpl 13,000) · size +55,660.50 (bnpl 18,000, card2 22,000, card1 80,000) · invest +40,406.09 · home +24,586.48 · save 0. No split. |
| Same, buffer 1,50,000 | L = 0, all deltas 0 |
| Same, return 36% | invest +2,16,507.23 first; split +1,07,792.59 (card1 85,000, invest 35,000) second; then apr, size, home, save |
| Same, return 45% | invest +3,20,312.90 first; no split (no debt costs more than 45%) |
| Amount 10,00,000 / buffer 30,000 / return 12% | L = 9,70,000. split +3,42,639.53 (card1 85,000, invest 8,85,000) first; invest +3,26,615.86; apr and size +2,39,462.51; home +1,98,740.74 |
| Card that never clears: balance 1,00,000, apr 42, payment 3,000 | payoff `never: true`; after 36 months remaining 1,35,003.80 |
| Personal-loan closing quote (rules.md) | flaggedTotal 9,204 · toConfirmTotal 885 |
| Car-loan closing quote | flaggedTotal 0 · foreclosure line "not covered" |

Machine-readable versions are in `docs/reference/engine-fixtures.json`.

## Known simplifications (fine for the beta, list them in the UI where relevant)

- Interest is monthly simple accrual on the balance; real card interest depends on billing cycles and fees.
- Payments are fixed for 36 months; floating-rate resets are not modelled.
- Prepayment charges are not included in the ranking.
- Tax benefits on home and education loan interest are not modelled. Say so on the results screen.
- `spare` earns nothing; the savings baseline earns 3%.
- The investment return is the user's assumption and is applied as monthly compounding.
