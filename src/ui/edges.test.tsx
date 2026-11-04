import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EDGES, useEdges, type Edge } from './edges'

function Screen({ edge }: { edge: Edge }) {
  useEdges(edge)
  return null
}

describe('useEdges', () => {
  it('paints the browser bars to match the screen showing', () => {
    const { rerender } = render(<Screen edge="home" />)
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')!
    expect(meta.content).toBe(EDGES.home.top)
    expect(document.documentElement.style.backgroundColor).toBe('rgb(229, 228, 223)') // #E5E4DF

    rerender(<Screen edge="night" />)
    expect(meta.content).toBe(EDGES.night.top)
    expect(document.documentElement.style.backgroundColor).toBe('rgb(44, 11, 40)') // #2C0B28
  })
})
