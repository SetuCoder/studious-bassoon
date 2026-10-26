import { motion } from 'motion/react'
import { useId, useState } from 'react'
import { Navigate, useParams } from 'react-router'
import { whatsAppShareUrl } from '../../engine/message'
import type { ChargeCheck, ChargeStatus } from '../../engine/types'
import { track } from '../../lib/analytics'
import { CHARGE_STATUS_CHIPS } from '../../lib/chargeLabels'
import { formatINR } from '../../lib/format'
import { useAppStore } from '../../state/store'
import { Stamp } from '../../ui/Celebrate'
import { tap } from '../../ui/haptics'
import { springSettle, STAGGER } from '../../ui/motion'
import { NightScreen } from '../../ui/NightScreen'
import { Odometer } from '../../ui/Odometer'
import { SlabButton } from '../../ui/SlabButton'
import { SmearIn } from '../../ui/SmearIn'

/** 10 Charge check, result: a verdict per charge and a message the user sends themselves. */
export function ChargeResult() {
  const { checkId } = useParams()
  const check = useAppStore((s) => s.chargeChecks.find((c) => c.id === checkId))
  if (!check) return <Navigate to="/charges" replace />
  return <Result key={check.id} check={check} />
}

// The verdict, in order (seconds): the total smears in, the charges stack up, then each
// questionable charge gets stamped in turn.
const T = { figure: 0.1, rows: 0.5, stamps: 1.0 }

/** How a status is marked: a stamp that lands for the two that need action, a quiet pill otherwise. */
function StatusMark({ status, order }: { status: ChargeStatus; order: number }) {
  const label = CHARGE_STATUS_CHIPS[status]
  if (status === 'doesnt_add_up') return <Stamp tone="solid" delay={T.stamps + order * 0.35}>{label}</Stamp>
  if (status === 'ask_lender') return <Stamp tone="ice" delay={T.stamps + order * 0.35}>{label}</Stamp>
  return <span className="inline-flex rounded-full bg-aubergine px-2.5 py-0.5 text-[12px] font-bold text-mauve">{label}</span>
}

function Result({ check }: { check: ChargeCheck }) {
  const messageId = useId()
  const loanName = useAppStore((s) => s.debts.find((d) => d.id === check.debtId)?.name)
  const [message, setMessage] = useState(check.message)
  const [copied, setCopied] = useState(false)
  const nothingToAsk = check.flaggedTotal < 0.5 && check.toConfirmTotal < 0.5
  const flagged = formatINR(check.flaggedTotal)

  // Stamps land one after another, in the order the charges are listed.
  let stamped = 0
  const stampOrder = check.results.map((r) => (r.status === 'doesnt_add_up' || r.status === 'ask_lender' ? stamped++ : -1))

  const copy = async () => {
    tap()
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      track('lender_message_copied')
    } catch {
      // Clipboard blocked (some in-app browsers): select the text so the user can copy it.
      const box = document.getElementById(messageId) as HTMLTextAreaElement | null
      box?.focus()
      box?.select()
    }
  }

  return (
    <NightScreen title="Your quote check" backTo="/debts">
      <section>
        {loanName && <p className="text-[14px] text-mauve">{loanName}, closing quote</p>}
        {nothingToAsk ? (
          <>
            <p className="mt-1 text-[30px] leading-[1] font-black tracking-[-0.03em]">No charges to question</p>
            <p className="mt-3 text-[15px] leading-snug text-mauve">
              From your answers, the RBI rule on prepayment charges doesn't stop these. Your loan agreement decides them.
            </p>
          </>
        ) : (
          <>
            {check.flaggedTotal >= 0.5 && (
              <>
                <SmearIn ghost={flagged} delay={T.figure} className="mt-1 text-[56px] leading-none font-black tracking-[-0.05em] text-marigold">
                  <Odometer value={flagged} delay={T.figure + 0.1} />
                </SmearIn>
                <p className="mt-2 text-[16px] font-semibold">of charges on this quote may not be allowed</p>
              </>
            )}
            {check.toConfirmTotal >= 0.5 && (
              <p className={`text-[16px] font-extrabold ${check.flaggedTotal >= 0.5 ? 'mt-1' : 'mt-2 text-[22px]'}`}>
                {formatINR(check.toConfirmTotal)} more to confirm with the lender
              </p>
            )}
            <p className="mt-2 text-[13px] text-mauve">Includes GST at 18% on these charges.</p>
          </>
        )}
      </section>

      <ul aria-label="Charges on the quote" className="flex flex-col gap-3">
        {check.lines.map((l, i) => (
          <motion.li
            key={i}
            className="flex flex-col gap-2 rounded-3xl bg-aubergine-raised p-4 shadow-slab"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springSettle, delay: T.rows + i * STAGGER }}
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[16px] font-bold">{l.label}</span>
              <span className="text-[17px] font-black tracking-[-0.02em] whitespace-nowrap">{formatINR(l.amount)}</span>
            </div>
            <div>
              <StatusMark status={check.results[i].status} order={stampOrder[i]} />
            </div>
            <p className="text-[13px] leading-snug text-mauve">
              {/* Don't repeat a long reason word for word on the next row. */}
              {i > 0 && check.results[i].reason === check.results[i - 1].reason ? 'Same rule applies.' : check.results[i].reason}
            </p>
          </motion.li>
        ))}
      </ul>

      {!nothingToAsk && (
        <motion.section
          className="flex flex-col gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springSettle, delay: T.stamps + stamped * 0.35 }}
        >
          {/* Not aria-labelledby: the textarea already carries this name, and two would be ambiguous. */}
          <h2 className="text-[17px] font-extrabold">Message to your lender</h2>
          <p className="text-[13px] text-mauve">Edit it if you like. We don't send anything; you do.</p>
          {/* The draft as a sheet of paper: ice on the night surface. */}
          <div className="rounded-3xl bg-ice p-1 shadow-[0_5px_0_0_#9AA5AF]">
            <label htmlFor={messageId} className="sr-only">Message to your lender</label>
            <textarea
              id={messageId}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value)
                setCopied(false)
              }}
              rows={14}
              className="w-full resize-none rounded-[20px] bg-transparent p-4 text-[14px] leading-relaxed text-aubergine outline-none focus:outline-2 focus:outline-aubergine"
            />
          </div>
          <SlabButton onClick={copy}>{copied ? 'Copied' : 'Copy message'}</SlabButton>
          <a
            href={whatsAppShareUrl(message)}
            target="_blank"
            rel="noreferrer"
            onClick={() => {
              tap()
              track('lender_message_shared')
            }}
            className="flex h-14 items-center justify-center rounded-full border-2 border-ice/70 text-[17px] font-extrabold text-ice"
          >
            Share on WhatsApp
          </a>
          <p role="status" className="sr-only">{copied ? 'Message copied' : ''}</p>
        </motion.section>
      )}

      <p className="text-xs text-mauve">A guide to what to ask, not legal advice.</p>
    </NightScreen>
  )
}
