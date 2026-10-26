import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'motion/react'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import { APP_NAME } from './lib/constants.ts'

document.title = APP_NAME

// Dev only: ?sample loads the sample borrower and opens the Plan tab. Vite drops this
// block, and the module it imports, from production builds.
if (import.meta.env.DEV && new URLSearchParams(location.search).has('sample')) {
  const [{ loadSampleBorrower }, { appStore }] = await Promise.all([
    import('./dev/sampleBorrower.ts'),
    import('./state/store.ts'),
  ])
  loadSampleBorrower(appStore)
  history.replaceState(null, '', '/plan')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Respect the phone's "reduce motion" setting: transforms are dropped, fades stay. */}
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </MotionConfig>
  </StrictMode>,
)
