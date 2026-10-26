import { motion } from 'motion/react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { HORIZON_MONTHS } from '../../engine/constants'
import { amountToPutToWork, rankOptions } from '../../engine/options'
import { track } from '../../lib/analytics'
import { formatINR } from '../../lib/format'
import { useAppStore } from '../../state/store'
import { Coin } from '../../ui/Coin'
import { tap } from '../../ui/haptics'
import { springPress, springSettle, STAGGER } from '../../ui/motion'
import { NightField } from '../../ui/NightField'
import { NightScreen } from '../../ui/NightScreen'
import { SlabButton } from '../../ui/SlabButton'
import { DEFAULT_NEXT_RUPEE } from './useNextRupee'

const MAX_RETURN = 100
const QUICK_RETURNS = ['8', '10', '12', '15']

/** 06 Next rupee, inputs. Pre-filled so the first answer is one tap away. */
export function NextRupeeInputs() {
  const navigate = useNavigate()
  const last = useAppStore((s) => s.lastNextRupee) ?? DEFAULT_NEXT_RUPEE
  const setLastNextRupee = useAppStore((s) => s.setLastNextRupee)
  const debts = useAppStore((s) => s.debts)
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
    const { options } = rankOptions(debts, input)
    track('next_rupee_compared', { option_count: options.length, split_shown: options.some((o) => o.id === 'split') })
    navigate('/plan/results')
  }

  const rise = (i: number) => ({
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { ...springSettle, delay: i * STAGGER },
  })

  return (
    <NightScreen title="Next rupee">
      <form noValidate onSubmit={submit} className="flex flex-1 flex-col gap-5">
        <motion.div {...rise(0)}>
          <h2 className="text-[34px] leading-[0.95] font-black tracking-[-0.045em] text-balance">Where should this money go?</h2>
          <p className="mt-3 text-[15px] leading-snug text-mauve">
            We compare every option over {HORIZON_MONTHS} months against leaving the money in savings.
          </p>
        </motion.div>

        <motion.div {...rise(1)}>
          <NightField size="hero" kind="rupees" label="Money you have to use" hint="A bonus, savings, anything" value={amount} onChange={setAmount} />
        </motion.div>

        <motion.div {...rise(2)}>
          <NightField kind="rupees" label="Keep aside as a safety buffer" hint="We never count this money" value={buffer} onChange={setBuffer} />
        </motion.div>

        <motion.div {...rise(3)}>
          <NightField
            kind="rate"
            label="If invested, what yearly return would you assume?"
            hint="Not guaranteed. We don't recommend any product."
            error={tried ? returnError : undefined}
            value={ret}
            onChange={setRet}
          >
            <div className="flex gap-2" role="group" aria-label="Common returns">
              {QUICK_RETURNS.map((r) => {
                const on = r === ret
                return (
                  <motion.button
                    key={r}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      tap()
                      setRet(r)
                    }}
                    whileTap={{ scale: 0.94 }}
                    transition={springPress}
                    className={`h-11 flex-1 rounded-full text-[15px] font-bold ${on ? 'bg-marigold text-aubergine' : 'bg-aubergine text-ice'}`}
                  >
                    {r}%
                  </motion.button>
                )
              })}
            </div>
          </NightField>
        </motion.div>

        <motion.div {...rise(4)} className="flex items-center gap-4 rounded-3xl border-2 border-dashed border-mauve/35 p-4">
          <Coin pulse={L} />
          <div role="status" className="min-w-0">
            {L > 0 ? (
              <>
                <p className="text-[22px] leading-tight font-black tracking-[-0.03em]">{formatINR(L)} to put to work</p>
                <p className="mt-1 text-[13px] text-mauve">{formatINR(input.amount)} minus your {formatINR(input.buffer)} buffer</p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold">Nothing to put to work yet</p>
                <p className="mt-1 text-[13px] text-mauve">Your buffer covers all of the money you have to use.</p>
              </>
            )}
          </div>
        </motion.div>

        <motion.div {...rise(5)} className="mt-auto pt-2">
          <SlabButton type="submit" disabled={L <= 0}>Compare options</SlabButton>
        </motion.div>
      </form>
    </NightScreen>
  )
}
