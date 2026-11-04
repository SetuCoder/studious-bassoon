import { useEffect } from 'react'

/**
 * The colours at the top and bottom edge of each kind of screen, matching the surfaces in
 * index.css. Safari paints the strip behind the status bar and behind its floating toolbar
 * from these (theme-color, and the page's own background), so the screen runs edge to edge
 * instead of sitting in a box between two flat bands.
 */
export const EDGES = {
  /** surface-night: aubergine lit at the top, deepening at the bottom. */
  night: { top: '#431340', bottom: '#2C0B28' },
  /** surface-day: ice at the top settling into the cream-silver. */
  day: { top: '#F5F4F0', bottom: '#E5E4DF' },
  /** Home: the night band on top, day below. */
  home: { top: '#431340', bottom: '#E5E4DF' },
} as const

export type Edge = keyof typeof EDGES

/** Paint the browser's top and bottom edges to match this screen while it's showing. */
export function useEdges(edge: Edge): void {
  useEffect(() => {
    const { top, bottom } = EDGES[edge]
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'theme-color'
      document.head.appendChild(meta)
    }
    meta.content = top
    document.documentElement.style.backgroundColor = bottom
  }, [edge])
}
