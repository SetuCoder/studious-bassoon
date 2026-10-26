import { APP_NAME } from './lib/constants'

// Placeholder shell. Screens are built in milestone order (docs/beta-spec.md).
export default function App() {
  return (
    <main className="mx-auto min-h-dvh max-w-[480px] bg-white px-5 py-6 text-neutral-900">
      <h1 className="text-xl font-semibold">{APP_NAME}</h1>
      <p className="mt-2 text-sm text-neutral-600">Beta. Shows the cost of each option. Not financial advice.</p>
    </main>
  )
}
