import { motion } from 'motion/react'
import { NavLink } from 'react-router'
import { springPress } from '../ui/motion'

const ICONS: Record<string, string> = {
  Home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  Debts: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  Plan: 'M3 17l6-6 4 4 8-8M14 7h7v7',
  Charges: 'M6 2h12v20l-3-2-3 2-3-2-3 2zM9 7h6M9 11h6M9 15h4',
  Me: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
}

const TABS = [
  { to: '/', label: 'Home', end: true },
  { to: '/debts', label: 'Debts', end: false },
  { to: '/plan', label: 'Plan', end: false },
  { to: '/charges', label: 'Charges', end: false },
  { to: '/me', label: 'Me', end: false },
] as const

/** Bottom nav: Home · Debts · Plan · Charges · Me. The active tab gets a marigold mark that slides between tabs. */
export function TabBar() {
  return (
    <nav aria-label="Main" className="sticky bottom-0 z-10 bg-white pb-[env(safe-area-inset-bottom)]">
      <ul className="flex h-16">
        {TABS.map((t) => (
          <li key={t.to} className="flex-1">
            <NavLink to={t.to} end={t.end} className="flex h-full flex-col items-center justify-center gap-1 text-xs">
              {({ isActive }) => (
                <motion.span className="flex flex-col items-center gap-1" whileTap={{ scale: 0.9 }} transition={springPress}>
                  <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth={isActive ? 2.2 : 1.7} strokeLinecap="round" strokeLinejoin="round"
                    className={isActive ? 'text-aubergine' : 'text-plum-muted'}>
                    <path d={ICONS[t.label]} />
                  </svg>
                  <span className={isActive ? 'font-extrabold text-aubergine' : 'text-plum-muted'}>{t.label}</span>
                  <span className="relative h-[3px] w-4">
                    {isActive && (
                      <motion.span layoutId="tab-mark" className="absolute inset-0 rounded-full bg-marigold" transition={springPress} />
                    )}
                  </span>
                </motion.span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
