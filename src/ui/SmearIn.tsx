import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

const EASE_OUT = [0.16, 1, 0.3, 1] as const

interface SmearInProps {
  children: ReactNode
  /** The figure as plain text, drawn as the marigold ghost. */
  ghost: string
  delay?: number
  /** Type size and weight; the ghost and the figure share it. */
  className?: string
}

/**
 * The signature move from the inspiration board: the answer arrives as a motion smear
 * (a marigold ghost streaking in from the left) and settles sharp. Used once per screen,
 * on the figure that answers the screen's question. The ghost is a CSS pseudo-element,
 * so it never adds text that screen readers would read twice.
 */
export function SmearIn({ children, ghost, delay = 0, className = '' }: SmearInProps) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>

  return (
    <div className={`relative ${className}`}>
      <motion.span
        aria-hidden="true"
        data-text={ghost}
        className="pointer-events-none absolute inset-0 whitespace-nowrap text-marigold before:content-[attr(data-text)]"
        initial={{ opacity: 0.95, x: -64, filter: 'blur(14px)' }}
        animate={{ opacity: 0, x: 0, filter: 'blur(4px)' }}
        transition={{ duration: 0.95, ease: EASE_OUT, delay }}
      />
      <motion.div
        initial={{ opacity: 0, x: -28, filter: 'blur(12px)' }}
        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.75, ease: EASE_OUT, delay: delay + 0.05 }}
      >
        {children}
      </motion.div>
    </div>
  )
}
