# Data model

All data lives in the browser under one localStorage key. Nothing is sent to a server.

## Storage

- Key: `vektrr:v1` (until November 2026 it was `ro:v1`; the app moves data from the old key on first open)
- Value: JSON of `{ state: AppData, version }` (below), written by the Zustand persist middleware. `version` equals `schemaVersion`.
- `schemaVersion` starts at 1. Any change to the shape adds a migration in `src/state/migrations.ts` and bumps the version. Version 2 (guided tours) added `settings.toursSeen`; the 1 → 2 step keeps everything else and starts it empty. Version 3 (account page) added `settings.haptics` and `settings.calmMotion`; the 2 → 3 step sets them to their defaults.
- Every read and write is wrapped in try/catch. If storage is unavailable (private mode, blocked, or a write fails later, for example when full), the app still works for the session and shows a one-line notice: "Your data won't be saved on this device."
- Damaged data never crashes the app: a value that isn't valid JSON, or comes from an unknown or newer version, starts fresh. Missing parts are filled with defaults, and stored debts without a numeric balance, rate and payment are dropped so the engine never sees `NaN`.
- "Delete all my data" (screen 11) removes the key and resets the store, after a confirmation.
- Deleting one debt also deletes its charge checks.

## Money and rates

- Money is stored as a number of rupees (not paise). The engine may produce fractions; round only when displaying.
- Rates are stored as a percentage per year: `42` means 42% a year.
- Dates are ISO strings: `'2026-03-14'`.

## Types

```ts
type DebtType =
  | 'credit_card' | 'personal_loan' | 'home_loan' | 'car_loan'
  | 'education_loan' | 'bnpl' | 'gold_loan' | 'other';

type RateType = 'fixed' | 'floating' | 'unknown';

interface Debt {
  id: string;                 // uuid
  name: string;               // user label, e.g. "HDFC Millennia card"; default from type
  type: DebtType;
  balance: number;            // rupees owed now, > 0
  apr: number;                // % a year, 0 to 60
  monthlyPayment: number;     // rupees the user pays each month (EMI, or usual card payment), > 0
  // Loans only (not credit_card or bnpl):
  rateType?: RateType;
  sanctionedOn?: string;      // sanctioned or last renewed, ISO date
  purpose?: 'personal' | 'business' | 'unknown';
  originalAmount?: number;    // loans: amount first borrowed, > 0
  lender?: string;            // loans and BNPL: as typed; stays on the phone, never in analytics
  monthsLeft?: number;        // loans: EMIs left; BNPL: instalments left; whole, 1 to 480
  // Cards only:
  creditLimit?: number;       // > 0
  dueDay?: number;            // day of the month the bill is due, 1 to 31
  createdAt: string;
  updatedAt: string;
  paidOffOn?: string;         // set by "Mark as paid off"
}

interface Profile {
  takeHomeMonthly?: number;   // optional; enables "share of take-home"
}

interface NextRupeeInput {
  amount: number;             // money to put somewhere
  buffer: number;             // kept aside, never used
  assumedReturn: number;      // % a year, user's assumption
}

type OptionId = 'apr' | 'size' | 'home' | 'invest' | 'save' | 'split';

interface SavedPlan {           // Milestone 2
  strategy: OptionId;
  chosenAt: string;
  input: NextRupeeInput;
  allocation: Record<string, number>;   // debtId -> rupees
}

interface CheckIn {              // Milestone 2
  id: string;
  date: string;
  balances: Record<string, number>;     // debtId -> balance on that date
}

type ChargeKind = 'foreclosure' | 'prepayment_fee' | 'admin' | 'other' | 'gst';
type ChargeStatus = 'doesnt_add_up' | 'ask_lender' | 'not_covered' | 'follows' | 'matches';

interface ChargeLine {
  kind: ChargeKind;
  label: string;
  amount: number;
  disclosed?: 'yes' | 'no' | 'unknown';  // listed in sanction letter or KFS?
}

interface ChargeCheck {
  id: string;
  debtId: string;
  createdAt: string;
  answers: {
    rateType: RateType;
    sanctionedOnOrAfter2026: 'yes' | 'no' | 'unknown';
    purpose: 'personal' | 'business' | 'unknown';
    lenderType?: LenderType;            // only asked for business purpose
    sanctionedAmountUpTo50L?: 'yes' | 'no' | 'unknown';
  };
  lines: ChargeLine[];
  results: { status: ChargeStatus; reason: string }[];   // same order as lines
  flaggedTotal: number;      // incl. GST on flagged lines
  toConfirmTotal: number;    // incl. GST on "ask the lender" lines
  message: string;           // drafted lender message
  outcome?: {                // Milestone 2, screen 19
    status: 'removed_all' | 'removed_some' | 'refused' | 'no_reply';
    amountRemoved?: number;
    recordedOn: string;
  };
}

type LenderType =
  | 'commercial_bank' | 'small_finance_bank' | 'regional_rural_bank' | 'local_area_bank'
  | 'urban_coop_tier4' | 'urban_coop_tier3' | 'state_or_central_coop'
  | 'nbfc_upper_layer' | 'nbfc_middle_layer' | 'nbfc_base_layer' | 'aifi' | 'unknown';

interface AppData {
  schemaVersion: 3;
  profile: Profile;
  debts: Debt[];
  lastNextRupee?: NextRupeeInput;
  plan?: SavedPlan;
  checkIns: CheckIn[];
  chargeChecks: ChargeCheck[];
  feedback: { wouldAct?: 'yes' | 'maybe' | 'no'; recommend?: 'not_likely' | 'maybe' | 'very_likely' };
  settings: {
    shareUsageCounts: boolean;   // Me tab "Share anonymous usage counts", default true
    haptics: boolean;            // Me "Vibrate on taps", default true (schema 3)
    calmMotion: boolean;         // Me "Calmer animations", default false (schema 3)
    toursSeen: TourId[];         // guided tours already shown: 'start' | 'overview' | 'results' | 'charge'
  };
}
```

## Validation (add-a-debt and edit forms)

| Field | Rule | Message |
| --- | --- | --- |
| balance | number > 0 | "Enter how much you owe" |
| apr | 0 to 60 | "Enter the yearly rate, for example 13 or 42" |
| monthlyPayment | number > 0 | "Enter what you pay each month" |
| monthlyPayment vs interest | if monthlyPayment ≤ balance × apr / 1200, allow but warn | "This payment doesn't cover the monthly interest, so the balance grows." |
| sanctionedOn | not in the future | "That date is in the future" |
| originalAmount (optional) | number > 0 | "Enter the amount you first borrowed" |
| monthsLeft (optional) | whole, 1 to 480 | "Enter a number from 1 to 480" |
| creditLimit (optional) | number > 0 | "Enter the card's limit" |
| dueDay (optional) | whole, 1 to 31 | "Enter a day from 1 to 31" |

Rate hints per type (helper text only, never pre-filled as a value) are in `beta-spec.md` screen 02.
