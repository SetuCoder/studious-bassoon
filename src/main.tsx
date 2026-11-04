import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import { track } from './lib/analytics.ts'
import { APP_NAME } from './lib/constants.ts'
import { appStore } from './state/store.ts'

document.title = APP_NAME

// ?sample (dev server only) loads the sample borrower and opens the Plan tab. ?demo (any build,
// for live demos) loads it with a saved charge check; ?demo=charge opens that check. The module
// is only fetched when one of these is in the address.
const params = new URLSearchParams(location.search)
if ((import.meta.env.DEV && params.has('sample')) || params.has('demo')) {
  const { loadSampleBorrower, startDemo } = await import('./demo/sampleBorrower.ts')
  if (params.has('demo')) {
    history.replaceState(null, '', startDemo(appStore, params.get('demo') ?? '', (message) => window.confirm(message)))
  } else {
    loadSampleBorrower(appStore)
    history.replaceState(null, '', '/plan')
  }
}

track('app_opened', {
  returning: appStore.getState().debts.length > 0,
  standalone: window.matchMedia?.('(display-mode: standalone)').matches || ('standalone' in navigator && navigator.standalone === true),
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
