import type { PersistStorage, StorageValue } from 'zustand/middleware'

export interface SafeStorage<S> extends PersistStorage<S, void> {
  /** False when the browser blocks storage (private mode, disabled site data). */
  readonly available: boolean
}

const PROBE_KEY = 'ro:probe'

/**
 * localStorage for the persist middleware, with every read and write wrapped in try/catch.
 * If storage is blocked the app keeps working for the session; `onUnavailable` lets the
 * store show "Your data won't be saved on this device."
 */
export function createSafeStorage<S>(getBacking: () => Storage, onUnavailable: () => void = () => {}): SafeStorage<S> {
  let backing: Storage | undefined
  try {
    backing = getBacking()
    backing.setItem(PROBE_KEY, '1')
    backing.removeItem(PROBE_KEY)
  } catch {
    backing = undefined
  }
  let available = backing !== undefined

  const fail = () => {
    if (!available) return
    available = false
    onUnavailable()
  }

  return {
    get available() {
      return available
    },
    getItem(name) {
      if (!backing) return null
      let raw: string | null
      try {
        raw = backing.getItem(name)
      } catch {
        fail()
        return null
      }
      if (raw === null) return null
      try {
        return JSON.parse(raw) as StorageValue<S>
      } catch {
        // Corrupt data: start fresh rather than crash. The next write replaces it.
        return null
      }
    },
    setItem(name, value) {
      if (!backing) return
      try {
        backing.setItem(name, JSON.stringify(value))
      } catch {
        fail()
      }
    },
    removeItem(name) {
      if (!backing) return
      try {
        backing.removeItem(name)
      } catch {
        fail()
      }
    },
  }
}
