import { motion } from 'motion/react'
import { tap } from './haptics'
import { springPress } from './motion'

interface ChoiceListProps<T extends string> {
  label: string
  options: readonly { value: T; label: string; meta?: string }[]
  value: T | undefined
  onChange: (value: T) => void
}

/** Big single-choice rows on the day surface: one answer per row, the chosen one inks in. */
export function ChoiceList<T extends string>({ label, options, value, onChange }: ChoiceListProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col gap-2.5">
      {options.map((o) => {
        const on = o.value === value
        return (
          <motion.button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => {
              tap()
              onChange(o.value)
            }}
            whileTap={{ scale: 0.98, y: 2 }}
            transition={springPress}
            className={`flex min-h-14 items-center gap-3 rounded-2xl px-4 py-3 text-left ${on ? 'bg-aubergine text-ice' : 'bg-white text-aubergine'}`}
            style={{ boxShadow: on ? 'var(--shadow-slab)' : '0 3px 0 0 #C5CCD3' }}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[17px] font-bold">{o.label}</span>
              {o.meta && <span className={`block text-[13px] ${on ? 'text-mauve' : 'text-plum-muted'}`}>{o.meta}</span>}
            </span>
            <span
              aria-hidden="true"
              className={`flex size-6 shrink-0 items-center justify-center rounded-full ${on ? 'bg-marigold text-aubergine' : 'border-2 border-silver-line'}`}
            >
              {on && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              )}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
