interface ChipGroupProps<T extends string> {
  label: string
  /** Hide the label visually; it stays for screen readers. */
  hideLabel?: boolean
  options: readonly { value: T; label: string }[]
  value: T | undefined
  onChange: (value: T) => void
}

/** WF Chip in a single-select group. */
export function ChipGroup<T extends string>({ label, hideLabel, options, value, onChange }: ChipGroupProps<T>) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className={hideLabel ? 'sr-only' : 'mb-2 text-sm font-medium text-neutral-900'}>{label}</legend>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((o) => {
          const selected = o.value === value
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(o.value)}
              className={`min-h-11 rounded-full border px-4 text-sm ${
                selected ? 'border-neutral-800 bg-neutral-800 text-white' : 'border-neutral-300 bg-white text-neutral-900'
              }`}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
