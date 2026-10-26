/** WF Progress: "Question 2 of 5" with a bar. */
export function ProgressBar({ step, of }: { step: number; of: number }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-neutral-600">Question {step} of {of}</p>
      <div role="progressbar" aria-label="Progress" aria-valuemin={1} aria-valuemax={of} aria-valuenow={step} className="h-1.5 rounded-full bg-neutral-200">
        <div className="h-full rounded-full bg-neutral-800" style={{ width: `${(step / of) * 100}%` }} />
      </div>
    </div>
  )
}
