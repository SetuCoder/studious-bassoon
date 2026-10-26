import { useNavigate } from 'react-router'

interface TopBarProps {
  title: string
  /** Where the back arrow goes. No arrow when this and onBack are both omitted. */
  backTo?: string
  /** For flows whose back steps within the screen (the charge-check questions). */
  onBack?: () => void
}

/** WF Top bar: 56 px, optional back arrow, title. */
export function TopBar({ title, backTo, onBack }: TopBarProps) {
  const hasBack = backTo !== undefined || onBack !== undefined
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-1 border-b border-neutral-200 bg-white px-2">
      {hasBack && (
        <button
          type="button"
          aria-label="Back"
          onClick={() => (onBack ? onBack() : navigate(backTo!))}
          className="flex size-11 items-center justify-center rounded-full active:bg-neutral-100"
        >
          <svg aria-hidden viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      <h1 className={`truncate text-lg font-semibold ${hasBack ? '' : 'px-3'}`}>{title}</h1>
    </header>
  )
}
