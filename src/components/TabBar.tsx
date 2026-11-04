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
 * Bottom nav: Home · Debts · Plan · Charges · Me, as a floating aubergine pill. Five equal slots,
 * so every icon stays in the same place on every screen; each shows its name under the icon. The
 * active tab sits on a marigold puck that slides between the slots.
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
        data-tour="tabbar"
        className="pointer-events-auto grid h-16 grid-cols-5 gap-1 rounded-full bg-aubergine-deep/85 p-1.5 ring-1 ring-white/12 backdrop-blur-md"
        style={{ boxShadow: '0 5px 0 0 var(--color-aubergine-deep), 0 16px 32px -10px rgba(34, 8, 30, 0.55)' }}
      >
        {TABS.map((t) => {
          const on = isActive(t)
          return (
            <li key={t.to}>
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
                  className={`relative flex flex-col items-center gap-0.5 ${on ? 'text-aubergine' : 'text-mauve'}`}
                  whileTap={{ scale: 0.88 }}
                  transition={springPress}
                >
                  <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth={on ? 2.3 : 1.8} strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d={ICONS[t.label]} />
                  </svg>
                  <span className={`text-[11px] leading-none tracking-[-0.01em] whitespace-nowrap ${on ? 'font-extrabold' : 'font-semibold'}`}>{t.label}</span>
                </motion.span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
