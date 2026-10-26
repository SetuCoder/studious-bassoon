import type { Transition } from 'motion/react'

// One set of springs for the whole app, so every surface moves with the same physics.

/** Slabs rising into place, cards stacking. */
export const springSettle: Transition = { type: 'spring', stiffness: 260, damping: 26, mass: 0.9 }

/** Presses and small pops: quick, no wobble. */
export const springPress: Transition = { type: 'spring', stiffness: 700, damping: 36 }

/** Odometer digits: a little overshoot, like a mechanical counter landing. */
export const springDigit: Transition = { type: 'spring', stiffness: 170, damping: 19 }

/** A stamp landing on paper. */
export const springStamp: Transition = { type: 'spring', stiffness: 520, damping: 22, mass: 0.7 }

/** Stagger between items in a cascade, in seconds. */
export const STAGGER = 0.07
