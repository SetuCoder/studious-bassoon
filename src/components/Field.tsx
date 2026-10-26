import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { groupDigits, rateText, rupeeDigits } from '../lib/format'

interface FieldProps {
  label: string
  hint?: ReactNode
  /** Replaces the hint when set. */
  error?: string
  children: (props: { id: string; describedBy?: string; invalid: boolean }) => ReactNode
}

/** WF Input: label, control, then hint (or the error in its place). */
export function Field({ label, hint, error, children }: FieldProps) {
  const id = useId()
  const noteId = `${id}-note`
  const note = error ?? hint
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-neutral-900">{label}</label>
      {children({ id, describedBy: note ? noteId : undefined, invalid: !!error })}
      {note && (
        <p id={noteId} className={`text-xs ${error ? 'text-red-700' : 'text-neutral-500'}`}>{note}</p>
      )}
    </div>
  )
}

const inputBox =
  'flex h-12 items-center rounded-[10px] border bg-white px-3 text-base focus-within:border-neutral-800 focus-within:ring-1 focus-within:ring-neutral-800'

function boxClass(invalid: boolean) {
  return `${inputBox} ${invalid ? 'border-red-600' : 'border-neutral-300'}`
}

type ControlProps = { id: string; describedBy?: string; invalid: boolean }

interface TextInputProps extends ControlProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'value' | 'onChange'> {
  value: string
  onChange: (value: string) => void
}

export function TextInput({ id, describedBy, invalid, value, onChange, ...rest }: TextInputProps) {
  return (
    <div className={boxClass(invalid)}>
      <input
        id={id}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        className="w-full bg-transparent outline-none placeholder:text-neutral-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
    </div>
  )
}

/**
 * Whole rupees with a ₹ prefix and Indian grouping as you type. `value` is digits only
 * ("8500000"); the box shows "85,00,000".
 */
export function RupeeInput({ value, onChange, ...rest }: TextInputProps) {
  return (
    <div className={boxClass(rest.invalid)}>
      <span aria-hidden className="mr-2 text-neutral-500">₹</span>
      <input
        id={rest.id}
        aria-describedby={rest.describedBy}
        aria-invalid={rest.invalid || undefined}
        inputMode="numeric"
        autoComplete="off"
        className="w-full bg-transparent outline-none placeholder:text-neutral-400"
        value={groupDigits(value)}
        onChange={(e) => onChange(rupeeDigits(e.target.value))}
        onBlur={rest.onBlur}
      />
    </div>
  )
}

/** A yearly rate in %, up to two decimals. */
export function RateInput({ value, onChange, ...rest }: TextInputProps) {
  return (
    <div className={boxClass(rest.invalid)}>
      <input
        id={rest.id}
        aria-describedby={rest.describedBy}
        aria-invalid={rest.invalid || undefined}
        inputMode="decimal"
        autoComplete="off"
        className="w-full bg-transparent outline-none"
        value={value}
        onChange={(e) => onChange(rateText(e.target.value))}
      />
      <span aria-hidden className="ml-2 text-neutral-500">%</span>
    </div>
  )
}
