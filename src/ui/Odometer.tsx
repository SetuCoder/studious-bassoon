import { motion, useReducedMotion } from 'motion/react'
import { springDigit } from './motion'

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

interface OdometerProps {
  /** Already formatted, e.g. "+₹55,728" */
  value: string
  /** Seconds before the first digit starts rolling. */
  delay?: number
  className?: string
}

/**
 * A rupee figure whose digits roll into place like a mechanical counter, right to left.
 * Screen readers and tests get the plain value; the rolling columns are hidden from them.
 */
export function Odometer({ value, delay = 0, className = '' }: OdometerProps) {
  const reduce = useReducedMotion()
  if (reduce) return <span className={className}>{value}</span>

  const chars = [...value]
  const digitCount = chars.filter((c) => /\d/.test(c)).length
  let seen = 0

  return (
    <span className={`relative inline-block whitespace-nowrap ${className}`}>
      <span className="sr-only">{value}</span>
      <span aria-hidden="true" className="inline-flex leading-none">
        {chars.map((c, i) => {
          if (!/\d/.test(c)) return <span key={i} className="inline-block">{c}</span>
          // Rightmost digits move first, so the figure "counts up" into place.
          const order = digitCount - 1 - seen++
          return (
            <span key={i} className="relative inline-block h-[1em] overflow-hidden">
              <motion.span
                className="flex flex-col"
                initial={{ y: '0%' }}
                animate={{ y: `${-Number(c) * 10}%` }}
                transition={{ ...springDigit, delay: delay + order * 0.06 }}
              >
                {DIGITS.map((d) => <span key={d} className="block h-[1em]">{d}</span>)}
              </motion.span>
            </span>
          )
        })}
      </span>
    </span>
  )
}
