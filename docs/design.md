# Design

Figma file: https://www.figma.com/design/vO6zkBDsfXAc9ZhOsZBICQ (page "Beta wireframes").

The wireframes are low-fidelity on purpose: grey boxes, real words. Build the structure, flow and copy from them. Yellow boxes in Figma are team notes, not UI.

## Design language: Marigold

Chosen 27 October 2026 from the team's inspiration board. All twelve Milestone 1 screens are built in it. Surfaces by purpose: money moments (debts overview, next-rupee results and detail, the charge verdict, Home's hero) on the aubergine night surface; forms, questions and settings on calm ice silver.

**Palette** (tokens in `src/index.css`):

| Token | Hex | Job |
| --- | --- | --- |
| `aubergine` | #3A0F34 | Ink for all text; the "night" surface money moments sit on |
| `marigold` | #EAAA00 | The one action per screen, the answer's highlights, stamps, petals |
| `silver` | #DDE3E8 | Calm reading ground |
| `ice` | #F1F4F6 | Text on aubergine; the hero result slab |
| `mauve` | #CDB9C9 | Secondary text on aubergine |
| `plum-muted` | #5A4558 | Secondary text on silver or white |

Contrast rule: marigold is never text on a light ground (2:1). It is a fill under aubergine text, or text on aubergine (7.9:1). Every text pair passes 4.5:1.

**Type:** Schibsted Grotesk (self-hosted, variable 400–900). Answers at 900 with tight tracking (−0.04 to −0.05em). Display figures use normal digits: the font's tabular setting widens commas, which breaks Indian grouping. Tabular digits only in tables.

**Material:** raised slabs and pills with a hard offset shadow as their thickness (`shadow-slab`); pressing pushes them down onto it. Large radii (24–28px) on slabs, full pills on buttons.

**Motion** (Motion for React, presets in `src/ui/motion.ts`). One set of springs everywhere. Each money screen has one ritual:
- the answer figure arrives with the motion smear (`SmearIn`) and its digits roll in (`Odometer`);
- money visibly moves: the allocation strip fills, balances drain to what is left;
- a debt cleared gets a "Cleared" stamp, a burst of marigold petals and a vibration on Android.

The phone's "reduce motion" setting removes travel, smears, rolling and petals; the final values are always in the DOM for screen readers. Gains are framed as interest not paid, never as a prize.

**App icon and launch screen:** the full marigold on an aubergine tile. `scripts/make-icons.mjs` draws every size from the same petal rings as `src/ui/Marigold.tsx` (run `npm run icons` after changing either): a rounded 192/512 icon, a full-bleed maskable 512 with the flower inside the 40% safe circle, a 180 apple-touch icon, and a favicon using the eight-petal mark. Theme and background colour are aubergine, so Android's launch screen is the marigold on aubergine. iOS launch images are not made in the beta; iOS shows a blank screen briefly instead.

Numbers on screens 12 to 19 are illustrative. The engine is the source of truth.

## Screen index

| # | Screen | Figma frame | Tab | Milestone |
| --- | --- | --- | --- | --- |
| 01 | Welcome | 01 Welcome | none | M1 |
| 02 | Add a debt | 02 Add a debt | none | M1 |
| 03 | Debts, empty | 03 Debts · empty | Debts | M1 |
| 04 | Debts overview | 04 Debts · overview | Debts | M1 |
| 05 | Debt edit | 05 Debt detail | Debts | M1 |
| 06 | Next rupee, inputs | 06 Next rupee · inputs | Plan | M1 |
| 07 | Results | 07 Next rupee · results | Plan | M1 |
| 08 | Option detail | 08 Option detail | Plan | M1 |
| 09 | Charge check, question | 09 Charge check · question | Charges | M1 |
| 10 | Charge check, result | 10 Charge check · result | Charges | M1 |
| 11 | Me | 11 Me (feedback and settings) | Me | M1 |
| 12 | Home | 12 Home | Home | M1 (simplified), M2 (full) |
| 13 | Monthly check-in | 13 Monthly check-in | none | M2 |
| 14 | Check-in summary | 14 Check-in summary | none | M2 |
| 15 | Plan | 15 Plan | Plan | M2 |
| 16 | What-if | 16 What-if | Plan | M2 |
| 17 | Debt page | 17 Debt page | Debts | M2 |
| 18 | Charges hub | 18 Charges | Charges | M2 |
| 19 | Lender's reply | 19 Lender’s reply | Charges | M2 |

Screens 01 to 11 sit on the board "Beta flow · screens 01–11"; 12 to 19 on "The app · after onboarding · screens 12–19".

## Components (Figma → code)

| Figma component | Code component | Notes |
| --- | --- | --- |
| WF Button (Primary, Secondary, Text) | `Button` with `variant` | Full width by default |
| WF Input (label, value, hint) | `Field` | Hint optional; error text replaces the hint |
| WF Top bar (title, back) | `TopBar` | |
| WF Bottom nav (Home, Debts, Plan, Charges, Me) | `TabBar` | Marigold: a floating, blurred aubergine pill; the active tab is a marigold puck that slides over and shows its name, the rest are icons (names kept for screen readers) |
| WF Debt row (name, meta, amount) | `DebtRow` | Also used for allocation rows and rule-status rows |
| WF Stat (label, value) | `StatTile` | Two per row |
| WF Option card (Best, Default) | `OptionCard` | Bar width ∝ delta |
| WF Chip (selected or not) | `Chip` | Single-select groups |
| WF Charge row (Doesn't add up, Ask the lender, Matches, Follows the charges) | `ChargeRow` | Add a "Rule does not cover it" status in code |
| WF Note | not built | Team annotations only |
| WF Placeholder | `Placeholder` | For illustrations and charts until designed |
| WF Action row (M2) | `ActionRow` | Home to-do list |
| WF Plan step (Done, Now, Next, Later) | `PlanStep` | M2 |
| WF Slider | `Slider` | M2. Known Figma issue: the three sliders on screen 16 show the knob in the same place; ignore it |
| WF Check-in row | `CheckInRow` | M2 |
| WF Progress | `ProgressBar` | |

## Layout rules from the wireframes

- Phone frame 360 px wide, 20 px side padding, 16 px between blocks.
- Top bar 56 px; tab bar 64 px, floating 12 px above the bottom edge (plus the safe area) and 12 px in from the sides. Screens under it leave 76 px at the bottom.
- Cards: 10 px radius, 1 px border; selected or "best" cards use a 2 px dark border.
- Money is the largest text on any screen that shows a result.

## Working with Figma from Claude Code

The Figma connector reaches Claude Code if you log in with the claude.ai account that has it. The team's Figma plan currently has a low cap on connector calls, so if you hit it, export the frames as PNG and attach them instead of linking.

PNG exports of both boards and the component sheet are in `docs/design/wireframes/`. Build from these; re-export them when the Figma file changes.
