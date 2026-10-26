/**
 * Short buzzes on phones that support them (Android Chrome). iOS Safari has no vibration
 * API, so these do nothing there. Never the only feedback for anything.
 *
 * Browsers block vibration until the user has interacted with the page, so a screen
 * opened straight from a link stays silent instead of logging an error.
 */
function buzz(pattern: number | number[]): void {
  try {
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return
    navigator.vibrate?.(pattern)
  } catch {
    // Some in-app browsers throw; feedback is optional.
  }
}

/** A light tick for presses. */
export function tap(ms = 8): void {
  buzz(ms)
}

/** A heavier double pulse for the moments that land: a stamp, a debt cleared. */
export function thud(): void {
  buzz([14, 40, 10])
}
