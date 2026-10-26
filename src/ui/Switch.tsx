import { motion } from 'motion/react'
import { useId } from 'react'
import { tap } from './haptics'
import { springPress } from './motion'

interface SwitchProps {
  label: string
  hint?: string
  checked: boolean
  onChange: (checked: boolean) => void
}

/** An on/off setting on the day surface; the whole row is the touch target. On is aubergine with a marigold knob. */
export function Switch({ label, hint, checked, onChange }: SwitchProps) {
  const hintId = useId()
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-describedby={hint ? hintId : undefined}
      onClick={() => {
        tap()
        onChange(!checked)
      }}
      className="flex min-h-11 w-full items-center gap-4 text-left"
    >
      <span className="flex-1">
        <span className="block text-[16px] font-bold">{label}</span>
        {hint && <span id={hintId} className="mt-0.5 block text-[13px] leading-snug text-plum-muted">{hint}</span>}
      </span>
      <span aria-hidden="true" className={`relative flex h-8 w-14 shrink-0 items-center rounded-full px-1 transition-colors ${checked ? 'bg-aubergine' : 'bg-silver-line'}`}>
        <motion.span
          className={`size-6 rounded-full ${checked ? 'bg-marigold' : 'bg-white'}`}
          animate={{ x: checked ? 24 : 0 }}
          transition={springPress}
        />
      </span>
    </button>
  )
}
