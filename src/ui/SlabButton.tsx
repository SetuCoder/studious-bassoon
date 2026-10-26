import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { tap } from './haptics'
import { springPress } from './motion'

export type SlabVariant = 'marigold' | 'ice' | 'ink' | 'outline' | 'line'

// A raised pill: the hard shadow underneath is its thickness. Pressing pushes it down
// onto that shadow, like a physical key.
const look: Record<SlabVariant, { className: string; shadow: string }> = {
  marigold: { className: 'bg-marigold text-aubergine', shadow: 'var(--shadow-slab-marigold)' },
  ice: { className: 'bg-ice text-aubergine', shadow: '0 5px 0 0 #9AA5AF' },
  /** Serious actions (delete): aubergine, so destroying data never wears the brand marigold. */
  ink: { className: 'bg-aubergine text-ice', shadow: 'var(--shadow-slab)' },
  /** Secondary on the night surface. */
  outline: { className: 'border-2 border-ice/70 text-ice', shadow: '0 0 0 0 transparent' },
  /** Secondary on the day surface. */
  line: { className: 'border-2 border-aubergine text-aubergine', shadow: '0 0 0 0 transparent' },
}

const base =
  'relative flex h-14 w-full items-center justify-center rounded-full px-6 text-[17px] font-extrabold tracking-[-0.01em] select-none disabled:cursor-not-allowed'

interface CommonProps {
  variant?: SlabVariant
  children: ReactNode
}

const pressed = { y: 5, boxShadow: '0 0 0 0 rgba(0,0,0,0)' }

export function SlabButton({
  variant = 'marigold', children, disabled, type = 'button', onClick,
}: CommonProps & { disabled?: boolean; type?: 'button' | 'submit'; onClick?: () => void }) {
  const v = look[variant]
  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={() => {
        tap()
        onClick?.()
      }}
      className={`${base} ${disabled ? 'bg-aubergine-raised text-mauve' : v.className}`}
      style={{ boxShadow: disabled ? 'none' : v.shadow }}
      whileTap={disabled ? undefined : pressed}
      transition={springPress}
    >
      {children}
    </motion.button>
  )
}

const MotionLink = motion.create(Link)

export function SlabLink({ variant = 'marigold', children, to }: CommonProps & { to: string }) {
  const v = look[variant]
  return (
    <MotionLink
      to={to}
      onClick={() => tap()}
      className={`${base} ${v.className}`}
      style={{ boxShadow: v.shadow }}
      whileTap={pressed}
      transition={springPress}
    >
      {children}
    </MotionLink>
  )
}
