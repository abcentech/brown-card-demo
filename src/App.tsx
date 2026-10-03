import { Shell, PhoneFrame } from './features/shell'
import ExtrasScreen from './features/extras'
import ReporterScreen from './features/reporter'
import ClaimsScreen from './features/claims'
import ComplianceScreen from './features/compliance'
import { useDemo } from './state/store'

/**
 * FROZEN after the scaffold. Lanes replace the screens behind these imports, not this file.
 * Extra windows: add ?view=reporter, ?view=claims or ?view=compliance to open one screen alone
 * (open the reporter on a phone or in a second window and the dashboard here; they sync live).
 */
export default function App() {
  const step = useDemo((s) => s.step)
  const view = new URLSearchParams(window.location.search).get('view')

  if (view === 'reporter') return <ReporterScreen />
  if (view === 'claims') return <div className="p-5"><ClaimsScreen /></div>
  if (view === 'compliance') return <div className="p-5"><ComplianceScreen /></div>

  return (
    <Shell>
      {step === 0 && <ExtrasScreen />}
      {step === 1 && (
        <PhoneFrame>
          <ReporterScreen />
        </PhoneFrame>
      )}
      {step === 2 && <ClaimsScreen />}
      {step === 3 && <ComplianceScreen />}
      {step === 4 && (
        <div className="mx-auto max-w-2xl space-y-3 py-10">
          <h2 className="text-2xl font-semibold">What we need from the operators</h2>
          <p className="text-muted">Closing slide. Fill in from docs/DEMO_SCRIPT.md.</p>
        </div>
      )}
    </Shell>
  )
}
