import { useId, useState } from 'react'
import { Navigate, useParams } from 'react-router'
import { Button } from '../../components/Button'
import { buttonClass } from '../../components/buttonStyles'
import { ChargeRow } from '../../components/ChargeRow'
import { ScreenBody } from '../../components/Layout'
import { TopBar } from '../../components/TopBar'
import { whatsAppShareUrl } from '../../engine/message'
import type { ChargeCheck } from '../../engine/types'
import { formatINR } from '../../lib/format'
import { useAppStore } from '../../state/store'

/** 10 Charge check, result: a verdict per charge and a message the user sends themselves. */
export function ChargeResult() {
  const { checkId } = useParams()
  const check = useAppStore((s) => s.chargeChecks.find((c) => c.id === checkId))
  if (!check) return <Navigate to="/charges" replace />
  return <Result key={check.id} check={check} />
}

function Result({ check }: { check: ChargeCheck }) {
  const messageId = useId()
  const [message, setMessage] = useState(check.message)
  const [copied, setCopied] = useState(false)
  const nothingToAsk = check.flaggedTotal < 0.5 && check.toConfirmTotal < 0.5

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
    } catch {
      // Clipboard blocked (some in-app browsers): select the text so the user can copy it.
      const box = document.getElementById(messageId) as HTMLTextAreaElement | null
      box?.focus()
      box?.select()
    }
  }

  return (
    <>
      <TopBar title="Your quote check" backTo="/debts" />
      <ScreenBody>
        <div className="rounded-[10px] bg-neutral-100 px-4 py-4">
          {nothingToAsk ? (
            <>
              <p className="text-lg font-bold text-neutral-900">No charges to question</p>
              <p className="mt-1 text-sm text-neutral-600">
                From your answers, the RBI rule on prepayment charges doesn't stop these. Your loan agreement decides them.
              </p>
            </>
          ) : (
            <>
              {check.flaggedTotal >= 0.5 && (
                <>
                  <p className="text-4xl font-bold whitespace-nowrap text-neutral-900">{formatINR(check.flaggedTotal)}</p>
                  <p className="mt-1 text-sm text-neutral-600">of charges on this quote may not be allowed</p>
                </>
              )}
              {check.toConfirmTotal >= 0.5 && (
                <p className={`text-sm font-semibold text-neutral-900 ${check.flaggedTotal >= 0.5 ? 'mt-1' : ''}`}>
                  {formatINR(check.toConfirmTotal)} more to confirm with the lender
                </p>
              )}
              <p className="mt-2 text-xs text-neutral-500">Includes GST at 18% on these charges.</p>
            </>
          )}
        </div>

        <ul aria-label="Charges on the quote" className="flex flex-col gap-2">
          {check.lines.map((l, i) => (
            <li key={i}>
              <ChargeRow
                label={l.label}
                amount={formatINR(l.amount)}
                status={check.results[i].status}
                // Like the wireframe: don't repeat a long reason word for word on the next row.
                reason={i > 0 && check.results[i].reason === check.results[i - 1].reason ? 'Same rule applies.' : check.results[i].reason}
              />
            </li>
          ))}
        </ul>

        {!nothingToAsk && (
          <section className="flex flex-col gap-3">
            <h2 className="font-semibold text-neutral-900">Message to your lender</h2>
            <p className="text-xs text-neutral-600">Edit it if you like. We don't send anything; you do.</p>
            <label htmlFor={messageId} className="sr-only">Message to your lender</label>
            <textarea
              id={messageId}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value)
                setCopied(false)
              }}
              rows={14}
              className="w-full rounded-[10px] border border-neutral-300 bg-white p-3 text-sm leading-relaxed focus:border-neutral-800 focus:ring-1 focus:ring-neutral-800 focus:outline-none"
            />
            <Button onClick={copy}>{copied ? 'Copied' : 'Copy message'}</Button>
            <a href={whatsAppShareUrl(message)} target="_blank" rel="noreferrer" className={`${buttonClass('secondary')} h-12`}>
              Share on WhatsApp
            </a>
            <p role="status" className="sr-only">{copied ? 'Message copied' : ''}</p>
          </section>
        )}

        <p className="text-xs text-neutral-500">A guide to what to ask, not legal advice.</p>
      </ScreenBody>
    </>
  )
}
