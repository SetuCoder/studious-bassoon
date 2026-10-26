import { useId } from 'react'

interface SwitchProps {
  label: string
  hint?: string
  checked: boolean
  onChange: (checked: boolean) => void
}

/** An on/off setting with its label; the whole row is the 44 px touch target. */
export function Switch({ label, hint, checked, onChange }: SwitchProps) {
  const hintId = useId()
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-describedby={hint ? hintId : undefined}
      onClick={() => onChange(!checked)}
      className="flex min-h-11 w-full items-center gap-3 text-left"
    >
      <span className="flex-1">
        <span className="block text-sm font-medium text-neutral-900">{label}</span>
        {hint && <span id={hintId} className="mt-0.5 block text-xs text-neutral-500">{hint}</span>}
      </span>
      <span aria-hidden className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? 'bg-neutral-800' : 'bg-neutral-300'}`}>
        <span className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
      </span>
    </button>
  )
}
