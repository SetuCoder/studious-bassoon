# Design

Figma file: https://www.figma.com/design/vO6zkBDsfXAc9ZhOsZBICQ (page "Beta wireframes").

The wireframes are low-fidelity on purpose: grey boxes, real words. Build the structure, flow and copy from them. Visual design (colours, type, brand) is not decided yet; use a clean neutral Tailwind theme so it can be restyled later. Yellow boxes in Figma are team notes, not UI.

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
| WF Bottom nav (Home, Debts, Plan, Charges, Me) | `TabBar` | |
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
- Top bar 56 px; tab bar 64 px.
- Cards: 10 px radius, 1 px border; selected or "best" cards use a 2 px dark border.
- Money is the largest text on any screen that shows a result.

## Working with Figma from Claude Code

The Figma connector reaches Claude Code if you log in with the claude.ai account that has it. The team's Figma plan currently has a low cap on connector calls, so if you hit it, export the frames as PNG and attach them instead of linking.

PNG exports of both boards and the component sheet are in `docs/design/wireframes/`. Build from these; re-export them when the Figma file changes.
