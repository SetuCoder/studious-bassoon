import { motion } from 'motion/react'
import { tap } from './haptics'
import { springPress } from './motion'

interface PillGroupProps<T extends string> {
  label: string
  /** Hide the label visually; it stays for screen readers. */
  hideLabel?: boolean
  options: readonly { value: T; label: string }[]
  value: T | undefined
  onChange: (value: T) => void
  /** "day" on ice silver, "night" on aubergine. */
  surface?: 'day' | 'night'
}

/** A single-choice group of pills: the selected one fills, the rest stay quiet. */
export function PillGroup<T extends string>({ label, hideLabel, options, value, onChange, surface = 'day' }: PillGroupProps<T>) {
  const on = surface === 'day' ? 'bg-aubergine text-ice' : 'bg-marigold text-aubergine'
  const off = surface === 'day' ? 'bg-white text-aubergine' : 'bg-aubergine-raised text-ice'
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className={hideLabel ? 'sr-only' : 'mb-2 text-[14px] font-semibold'}>{label}</legend>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((o) => {
          const selected = o.value === value
          return (
            <motion.button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => {
                tap()
                onChange(o.value)
              }}
              whileTap={{ scale: 0.94 }}
              transition={springPress}
              className={`min-h-11 rounded-full px-4 text-[15px] font-semibold ${selected ? on : off}`}
              style={selected || surface === 'night' ? undefined : { boxShadow: '0 2px 0 0 #C5CCD3' }}
            >
              {o.label}
            </motion.button>
          )
        })}
      </div>
    </fieldset>
  )
}
