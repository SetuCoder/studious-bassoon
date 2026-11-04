import type { AppData, Debt, TourId } from '../engine/types'

/** The one localStorage key that holds everything (docs/data-model.md). */
export const STORAGE_KEY = 'vektrr:v1'
/** Where data lived before the app was named Vektrr. Moved to STORAGE_KEY on first open. */
export const LEGACY_STORAGE_KEY = 'ro:v1'
export const SCHEMA_VERSION = 3

const TOUR_IDS: readonly TourId[] = ['start', 'overview', 'results', 'charge']

export function emptyAppData(): AppData {
  return {
    schemaVersion: SCHEMA_VERSION,
    profile: {},
    debts: [],
    checkIns: [],
    chargeChecks: [],
    feedback: {},
    settings: { shareUsageCounts: true, toursSeen: [], haptics: true, calmMotion: false },
  }
}

/**
 * One step per schema change: MIGRATIONS[n] turns version n data into version n + 1.
 * Add a step and bump SCHEMA_VERSION whenever the shape of AppData changes.
 */
const MIGRATIONS: Record<number, (data: Record<string, unknown>) => Record<string, unknown>> = {
  // 1 → 2: settings gains toursSeen. Nobody has seen a guide yet.
  1: (data) => ({ ...data, settings: { ...(isRecord(data.settings) ? data.settings : {}), toursSeen: [] } }),
  // 2 → 3: settings gains the Me preferences, at their defaults.
  2: (data) => ({ ...data, settings: { ...(isRecord(data.settings) ? data.settings : {}), haptics: true, calmMotion: false } }),
}

/** Called by the persist middleware when the stored version differs from SCHEMA_VERSION. */
export function migrate(persisted: unknown, fromVersion: number): AppData {
  let data = isRecord(persisted) ? persisted : {}
  for (let v = fromVersion; v < SCHEMA_VERSION; v++) {
    const step = MIGRATIONS[v]
    // No path from this version (or data from a newer app): start fresh rather than guess.
    if (!step) return emptyAppData()
    data = step(data)
  }
  if (fromVersion > SCHEMA_VERSION) return emptyAppData()
  return normalise(data)
}

/**
 * Fill in missing parts and drop debts the engine can't use, so a damaged or hand-edited
 * value never reaches the maths as NaN.
 */
export function normalise(persisted: unknown): AppData {
  const empty = emptyAppData()
  if (!isRecord(persisted)) return empty
  const p = persisted as Partial<Record<keyof AppData, unknown>>
  return {
    schemaVersion: SCHEMA_VERSION,
    profile: isRecord(p.profile) ? (p.profile as AppData['profile']) : empty.profile,
    debts: Array.isArray(p.debts) ? p.debts.filter(isUsableDebt) : [],
    lastNextRupee: isRecord(p.lastNextRupee) ? (p.lastNextRupee as unknown as AppData['lastNextRupee']) : undefined,
    plan: isRecord(p.plan) ? (p.plan as unknown as AppData['plan']) : undefined,
    checkIns: Array.isArray(p.checkIns) ? (p.checkIns as AppData['checkIns']) : [],
    chargeChecks: Array.isArray(p.chargeChecks) ? (p.chargeChecks as AppData['chargeChecks']) : [],
    feedback: isRecord(p.feedback) ? (p.feedback as AppData['feedback']) : empty.feedback,
    settings: {
      shareUsageCounts: flag(p.settings, 'shareUsageCounts', empty.settings.shareUsageCounts),
      haptics: flag(p.settings, 'haptics', empty.settings.haptics),
      calmMotion: flag(p.settings, 'calmMotion', empty.settings.calmMotion),
      toursSeen: isRecord(p.settings) && Array.isArray(p.settings.toursSeen)
        ? TOUR_IDS.filter((id) => (p.settings as { toursSeen: unknown[] }).toursSeen.includes(id))
        : [],
    },
  }
}

function flag(settings: unknown, key: string, fallback: boolean): boolean {
  return isRecord(settings) && typeof settings[key] === 'boolean' ? settings[key] : fallback
}

function isUsableDebt(d: unknown): d is Debt {
  if (!isRecord(d)) return false
  return typeof d.id === 'string' && typeof d.type === 'string'
    && [d.balance, d.apr, d.monthlyPayment].every((n) => typeof n === 'number' && Number.isFinite(n))
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}
