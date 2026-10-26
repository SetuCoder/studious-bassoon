import { Sheet } from '../../components/Sheet'
import { track, type UploadScreen } from '../../lib/analytics'
import { WAITLIST_FORM_URL } from '../../lib/constants'
import { SlabButton } from '../../ui/SlabButton'

/** "Upload a statement" is shown but not built: a fake door that measures demand (docs/beta-spec.md). */
export function UploadFakeDoor({ screen, open, onClose }: { screen: UploadScreen; open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} title="Coming soon" onClose={onClose}>
      <p className="text-[15px] leading-snug text-plum-muted">
        Reading your statements for you is on the way. Want early access?
      </p>
      {WAITLIST_FORM_URL && (
        <a
          href={WAITLIST_FORM_URL}
          target="_blank"
          rel="noreferrer"
          onClick={() => track('upload_waitlist_clicked', { screen })}
          className="flex h-14 items-center justify-center rounded-full bg-marigold text-[17px] font-extrabold text-aubergine"
          style={{ boxShadow: 'var(--shadow-slab-marigold)' }}
        >
          Get early access
        </a>
      )}
      <SlabButton variant="line" onClick={onClose}>Not now</SlabButton>
    </Sheet>
  )
}
