import type { ReactNode } from 'react'
import { Outlet } from 'react-router'
import { TabBar } from './TabBar'

/** Main screens: content above the tab bar. */
export function TabLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex flex-1 flex-col">
        <Outlet />
      </div>
      <TabBar />
    </div>
  )
}

/** The scrolling body of a screen: 20 px sides, 16 px between blocks. */
export function ScreenBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <main className={`flex flex-1 flex-col gap-4 px-5 py-5 ${className}`}>{children}</main>
}
