import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '../../components/Button'
import { InfoBox } from '../../components/Cards'
import { Field, RateInput, RupeeInput } from '../../components/Field'
import { ScreenBody } from '../../components/Layout'
import { TopBar } from '../../components/TopBar'
import { HORIZON_MONTHS } from '../../engine/constants'
import { amountToPutToWork } from '../../engine/options'
import { formatINR } from '../../lib/format'
import { useAppStore } from '../../state/store'
import { DEFAULT_NEXT_RUPEE } from './useNextRupee'

const MAX_RETURN = 100

/** 06 Next rupee, inputs. Pre-filled so the first answer is one tap away. */
export function NextRupeeInputs() {
  const navigate = useNavigate()
  const last = useAppStore((s) => s.lastNextRupee) ?? DEFAULT_NEXT_RUPEE
  const setLastNextRupee = useAppStore((s) => s.setLastNextRupee)
  const [amount, setAmount] = useState(String(last.amount))
  const [buffer, setBuffer] = useState(String(last.buffer))
  const [ret, setRet] = useState(String(last.assumedReturn))
  const [tried, setTried] = useState(false)

  const input = { amount: Number(amount || 0), buffer: Number(buffer || 0), assumedReturn: Number(ret) }
  const L = amountToPutToWork(input)
  const returnError = ret === '' || ret === '.' || !(input.assumedReturn <= MAX_RETURN)
    ? `Enter a yearly return from 0 to ${MAX_RETURN}, for example 12`
    : undefined

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setTried(true)
    if (L <= 0 || returnError) return
    setLastNextRupee(input)
    navigate('/plan/results')
  }

  return (
    <>
      <TopBar title="Next rupee" />
      <ScreenBody>
        <form noValidate onSubmit={submit} className="flex flex-1 flex-col gap-4">
          <h2 className="text-2xl font-bold text-neutral-900">Where should this money go?</h2>
          <p className="text-neutral-600">
            We compare every option over {HORIZON_MONTHS} months against leaving the money in savings.
          </p>

          <Field label="Money you have to use" hint="A bonus, savings, anything">
            {(p) => <RupeeInput {...p} value={amount} onChange={setAmount} />}
          </Field>
          <Field label="Keep aside as a safety buffer" hint="We never count this money">
            {(p) => <RupeeInput {...p} value={buffer} onChange={setBuffer} />}
          </Field>
          <Field
            label="If invested, what yearly return would you assume?"
            hint="Not guaranteed. We don't recommend any product."
            error={tried ? returnError : undefined}
          >
            {(p) => <RateInput {...p} value={ret} onChange={setRet} />}
          </Field>

          <InfoBox>
            <div role="status">
              {L > 0 ? (
                <>
                  <p className="text-lg font-bold">{formatINR(L)} to put to work</p>
                  <p className="text-xs text-neutral-600">
                    {formatINR(input.amount)} minus your {formatINR(input.buffer)} buffer
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold">Nothing to put to work yet</p>
                  <p className="text-xs text-neutral-600">Your buffer covers all of the money you have to use.</p>
                </>
              )}
            </div>
          </InfoBox>

          <div className="mt-auto pt-2">
            <Button type="submit" disabled={L <= 0}>Compare options</Button>
          </div>
        </form>
      </ScreenBody>
    </>
  )
}
