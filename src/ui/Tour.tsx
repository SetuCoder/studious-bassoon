import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { TourId } from '../engine/types'
import { track } from '../lib/analytics'
import { useAppStore } from '../state/store'
import { tap } from './haptics'
import { springPress, springSettle } from './motion'

/** One stop on a guide: the element marked `data-tour="<target>"`, and what to say about it. */
export interface TourStep {
  target: string
  title: string
  body: string
}

interface TourProps {
  id: TourId
  steps: readonly TourStep[]
  /** Seconds to wait first, so the screen's own entrance plays before the room dims. */
  delay?: number
}

// The ring sits this far outside the feature; the card keeps this far from the ring.
const PAD = 8
const GAP = 16
const CARD_ROOM = 230

type Box = { x: number; y: number; width: number; height: number }

const find = (target: string) => document.querySelector<HTMLElement>(`[data-tour="${target}"]`)

/**
 * A first-visit guide. The screen dims, a marigold halo rings one feature at a time and a card
 * says what it does. Runs once per screen (settings.toursSeen); Me can replay them all.
 * Steps whose element isn't on screen (a card-only borrower has no charge check) are skipped.
 */
export function Tour({ id, steps, delay = 0.9 }: TourProps) {
  const seen = useAppStore((s) => s.settings.toursSeen.includes(id))
  const markTourSeen = useAppStore((s) => s.markTourSeen)
  const reduce = useReducedMotion()
  const [live, setLive] = useState<TourStep[] | null>(null)
  const [index, setIndex] = useState(0)
  const [box, setBox] = useState<Box | null>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const bodyId = useId()
  const maskId = useId().replace(/:/g, '')

  // Start after the delay, with only the steps whose element is actually there.
  useEffect(() => {
    if (seen) return
    const timer = setTimeout(() => {
      const present = steps.filter((s) => find(s.target))
      if (present.length) setLive(present)
    }, delay * 1000)
    return () => clearTimeout(timer)
  }, [seen, steps, delay])

  const step = live?.[index]

  // Bring the feature into view, then follow it every frame: it may still be animating in,
  // and the page may scroll under the overlay.
  useEffect(() => {
    if (!step) return
    const el = find(step.target)
    if (!el) return
    el.scrollIntoView?.({ block: 'center', behavior: reduce ? 'auto' : 'smooth' })
    let frame = 0
    const follow = () => {
      const r = el.getBoundingClientRect()
      const next = { x: r.left - PAD, y: r.top - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 }
      setBox((prev) =>
        prev && Math.abs(prev.x - next.x) < 0.5 && Math.abs(prev.y - next.y) < 0.5
          && Math.abs(prev.width - next.width) < 0.5 && Math.abs(prev.height - next.height) < 0.5
          ? prev
          : next)
      frame = requestAnimationFrame(follow)
    }
    follow()
    return () => cancelAnimationFrame(frame)
  }, [step, reduce])

  useEffect(() => {
    if (step) nextRef.current?.focus()
  }, [step])

  if (!live || !step) return null

  const last = index === live.length - 1
  const end = (completed: boolean) => {
    track('tour_ended', { tour: id, completed, step: index + 1 })
    markTourSeen(id)
    setLive(null)
  }

  const viewportH = window.innerHeight
  // The card goes under the feature when there's room, else above it, else at the bottom.
  const below = box && viewportH - (box.y + box.height) >= CARD_ROOM
  const above = box && box.y >= CARD_ROOM
  const cardPos = !box || below
    ? { top: (box ? box.y + box.height : 0) + GAP }
    : above
      ? { bottom: viewportH - box.y + GAP }
      : { bottom: 16 }

  return createPortal(
    <div
      className="fixed inset-0 z-[60]"
      onKeyDown={(e) => {
        if (e.key === 'Escape') end(false)
      }}
    >
      {/* The dimmed room with a hole cut where the feature is. It also swallows taps. */}
      <svg aria-hidden="true" className="absolute inset-0 h-full w-full">
        <defs>
          <mask id={maskId}>
            <rect width="100%" height="100%" fill="white" />
            {box && (
              <motion.rect
                rx={24}
                fill="black"
                initial={false}
                animate={{ x: box.x, y: box.y, width: box.width, height: box.height }}
                transition={springSettle}
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(34, 8, 30, 0.74)" mask={`url(#${maskId})`} />
      </svg>

      {box && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-[24px] border-[3px] border-marigold"
          initial={false}
          animate={{ left: box.x, top: box.y, width: box.width, height: box.height }}
          transition={springSettle}
          style={{ boxShadow: '0 0 0 6px rgba(234,170,0,0.22), 0 0 32px 6px rgba(234,170,0,0.45)' }}
        >
          {!reduce && (
            <motion.span
              className="absolute -inset-[3px] rounded-[24px] border-[3px] border-marigold"
              animate={{ scale: [1, 1.08], opacity: [0.8, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
            />
          )}
        </motion.div>
      )}

      <div className="absolute inset-x-0 mx-auto max-w-[480px] px-4" style={cardPos}>
        <motion.div
          key={index}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={bodyId}
          className="rounded-3xl bg-ice p-5 text-aubergine"
          style={{ boxShadow: '0 5px 0 0 var(--color-ice-edge)' }}
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springSettle}
        >
          <p className="text-[13px] font-bold text-plum-muted">{index + 1} of {live.length}</p>
          <h2 id={titleId} className="mt-1 text-[20px] leading-tight font-black tracking-[-0.02em]">{step.title}</h2>
          <p id={bodyId} className="mt-1.5 text-[15px] leading-snug">{step.body}</p>
          <div className="mt-4 flex items-center justify-between gap-3">
            {last ? <span /> : (
              <button type="button" onClick={() => end(false)} className="min-h-11 px-1 text-[15px] font-bold text-plum-muted underline underline-offset-4">
                Skip the tour
              </button>
            )}
            <motion.button
              ref={nextRef}
              type="button"
              onClick={() => {
                tap()
                if (last) end(true)
                else setIndex(index + 1)
              }}
              className="flex h-12 items-center rounded-full bg-marigold px-7 text-[16px] font-extrabold outline-offset-2 focus-visible:outline-2 focus-visible:outline-aubergine"
              style={{ boxShadow: 'var(--shadow-slab-marigold)' }}
              whileTap={{ y: 5, boxShadow: '0 0 0 0 rgba(0,0,0,0)' }}
              transition={springPress}
            >
              {last ? 'Got it' : 'Next'}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>,
    document.body,
  )
}
