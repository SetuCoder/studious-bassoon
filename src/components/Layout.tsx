import { Outlet } from 'react-router'
import { TabBar } from './TabBar'

/** Main screens: content, with the tab bar floating over its bottom edge. */
export function TabLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* Room for the floating bar (64px + 12px gap), inside each screen so it takes that screen's background. */}
      <div className="flex flex-1 flex-col [&>*]:pb-[calc(76px+env(safe-area-inset-bottom))]">
        <Outlet />
      </div>
      <TabBar />
    </div>
  )
}
