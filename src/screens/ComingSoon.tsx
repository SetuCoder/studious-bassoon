import { ScreenBody } from '../components/Layout'
import { TopBar } from '../components/TopBar'

/** Stand-in for tab roots that aren't built yet. Remove each use as its screen lands. */
export function ComingSoon({ title }: { title: string }) {
  return (
    <>
      <TopBar title={title} />
      <ScreenBody>
        <p className="text-neutral-600">This screen is being built.</p>
      </ScreenBody>
    </>
  )
}
