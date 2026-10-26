import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'motion/react'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import { APP_NAME } from './lib/constants.ts'

document.title = APP_NAME

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
