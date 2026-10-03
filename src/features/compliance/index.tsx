import { useDemo } from '../../state/store'
import { compliancePct } from '../../shared/selectors'

/** PLACEHOLDER. Fable lane: build the compliance console here (see LANE.md). */
export default function ComplianceScreen() {
  const exceptions = useDemo((s) => s.exceptions)
  const pct = compliancePct({ exceptions })
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Compliance console</h2>
      <p className="text-4xl font-semibold">{pct}%</p>
      <p className="text-sm text-muted">Placeholder. {exceptions.length} exception rows. Replace this screen (lane: compliance).</p>
    </div>
  )
}
