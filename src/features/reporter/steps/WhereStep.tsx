import { useEffect, useRef, useState } from 'react'
import { COUNTRIES, CROSSINGS, CROSSING_COUNTRY, type Country, type Crossing, type Draft } from '../model'
import { Actions, Button, Field, OptionGrid } from '../ui'

type Locate = 'idle' | 'finding' | 'found' | 'unavailable'

export default function WhereStep({
  draft,
  onChange,
  onBack,
  onNext,
}: {
  draft: Draft
  onChange: (patch: Partial<Draft>) => void
  onBack: () => void
  onNext: () => void
}) {
  const hasGeo = typeof navigator !== 'undefined' && 'geolocation' in navigator
  const [locate, setLocate] = useState<Locate>(draft.location ? 'found' : 'idle')
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => void (alive.current = false)
  }, [])

  const useLocation = () => {
    setLocate('finding')
    // Never blocks: the user can carry on while this runs, and any failure just shows a hint.
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!alive.current) return
        onChange({ location: { lat: pos.coords.latitude, lon: pos.coords.longitude } })
        setLocate('found')
      },
      () => alive.current && setLocate('unavailable'),
      { timeout: 6000, maximumAge: 120000 },
    )
  }

  const pickCrossing = (c: Crossing) => {
    const suggested = CROSSING_COUNTRY[c]
    onChange({ crossing: c, country: suggested ?? draft.country })
  }

  const canContinue = !!draft.crossing && !!draft.country

  return (
    <div className="space-y-5">
      <Field label="Border crossing" hint="Where the vehicle crossed, or the nearest one.">
        <OptionGrid<Crossing>
          label="Border crossing"
          options={CROSSINGS.map((c) => ({ value: c, label: c }))}
          value={draft.crossing}
          onChange={pickCrossing}
        />
      </Field>

      <Field label="Country where the accident happened">
        <OptionGrid<Country>
          label="Accident country"
          options={COUNTRIES.map((c) => ({ value: c, label: c }))}
          value={draft.country}
          onChange={(country) => onChange({ country })}
        />
      </Field>

      {hasGeo && (
        <div className="space-y-2">
          <Button variant="secondary" onClick={useLocation} disabled={locate === 'finding'} className="w-full">
            {locate === 'finding' ? 'Finding your location…' : 'Use my location (optional)'}
          </Button>
          <p className="text-base text-muted" aria-live="polite">
            {locate === 'found' && draft.location
              ? `Location noted (${draft.location.lat.toFixed(3)}, ${draft.location.lon.toFixed(3)}). It is kept with the report as a hint; confirm the crossing above.`
              : locate === 'unavailable'
                ? 'Location not available. Pick the crossing and country above.'
                : 'Optional. You can carry on without it.'}
          </p>
        </div>
      )}

      <Actions onBack={onBack}>
        <Button onClick={onNext} disabled={!canContinue} className="w-full">
          Next
        </Button>
      </Actions>
    </div>
  )
}
