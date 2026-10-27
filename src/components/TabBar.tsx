import { motion } from 'motion/react'
import { NavLink, useLocation } from 'react-router'
import { tap } from '../ui/haptics'
import { springPress, springSettle } from '../ui/motion'

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

/**
 * Bottom nav: Home · Debts · Plan · Charges · Me, as a floating aubergine pill. The active tab
 * is a marigold puck that slides across and opens to show its name; the others are icons only
 * (their names stay in the DOM for screen readers).
 */
export function TabBar() {
  const { pathname } = useLocation()
  const isActive = (t: (typeof TABS)[number]) => (t.end ? pathname === t.to : pathname.startsWith(t.to))

  return (
    <nav
      aria-label="Main"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[480px] px-3 pb-[calc(12px+env(safe-area-inset-bottom))]"
    >
      <ul
        className="pointer-events-auto flex h-16 items-stretch gap-1 rounded-full bg-aubergine-deep/85 p-1.5 ring-1 ring-white/12 backdrop-blur-md"
        style={{ boxShadow: '0 5px 0 0 var(--color-aubergine-deep), 0 16px 32px -10px rgba(34, 8, 30, 0.55)' }}
      >
        {TABS.map((t) => {
          const on = isActive(t)
          return (
            <motion.li key={t.to} layout transition={springSettle} className={on ? 'flex-[2.2]' : 'flex-1'}>
              <NavLink
                to={t.to}
                end={t.end}
                onClick={() => tap()}
                className="relative flex h-full min-w-11 items-center justify-center rounded-full outline-offset-2 focus-visible:outline-2 focus-visible:outline-marigold"
              >
                {on && (
                  <motion.span
                    layoutId="tab-puck"
                    className="absolute inset-0 rounded-full bg-marigold"
                    style={{ boxShadow: 'inset 0 -3px 0 0 var(--color-marigold-deep)' }}
                    transition={springSettle}
                  />
                )}
                <motion.span
                  layout="position"
                  className={`relative flex items-center gap-1.5 ${on ? 'text-aubergine' : 'text-mauve'}`}
                  whileTap={{ scale: 0.88 }}
                  transition={springPress}
                >
                  <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth={on ? 2.3 : 1.8} strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d={ICONS[t.label]} />
                  </svg>
                  <span className={on ? 'text-[14px] font-extrabold tracking-[-0.01em] whitespace-nowrap' : 'sr-only'}>{t.label}</span>
                </motion.span>
              </NavLink>
            </motion.li>
          )
        })}
      </ul>
    </nav>
  )
}
