import { useDemo } from '../../state/store'

/** PLACEHOLDER. Gemini lane: build the claims dashboard stand-in here (see LANE.md). */
export default function ClaimsScreen() {
  const claims = useDemo((s) => s.claims)
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Claims dashboard (stand-in for the operators' system)</h2>
      <p className="text-sm text-muted">Placeholder. {claims.length} claims in the store. Replace this screen (lane: claims).</p>
      <ul className="text-sm">
        {claims.map((c) => (
          <li key={c.ref} className="border-b border-line py-1">
            {c.ref} · {c.accidentCountry} · stage {c.stage + 1} of 5
          </li>
        ))}
      </ul>
    </div>
  )
}
