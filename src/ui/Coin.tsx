import { motion } from 'motion/react'
import { springPress } from './motion'

/**
 * The next rupee as an object: a marigold coin with a minted rim and a ₹ face. Its edge is
 * the hard shadow underneath. `pulse` changes whenever the amount changes, and the coin
 * gives a small hop so the user sees their input landed.
 */
export function Coin({ pulse, size = 64 }: { pulse: string | number; size?: number }) {
  return (
    <motion.span
      key={pulse}
      aria-hidden="true"
      className="relative inline-flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: 'radial-gradient(circle at 35% 30%, #FFE08A 0%, #F7C944 30%, #EAAA00 70%)',
        boxShadow: '0 5px 0 0 #B57E00, inset 0 0 0 3px rgba(181,126,0,0.55)',
      }}
      initial={{ y: -10, scale: 0.92 }}
      animate={{ y: 0, scale: 1 }}
      transition={springPress}
    >
      <span
        className="absolute rounded-full"
        style={{ inset: size * 0.14, border: '1.5px dashed rgba(58,15,52,0.35)' }}
      />
      <span className="font-black text-aubergine" style={{ fontSize: size * 0.44, lineHeight: 1 }}>₹</span>
    </motion.span>
  )
}
