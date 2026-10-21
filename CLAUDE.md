# Repayment Optimiser (beta)

A mobile-first web app for people in India who hold several loans and credit cards. They add their debts, see the whole picture, get a ranked answer to "what should my next rupee do?", and check loan charges against RBI rules. "Repayment Optimiser" is a working name; keep it in one constant (`APP_NAME`) so it is easy to change.

Read these before any non-trivial change:

| File | What it holds |
| --- | --- |
| `docs/beta-spec.md` | Scope, milestones, every screen's behaviour and states |
| `docs/engine-spec.md` | The maths: formulas, options, edge cases, known simplifications |
| `docs/rules.md` | The RBI prepayment-charge rule as a decision table |
| `docs/data-model.md` | Types and the localStorage schema |
| `docs/analytics.md` | Events we track, and what must never be sent |
| `docs/design.md` | Figma link, screen index, components, tab structure |
| `docs/product.md` | Background: problem, users, positioning, principles |
| `docs/reference/prototype.html` | The earlier prototype. Its engine is the reference implementation |
| `docs/reference/engine-fixtures.json` | Expected engine outputs for the sample borrower |

## Hard rules

1. **All money maths lives in `src/engine/` as pure TypeScript functions with Vitest tests.** UI components never calculate money; they call the engine and format the result.
2. **Engine changes need tests.** Every change to `src/engine/` adds or updates a test, and `npm test` must pass. The fixtures in `docs/reference/engine-fixtures.json` must keep passing (tolerance ±₹1) unless the spec is deliberately changed.
3. **No backend in the beta.** All user data stays in the browser (localStorage, one versioned key). No accounts, no login, no server database. A "Delete all my data" button must always work.
4. **No investment advice.** Copy says the app "shows the cost of each option". Never name or recommend a fund, stock or financial product. Investment return is always the user's own assumption, labelled "not guaranteed".
5. **Lender messages are questions, never accusations.** "Please confirm or point me to the clause" style. We draft; the user sends. The app never contacts a lender.
6. **Analytics never contain money amounts, rates, names, dates of loans or free text.** Only event names and coarse properties (see `docs/analytics.md`).
7. **Mobile first.** Design for 360 px wide; test on a phone. Touch targets at least 44 px.
8. **Indian formatting.** Rupees with Indian digit grouping (₹45,55,000), no decimals in the UI. Use `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })`.
9. **Plain, specific copy.** Short sentences. No jargon without a one-line explanation. Disclaimers: "Shows the cost of each option. Not financial advice." and, on charge checks, "A guide to what to ask, not legal advice."

## Stack

- Vite + React + TypeScript (strict mode)
- Tailwind CSS
- React Router (tabs: Home, Debts, Plan, Charges, Me)
- Zustand for app state, persisted to localStorage via its persist middleware
- Vitest (+ React Testing Library for components)
- vite-plugin-pwa (installable to the home screen)
- posthog-js for anonymous events (autocapture off)
- Hosted on Vercel: `main` deploys to production, every pull request gets a preview URL

## Commands

```bash
npm install
npm run dev -- --host   # open the printed network URL on a phone on the same Wi-Fi
npm test                # Vitest, must pass before every commit
npm run build
npm run lint
```

## Folder layout

```
src/
  engine/        pure functions + tests (ledger, simulate, options, payoff, rules, message)
  state/         Zustand store, persistence, schema migrations
  screens/       one folder per screen (see docs/design.md for the index)
  components/    reusable UI matching the Figma wireframe components
  lib/           formatting, analytics wrapper, constants
docs/            specs (this pack)
```

## How to work in this repo

- One feature per branch and pull request. Keep changes small.
- Build screens in milestone order (docs/beta-spec.md). Do not start Milestone 2 screens until Milestone 1 ships.
- When a spec is unclear, ask instead of guessing. When you change a behaviour, update the matching doc in the same pull request.
- Numbers shown on the Figma screens 12 to 19 are illustrative. The engine is the source of truth.
