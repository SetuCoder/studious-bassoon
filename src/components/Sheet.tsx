import { motion } from 'motion/react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { springSettle } from '../ui/motion'

interface SheetProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

/** Bottom sheet dialog, sliding up on the ice surface. Escape or a tap outside closes it. */
export function Sheet({ open, title, onClose, children }: SheetProps) {
  const titleId = useId()
  const panel = useRef<HTMLDivElement>(null)

  // Callers pass a new onClose on every render; keep the latest in a ref so the effect below
  // runs only when the sheet opens or closes, and never pulls focus out of a field mid-typing.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    panel.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current()
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previous?.focus()
    }
  }, [open])

  if (!open) return null
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-aubergine-deep/60"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] rounded-t-[28px] bg-ice px-5 pt-3 pb-[calc(24px+env(safe-area-inset-bottom))] text-aubergine outline-none"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={springSettle}
      >
        <div aria-hidden="true" className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-silver-line" />
        <h2 id={titleId} className="text-[22px] leading-tight font-black tracking-[-0.03em]">{title}</h2>
        <div className="mt-3 flex flex-col gap-4">{children}</div>
      </motion.div>
    </motion.div>
  )
}
