import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { MotionGlobalConfig } from 'motion/react'
import { afterEach, vi } from 'vitest'

afterEach(cleanup)

// The first-visit guides dim the screen and take focus on a timer, which would land in the
// middle of other screens' tests. They're tested on their own in src/ui/Tour.test.tsx.
vi.mock('../ui/Tour', () => ({ Tour: () => null }))

// Animations jump straight to their end state in tests, so the DOM shows final values.
MotionGlobalConfig.skipAnimations = true

// jsdom has no matchMedia; Motion's reduced-motion check reads it.
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: false, media: query, onchange: null,
      addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false,
    }),
  })
}

// Node 25 has its own global localStorage, which shadows jsdom's and throws unless Node is
// started with --localstorage-file. Tests get a plain in-memory Storage instead.
class MemoryStorage implements Storage {
  private items = new Map<string, string>()
  get length() {
    return this.items.size
  }
  clear() {
    this.items.clear()
  }
  getItem(key: string) {
    return this.items.get(key) ?? null
  }
  key(index: number) {
    return [...this.items.keys()][index] ?? null
  }
  removeItem(key: string) {
    this.items.delete(key)
  }
  setItem(key: string, value: string) {
    this.items.set(key, String(value))
  }
}

const memory = new MemoryStorage()
for (const target of [globalThis, window]) {
  Object.defineProperty(target, 'localStorage', { value: memory, configurable: true, writable: true })
}
