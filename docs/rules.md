# The charge check: rules

Source: [RBI (Pre-payment Charges on Loans) Directions, 2025](https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12878), Circular RBI/2025-26/64, issued 2 July 2025. Applies to loans sanctioned or renewed on or after 1 January 2026. Covers commercial banks (excluding payments banks), co-operative banks, NBFCs and All India Financial Institutions.

Treat this file as the product's reading of the rule, not legal advice. Re-check the source before launch and whenever RBI updates it.

## What the rule says (summary)

- No prepayment or foreclosure charges on **floating-rate** loans to **individuals** for **non-business** purposes, whether the prepayment is partial or full, with no minimum lock-in.
- **Business** loans to individuals and to micro and small enterprises (floating rate):
  - No charges at all from commercial banks (excluding small finance, regional rural and local area banks), Tier 4 urban co-operative banks, upper-layer NBFCs and AIFIs.
  - No charges up to a sanctioned amount of ₹50 lakh from small finance banks, regional rural banks, Tier 3 urban co-operative banks, state and central co-operative banks and middle-layer NBFCs.
- Dual or special-rate loans: depends on whether the loan is floating at the time of prepayment.
- No charges when the lender itself initiates the prepayment.
- Whether charges apply must be disclosed in the sanction letter, the loan agreement and (where required) the Key Facts Statement. **Charges not disclosed this way cannot be collected.**
- Where charges are allowed (for example fixed-rate loans), they follow the lender's approved policy.

## Questionnaire (screen 09)

One question per screen. Pre-fill from the debt where known; the user can change answers.

1. **Which loan?** Pick from loans in the ledger (not cards or BNPL; the rule is about loans).
2. **Fixed or floating rate?** Fixed / Floating / Not sure.
3. **Sanctioned or renewed on or after 1 January 2026?** Yes / No / Not sure (pre-filled from `sanctionedOn`).
4. **Personal or business use?** Personal / Business / Not sure.
   - 4a, only if Business: **Who lent it?** (lender type list in `data-model.md`) and **Was the sanctioned amount ₹50 lakh or less?**
5. **Which charges are on the quote?** For each line: type (foreclosure charge, prepayment fee, admin or documentation fee, other, GST), amount, and "Is it listed in your sanction letter or Key Facts Statement?" Yes / No / Not sure.

## Is the loan covered? (`isCovered`)

| rateType | after 1 Jan 2026 | purpose | lender check | Result |
| --- | --- | --- | --- | --- |
| floating | yes | personal | n/a | **covered** |
| floating | yes | business | commercial bank (not SFB, RRB, LAB), Tier 4 UCB, NBFC upper layer, AIFI | **covered** |
| floating | yes | business | SFB, RRB, Tier 3 UCB, state/central co-op, NBFC middle layer, and amount ≤ ₹50 lakh = yes | **covered** |
| floating | yes | business | same lenders, amount > ₹50 lakh | **not covered** |
| floating | yes | business | NBFC base layer, local area bank, or other | **not covered** (verify against the source before launch) |
| fixed | any | any | n/a | **not covered** |
| floating | no | any | n/a | **not covered** (older loan) |
| any answer "Not sure" that decides the result | | | | **unknown** |

## Status for each charge line

| Line kind | Loan covered | Loan not covered | Unknown |
| --- | --- | --- | --- |
| foreclosure, prepayment_fee | `doesnt_add_up` | if disclosed = no → `ask_lender`; else `not_covered` | `ask_lender` |
| admin, other | if disclosed = no or unknown → `ask_lender`; else `matches` | same | same |
| gst | always `follows` (reason depends on whether a line it applies to is `doesnt_add_up` or `ask_lender`; see below) | same | same |

## Reason text (shown under each line)

| Status | Chip | Reason (fill in the loan details) |
| --- | --- | --- |
| doesnt_add_up | Doesn't add up | "RBI bars prepayment and foreclosure charges on floating-rate loans to individuals for personal use, sanctioned or renewed on or after 1 Jan 2026. This loan is floating-rate, personal, sanctioned {date}." (adapt the sentence for covered business loans) |
| not_covered | Rule does not cover it | Fixed rate: "That RBI rule covers floating-rate loans. This one is fixed-rate, so your loan agreement decides. Read its charges section." Older loan: "This loan was sanctioned before 1 Jan 2026, so the rule does not apply. Your loan agreement decides." |
| ask_lender | Ask the lender | Undisclosed charge: "Not listed in your sanction letter or Key Facts Statement. RBI says charges must be disclosed there. Ask where this one is." Unknown answers: "We couldn't tell whether the rule covers this loan. Ask the lender to confirm." |
| follows | Follows the charges | If a line it applies to is flagged or to be asked: "Falls away on any charge that comes off." Otherwise: "Applies only if the charge above stands." |
| matches | Matches | "Listed in your sanction letter." |

Summary line on screen 10: "₹{flaggedTotal} of charges on this quote may not be allowed" and, if any, "₹{toConfirmTotal} more to confirm with the lender". GST at 18% is included in both totals.

## Lender message template

```
Subject: Closing quote for my {loan name}, request to review charges

Hello,

I am preparing to close my {loan name} ({rate type} rate, sanctioned {date}). Your quote includes:
  - {flagged line label}: ₹{amount}
  ...

RBI's directions on prepayment charges bar these on floating-rate loans to individuals sanctioned or renewed on or after 1 January 2026. Please confirm they will be removed, or point me to the clause in my agreement that permits them.

Please also show me where the {ask-lender line label} (₹{amount}) is disclosed in my sanction letter or Key Facts Statement.

Please send a revised quote, including how GST has been recalculated.

Thank you,
[Your name]
Loan account: [number]
```

Omit the flagged block if nothing is flagged, and the "Please also" lines if nothing needs asking. Buttons: Copy message, Share on WhatsApp (`https://wa.me/?text=` with the encoded message).

## Fixture quotes

In the app the user enters only the charge lines; principal and interest are shown here so the fixture matches the prototype's full quote.

Personal loan (covered: floating, personal, sanctioned 14 Mar 2026):

| Line | Amount | Disclosed | Expected status |
| --- | --- | --- | --- |
| Outstanding principal | 2,10,000 | | not a charge (matches ledger) |
| Interest to the closing date | 1,820 | | not checked |
| Foreclosure charge (3% of principal) | 6,300 | yes | doesnt_add_up |
| Prepayment processing fee | 1,500 | yes | doesnt_add_up |
| Documentation and administration fee | 750 | no | ask_lender |
| GST at 18% on the charges above | 1,539 | | follows |

flaggedTotal = (6,300 + 1,500) × 1.18 = **9,204**. toConfirmTotal = 750 × 1.18 = **885**.

Car loan (not covered: fixed rate): foreclosure charge 8,400 (disclosed yes) → not_covered; GST 1,512 → follows ("Applies only if the charge above stands"); flaggedTotal 0.
