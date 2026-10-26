import { isActive } from '../../engine/ledger'
import type { EngineDebt, Profile } from '../../engine/types'
import { checkableLoans } from '../charges/chargeCheckState'

export type HomeAction =
  | { kind: 'take_home'; title: string; detail: string }
  | { kind: 'link'; title: string; detail: string; to: string }

/** "Needs your attention" for the M1 Home (docs/beta-spec.md screen 12), built from the data. */
export function homeActions(debts: readonly EngineDebt[], profile: Profile): HomeAction[] {
  const actions: HomeAction[] = []
  if (!profile.takeHomeMonthly) {
    actions.push({ kind: 'take_home', title: 'Add your take-home pay', detail: 'See what share of your income goes to debt' })
  }
  for (const loan of checkableLoans(debts.filter(isActive))) {
    const noRate = !loan.rateType || loan.rateType === 'unknown'
    if (noRate || !loan.sanctionedOn) {
      actions.push({
        kind: 'link',
        title: `Complete ${loan.name} for the charge check`,
        detail: noRate && !loan.sanctionedOn ? 'Add its rate type and sanction date' : noRate ? 'Add its rate type' : 'Add its sanction date',
        to: `/debts/${loan.id}`,
      })
    }
  }
  actions.push({ kind: 'link', title: 'Bonus or extra cash coming?', detail: 'See what it should do', to: '/plan' })
  return actions
}

/** "Good morning" before noon, "Good afternoon" until 5 pm, then "Good evening". */
export function greeting(hour: number): string {
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
}
