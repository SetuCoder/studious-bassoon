import { Link } from 'react-router'

interface OptionCardProps {
  rank: number
  name: string
  /** Already formatted: "+₹55,728" */
  delta: string
  note: string
  /** 0 to 1: this option's gain as a share of the top option's. */
  bar: number
  /** The top option: 2 px dark border and its label. */
  best?: string
  to: string
}

/** WF Option card (Best, Default). Bar width is proportional to the gain. */
export function OptionCard({ rank, name, delta, note, bar, best, to }: OptionCardProps) {
  return (
    <Link
      to={to}
      className={`block rounded-[10px] bg-white px-4 py-3 active:bg-neutral-50 ${best ? 'border-2 border-neutral-800' : 'border border-neutral-300'}`}
    >
      {best && <p className="mb-1 text-xs font-semibold text-neutral-700">{best}</p>}
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${best ? 'bg-neutral-800 text-white' : 'bg-neutral-200 text-neutral-900'}`}
        >
          {rank}
        </span>
        <p className="min-w-0 flex-1 text-[15px] font-semibold text-neutral-900">
          <span className="sr-only">{rank}. </span>
          {name}
        </p>
        <p className="whitespace-nowrap text-[15px] font-bold text-neutral-900">{delta}</p>
      </div>
      <div aria-hidden className="mt-2 h-1.5 rounded-full bg-neutral-200">
        <div className={`h-full rounded-full ${best ? 'bg-neutral-800' : 'bg-neutral-500'}`} style={{ width: `${Math.round(bar * 100)}%` }} />
      </div>
      <p className="mt-2 text-xs text-neutral-600">{note}</p>
    </Link>
  )
}
