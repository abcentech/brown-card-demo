import { useState } from 'react'
import { platform } from '../../platform'
import { SAMPLE_COVERED } from '../../shared/seed'
import type { IncidentResult } from '../../shared/types'

/** PLACEHOLDER. Sonnet lane: build the incident reporter here (see LANE.md). */
export default function ReporterScreen() {
  const [result, setResult] = useState<IncidentResult | null>(null)
  const [busy, setBusy] = useState(false)
  const submit = async () => {
    setBusy(true)
    setResult(
      await platform.createIncident({
        cardNumber: SAMPLE_COVERED, crossing: 'Seme–Krake', country: 'Benin', parties: 2,
        injuries: false, narrative: 'Placeholder report', photoCount: 0,
      }),
    )
    setBusy(false)
  }
  return (
    <div className="space-y-3 p-5">
      <h2 className="text-lg font-semibold">Report an incident</h2>
      <p className="text-sm text-muted">Placeholder. Replace this screen (lane: reporter).</p>
      <button onClick={submit} disabled={busy} className="rounded bg-ink px-4 py-2 text-paper disabled:opacity-50">
        {busy ? 'Sending…' : 'Send a test report'}
      </button>
      {result && <p className="rounded bg-mint/15 p-3 text-sm">{result.smsPreview}</p>}
    </div>
  )
}
