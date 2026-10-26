import type { ReactNode } from 'react'
import { Link } from 'react-router'

/** WF Stat: label and a money value. Two per row. */
export function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] bg-neutral-100 px-3 py-3">
      <p className="text-xs text-neutral-600">{label}</p>
      <p className="mt-1 whitespace-nowrap text-xl font-bold text-neutral-900">{value}</p>
    </div>
  )
}

interface DebtRowProps {
  name: string
  meta: string
  amount: string
  to?: string
}

/** WF Debt row: name, meta line, amount, chevron when it links somewhere. */
export function DebtRow({ name, meta, amount, to }: DebtRowProps) {
  const body = (
    <>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-neutral-900">{name}</p>
        {/* Wraps rather than truncates: "costs the most" must stay readable at 360 px. */}
        <p className="text-xs text-neutral-600">{meta}</p>
      </div>
      <p className="whitespace-nowrap font-semibold text-neutral-900">{amount}</p>
      {to && <span aria-hidden className="ml-2 text-neutral-500">›</span>}
    </>
  )
  const box = 'flex min-h-16 items-center gap-3 rounded-[10px] border border-neutral-300 bg-white px-4 py-3'
  return to ? <Link to={to} className={`${box} active:bg-neutral-50`}>{body}</Link> : <div className={box}>{body}</div>
}

/** WF Placeholder: grey box for illustrations and charts until they are designed. */
export function Placeholder({ label, className = 'h-36' }: { label: string; className?: string }) {
  return (
    <div aria-hidden className={`flex items-center justify-center rounded-[10px] bg-neutral-100 text-xs text-neutral-500 ${className}`}>
      {label}
    </div>
  )
}

/** Grey information box ("Private by design", payoff info). */
export function InfoBox({ children }: { children: ReactNode }) {
  return <div className="rounded-[10px] bg-neutral-100 px-4 py-3 text-sm text-neutral-900">{children}</div>
}

interface ActionRowProps {
  title: string
  detail: string
  to?: string
  onClick?: () => void
}

/** WF Action row: a Home to-do item that leads somewhere. */
export function ActionRow({ title, detail, to, onClick }: ActionRowProps) {
  const body = (
    <>
      <span aria-hidden className="size-8 shrink-0 rounded-md bg-neutral-100" />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-neutral-900">{title}</span>
        <span className="block text-xs text-neutral-600">{detail}</span>
      </span>
      <span aria-hidden className="text-neutral-500">›</span>
    </>
  )
  const box = 'flex min-h-16 w-full items-center gap-3 rounded-[10px] border border-neutral-300 bg-white px-4 py-3 text-left active:bg-neutral-50'
  return to
    ? <Link to={to} className={box}>{body}</Link>
    : <button type="button" onClick={onClick} className={box}>{body}</button>
}
