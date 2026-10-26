import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { groupDigits, rateText, rupeeDigits } from '../lib/format'

interface DayFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'size'> {
  label: string
  hint?: ReactNode
  /** Replaces the hint when set. */
  error?: string
  /** "rupees": whole rupees, Indian grouping as you type. "rate": % a year. "text" and "date" as typed. */
  kind: 'rupees' | 'rate' | 'text' | 'date'
  /** Digits only for rupees; the typed text otherwise. */
  value: string
  onChange: (value: string) => void
}

/**
 * A raised white field on the day surface. The focus ring is aubergine: marigold on silver
 * is only 1.6:1, too faint to show focus.
 */
export function DayField({ label, hint, error, kind, value, onChange, ...rest }: DayFieldProps) {
  const id = useId()
  const noteId = `${id}-note`
  const note = error ?? hint
  const shown = kind === 'rupees' ? groupDigits(value) : value

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[14px] font-semibold">{label}</label>
      <div
        // Outline, not ring: ring is a box-shadow and the inline shadow below (the raised edge) would hide it.
        className={`flex h-14 items-center gap-2 rounded-2xl bg-white px-4 focus-within:outline-2 focus-within:outline-aubergine ${
          error ? 'outline-2 outline-brick' : ''
        }`}
        style={{ boxShadow: '0 3px 0 0 #C5CCD3' }}
      >
        {kind === 'rupees' && <span aria-hidden="true" className="text-lg font-bold text-plum-muted">₹</span>}
        <input
          id={id}
          type={kind === 'date' ? 'date' : 'text'}
          inputMode={kind === 'rupees' ? 'numeric' : kind === 'rate' ? 'decimal' : undefined}
          autoComplete="off"
          aria-describedby={note ? noteId : undefined}
          aria-invalid={error ? true : undefined}
          value={shown}
          onChange={(e) => {
            const v = e.target.value
            onChange(kind === 'rupees' ? rupeeDigits(v) : kind === 'rate' ? rateText(v) : v)
          }}
          className={`w-full min-w-0 bg-transparent text-aubergine caret-aubergine outline-none placeholder:text-plum-muted/70 ${
            kind === 'text' || kind === 'date' ? 'text-[17px] font-medium' : 'text-[22px] font-extrabold tracking-[-0.02em]'
          }`}
          {...rest}
        />
        {kind === 'rate' && <span aria-hidden="true" className="text-lg font-bold text-plum-muted">%</span>}
      </div>
      {note && (
        <p id={noteId} className={`text-[13px] ${error ? 'font-semibold text-brick' : 'text-plum-muted'}`}>{note}</p>
      )}
    </div>
  )
}
