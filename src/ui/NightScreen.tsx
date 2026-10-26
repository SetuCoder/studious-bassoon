import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'

/** The deep aubergine "night" surface the money moments live on. */
export function NightScreen({ title, backTo, children }: { title: string; backTo?: string; children: ReactNode }) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-1 flex-col bg-aubergine text-ice">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-1 bg-aubergine px-2">
        {backTo && (
          <button
            type="button"
            aria-label="Back"
            onClick={() => navigate(backTo)}
            className="flex size-11 items-center justify-center rounded-full text-ice active:bg-aubergine-raised"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <h1 className={`truncate text-lg font-bold ${backTo ? '' : 'px-3'}`}>{title}</h1>
      </header>
      <main className="flex flex-1 flex-col gap-5 px-5 pt-2 pb-8">{children}</main>
    </div>
  )
}
