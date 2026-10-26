import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { thud } from './haptics'
import { springStamp } from './motion'

const PETALS = 14
/** Seconds from the stamp starting to fall until it first hits the card. */
const IMPACT_AFTER = 0.16

/** A burst of marigold petals: the garland moment when a debt is cleared. Decorative only. */
export function PetalBurst({ play }: { play: boolean }) {
  const reduce = useReducedMotion()
  if (!play || reduce) return null
  return (
    <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-1/2">
      {Array.from({ length: PETALS }, (_, i) => {
        const angle = (i / PETALS) * Math.PI * 2 + (i % 2) * 0.2
        const reach = 46 + (i % 3) * 14
        return (
          <motion.span
            key={i}
            className={`absolute h-3.5 w-2 rounded-full ${i % 3 === 0 ? 'bg-marigold-light' : i % 3 === 1 ? 'bg-marigold' : 'bg-marigold-deep'}`}
            style={{ marginLeft: -4, marginTop: -7 }}
            initial={{ x: 0, y: 0, rotate: 0, opacity: 1, scale: 0.4 }}
            animate={{
              x: Math.cos(angle) * reach,
              y: Math.sin(angle) * reach + 18,
              rotate: (angle * 180) / Math.PI + 140,
              opacity: 0,
              scale: 1,
            }}
            transition={{ duration: 1.1, ease: [0.2, 0.8, 0.3, 1] }}
          />
        )
      })}
    </span>
  )
}

/**
 * A "Cleared" stamp that lands on a debt after a delay, with a thud on phones that can
 * vibrate and a burst of petals. The word is always in the DOM for screen readers.
 */
export function ClearedStamp({ delay }: { delay: number }) {
  const reduce = useReducedMotion()
  const [landed, setLanded] = useState(false)

  // Fire at the moment of impact, not when the spring finally comes to rest: a spring's
  // settling tail runs on for over a second after the stamp visibly hits.
  useEffect(() => {
    if (reduce) return
    const timer = setTimeout(() => {
      setLanded(true)
      thud()
    }, (delay + IMPACT_AFTER) * 1000)
    return () => clearTimeout(timer)
  }, [delay, reduce])

  return (
    <span className="relative inline-flex">
      <motion.span
        className="inline-flex -rotate-6 items-center rounded-md border-2 border-marigold px-2 py-0.5 text-[13px] font-extrabold tracking-[0.02em] text-marigold"
        initial={reduce ? false : { scale: 2.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ...springStamp, delay }}
      >
        Cleared
      </motion.span>
      <PetalBurst play={landed} />
    </span>
  )
}
