import { Button } from '../../components/Button'
import { buttonClass } from '../../components/buttonStyles'
import { Sheet } from '../../components/Sheet'
import { WAITLIST_FORM_URL } from '../../lib/constants'

/** "Upload a statement" is shown but not built: a fake door that measures demand (docs/beta-spec.md). */
export function UploadFakeDoor({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} title="Coming soon" onClose={onClose}>
      <p className="text-sm text-neutral-700">
        Reading your statements for you is on the way. Want early access?
      </p>
      {WAITLIST_FORM_URL && (
        <a href={WAITLIST_FORM_URL} target="_blank" rel="noreferrer" className={`${buttonClass('primary')} h-12`}>
          Get early access
        </a>
      )}
      <Button variant="secondary" onClick={onClose}>Not now</Button>
    </Sheet>
  )
}
