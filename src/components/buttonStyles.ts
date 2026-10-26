export type ButtonVariant = 'primary' | 'secondary' | 'text'

const styles: Record<ButtonVariant, string> = {
  primary: 'w-full rounded-[10px] bg-neutral-800 text-white font-semibold active:bg-neutral-900 disabled:bg-neutral-300',
  secondary: 'w-full rounded-[10px] border border-neutral-300 bg-white text-neutral-900 font-semibold active:bg-neutral-50',
  text: 'mx-auto px-3 text-neutral-900 underline underline-offset-4',
}

// Every button is at least 44 px tall (CLAUDE.md hard rule 7).
const base = 'flex min-h-11 items-center justify-center text-[15px] disabled:cursor-not-allowed'

export function buttonClass(variant: ButtonVariant = 'primary'): string {
  return `${base} ${styles[variant]}`
}
