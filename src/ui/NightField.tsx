import { useId, type ReactNode } from 'react'
import { groupDigits, rateText, rupeeDigits } from '../lib/format'

interface NightFieldProps {
  label: string
  hint?: ReactNode
  error?: string
  /** "rupees": whole rupees with Indian grouping as you type. "rate": % a year. */
  kind: 'rupees' | 'rate'
  /** Digits only for rupees; the typed text for a rate. */
  value: string
  onChange: (value: string) => void
  /** "hero" sets the number as large as the screen's answer; "slab" sits on a raised card. */
  size?: 'hero' | 'slab'
  children?: ReactNode
}

/** A labelled number field on the night surface. The figure itself is the input. */
export function NightField({ label, hint, error, kind, value, onChange, size = 'slab', children }: NightFieldProps) {
  const id = useId()
  const noteId = `${id}-note`
  const note = error ?? hint
  const hero = size === 'hero'
  const shown = kind === 'rupees' ? groupDigits(value) : value

  return (
    <div className={hero ? 'flex flex-col gap-1' : 'flex flex-col gap-2 rounded-3xl bg-aubergine-raised p-4 shadow-slab'}>
      <label htmlFor={id} className="text-[13px] font-semibold text-mauve">{label}</label>
      <div className={`flex items-baseline gap-1.5 ${hero ? 'border-b-2 border-mauve/40 pb-1 focus-within:border-marigold' : ''}`}>
        {kind === 'rupees' && <span aria-hidden="true" className={hero ? 'text-3xl font-bold text-mauve' : 'text-xl font-bold text-mauve'}>₹</span>}
        <input
          id={id}
          inputMode={kind === 'rupees' ? 'numeric' : 'decimal'}
          autoComplete="off"
          aria-describedby={note ? noteId : undefined}
          aria-invalid={error ? true : undefined}
          value={shown}
          onChange={(e) => onChange(kind === 'rupees' ? rupeeDigits(e.target.value) : rateText(e.target.value))}
          // A rate sizes to its digits so the % sits right after it.
          style={kind === 'rate' ? { width: `${Math.max(2, shown.length) + 0.4}ch` } : undefined}
          className={`${kind === 'rate' ? '' : 'w-full'} min-w-0 bg-transparent font-black tracking-[-0.04em] text-ice caret-marigold outline-none ${hero ? 'text-[46px] leading-none' : 'text-[26px] leading-tight'}`}
        />
        {kind === 'rate' && <span aria-hidden="true" className="text-xl font-bold text-mauve">%</span>}
      </div>
      {children}
      {note && (
        <p id={noteId} className={`text-[13px] ${error ? 'font-semibold text-marigold' : 'text-mauve'}`}>{note}</p>
      )}
    </div>
  )
}
