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
