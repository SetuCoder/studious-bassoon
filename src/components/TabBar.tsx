import { NavLink } from 'react-router'

const TABS = [
  { to: '/', label: 'Home', end: true },
  { to: '/debts', label: 'Debts', end: false },
  { to: '/plan', label: 'Plan', end: false },
  { to: '/charges', label: 'Charges', end: false },
  { to: '/me', label: 'Me', end: false },
] as const

/** WF Bottom nav: Home · Debts · Plan · Charges · Me. Icons stay placeholder squares until visual design. */
export function TabBar() {
  return (
    <nav aria-label="Main" className="sticky bottom-0 z-10 border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <ul className="flex h-16">
        {TABS.map((t) => (
          <li key={t.to} className="flex-1">
            <NavLink to={t.to} end={t.end} className="flex h-full flex-col items-center justify-center gap-1 text-xs">
              {({ isActive }) => (
                <>
                  <span aria-hidden className={`size-5 rounded-md ${isActive ? 'bg-neutral-800' : 'bg-neutral-300'}`} />
                  <span className={isActive ? 'font-semibold text-neutral-900' : 'text-neutral-500'}>{t.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
