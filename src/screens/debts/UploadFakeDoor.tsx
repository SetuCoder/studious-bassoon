import { Sheet } from '../../components/Sheet'
import { WAITLIST_FORM_URL } from '../../lib/constants'
import { SlabButton } from '../../ui/SlabButton'

/** "Upload a statement" is shown but not built: a fake door that measures demand (docs/beta-spec.md). */
export function UploadFakeDoor({ open, onClose }: { open: boolean; onClose: () => void }) {
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
