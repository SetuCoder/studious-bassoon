interface OptionListProps<T extends string> {
  label: string
  options: readonly { value: T; label: string; meta?: string }[]
  value: T | undefined
  onChange: (value: T) => void
}

/** Full-width single-choice rows, one answer per row (charge-check questions). */
export function OptionList<T extends string>({ label, options, value, onChange }: OptionListProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col gap-2">
      {options.map((o) => {
        const selected = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={`flex min-h-11 flex-col justify-center rounded-full border px-4 py-2 text-left text-sm ${
              selected ? 'border-neutral-800 bg-neutral-800 text-white' : 'border-neutral-300 bg-white text-neutral-900'
            }`}
          >
            <span>{o.label}</span>
            {o.meta && <span className={`text-xs ${selected ? 'text-neutral-300' : 'text-neutral-500'}`}>{o.meta}</span>}
          </button>
        )
      })}
    </div>
  )
}
