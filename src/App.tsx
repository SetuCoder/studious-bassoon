import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { TabLayout } from './components/Layout'
import { isActive } from './engine/ledger'
import { ComingSoon } from './screens/ComingSoon'
import { AddDebt } from './screens/debts/AddDebt'
import { DebtEdit } from './screens/debts/DebtEdit'
import { DebtsTab } from './screens/debts/DebtsTab'
import { Welcome } from './screens/welcome/Welcome'
import { useAppStore } from './state/store'

/** Home, Plan and Charges only work once at least one debt exists; until then they go to Debts. */
function NeedsDebts({ children }: { children: ReactNode }) {
  const hasDebts = useAppStore((s) => s.debts.some(isActive))
  return hasDebts ? children : <Navigate to="/debts" replace />
}

/** First run opens on Welcome; after "Get started" (or with debts), Home. */
function HomeRoute() {
  const hasDebts = useAppStore((s) => s.debts.some(isActive))
  const started = useAppStore((s) => s.onboardingStarted)
  if (!hasDebts) return <Navigate to={started ? '/debts' : '/welcome'} replace />
  return <ComingSoon title="Home" />
}

function WelcomeRoute() {
  const hasDebts = useAppStore((s) => s.debts.some(isActive))
  return hasDebts ? <Navigate to="/" replace /> : <Welcome />
}

export default function App() {
  const storageAvailable = useAppStore((s) => s.storageAvailable)
  return (
    <div className="mx-auto min-h-dvh max-w-[480px] bg-white text-neutral-900">
      {!storageAvailable && (
        <p role="status" className="bg-amber-100 px-5 py-2 text-sm text-amber-900">
          Your data won't be saved on this device.
        </p>
      )}
      <Routes>
        <Route path="/welcome" element={<WelcomeRoute />} />
        <Route path="/debts/new" element={<AddDebt />} />
        <Route element={<TabLayout />}>
          <Route index element={<HomeRoute />} />
          <Route path="/debts" element={<DebtsTab />} />
          <Route path="/debts/:id" element={<DebtEdit />} />
          <Route path="/plan" element={<NeedsDebts><ComingSoon title="Next rupee" /></NeedsDebts>} />
          <Route path="/charges" element={<NeedsDebts><ComingSoon title="Check a closing quote" /></NeedsDebts>} />
          <Route path="/me" element={<ComingSoon title="Me" />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
