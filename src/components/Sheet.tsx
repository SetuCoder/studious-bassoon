import { useEffect, useId, useRef, type ReactNode } from 'react'

interface SheetProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

/** Bottom sheet dialog. Escape or a tap outside closes it. */
export function Sheet({ open, title, onClose, children }: SheetProps) {
  const titleId = useId()
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    panel.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previous?.focus()
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] rounded-t-2xl bg-white px-5 pt-5 pb-[calc(20px+env(safe-area-inset-bottom))] outline-none"
      >
        <h2 id={titleId} className="text-lg font-semibold text-neutral-900">{title}</h2>
        <div className="mt-3 flex flex-col gap-4">{children}</div>
      </div>
    </div>
  )
}
