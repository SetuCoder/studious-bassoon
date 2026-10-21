import { APP_NAME } from './lib/constants'
import { useAppStore } from './state/store'

// Placeholder shell. Screens are built in milestone order (docs/beta-spec.md).
export default function App() {
  const storageAvailable = useAppStore((s) => s.storageAvailable)
  return (
    <>
      {!storageAvailable && (
        <p role="status" className="bg-amber-100 px-5 py-2 text-sm text-amber-900">
          Your data won't be saved on this device.
        </p>
      )}
      <main className="mx-auto min-h-dvh max-w-[480px] bg-white px-5 py-6 text-neutral-900">
        <h1 className="text-xl font-semibold">{APP_NAME}</h1>
        <p className="mt-2 text-sm text-neutral-600">Beta. Shows the cost of each option. Not financial advice.</p>
      </main>
    </>
  )
}
