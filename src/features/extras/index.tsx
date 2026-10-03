// Extras lane (Sol): card allocation, short-code simulator and the NAICOM return download.
import { useEffect, useState } from 'react'
import { useDemo } from '../../state/store'
import CardAllocation from './CardAllocation'
import ShortCodeSimulator from './ShortCodeSimulator'
import { downloadReturnCsv } from './returnCsv'

export { buildReturnCsv, downloadReturnCsv } from './returnCsv'
export { ussdText, SHORT_CODE } from './ShortCodeSimulator'

export default function ExtrasScreen() {
  const [csvState, setCsvState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  const resetKey = useDemo(s => s.claims.filter(c => c.source === 'seed').map(c => c.notifiedAt).join('|'))
  useEffect(() => { setCsvState('idle') }, [resetKey])

  const download = async () => {
    setCsvState('busy')
    try {
      await downloadReturnCsv()
      setCsvState('done')
    } catch {
      setCsvState('error')
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 text-base" data-testid="extras-screen">
      <div className="rounded-md border border-gold bg-gold/15 px-4 py-2 text-base font-medium text-ink" role="note">
        Illustrative data. This screen stands in for the operators' platform; nothing here is a live system.
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Step 1 · Where the operators are today</h2>
          <p className="text-muted">A policy is issued, a card number is allocated, and anyone can check it from a phone.</p>
        </div>
        <button
          type="button"
          onClick={download}
          disabled={csvState === 'busy'}
          className="min-h-[44px] rounded-md border border-line bg-paper px-4 py-2 text-base font-medium text-ink hover:border-ink disabled:opacity-60"
        >
          {csvState === 'busy' ? 'Preparing…' : 'Download quarterly return'}
        </button>
      </div>
      {csvState === 'done' && (
        <p className="text-base text-mint" role="status">quarterly_return.csv downloaded: insurer, motor policies, cards generated, coverage.</p>
      )}
      {csvState === 'error' && (
        <p className="text-base text-clay" role="alert">The return could not be prepared. Try again.</p>
      )}

      <CardAllocation key={`allocation-${resetKey}`} />
      <ShortCodeSimulator key={`short-code-${resetKey}`} />
    </div>
  )
}
