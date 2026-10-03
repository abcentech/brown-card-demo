import { useRef } from 'react'
import { MAX_NARRATIVE, MAX_PARTIES, MAX_PHOTOS, type Draft } from '../model'
import { Actions, Button, Field, OptionGrid } from '../ui'

const PARTY_OPTIONS = Array.from({ length: MAX_PARTIES }, (_, i) => ({ value: i + 1, label: String(i + 1) }))
const INJURY_OPTIONS = [
  { value: 'yes', label: 'Yes', hint: 'Someone was hurt' },
  { value: 'no', label: 'No', hint: 'Damage only' },
] as const

export default function WhatStep({
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
  const fileRef = useRef<HTMLInputElement>(null)

  const addPhotos = (files: FileList | null) => {
    const n = files?.length ?? 0
    if (n > 0) onChange({ photoCount: Math.min(MAX_PHOTOS, draft.photoCount + n) })
    // Clear the input so the same picker can be used again for the next photo.
    if (fileRef.current) fileRef.current.value = ''
  }

  const canContinue = draft.injuries !== null && draft.narrative.trim().length > 0
  const photosLeft = MAX_PHOTOS - draft.photoCount

  return (
    <div className="flex flex-1 flex-col gap-5">
      <Field label="Vehicles or people involved" hint="Count everyone in the accident, including you.">
        <OptionGrid<number> label="Parties involved" columns={5} options={PARTY_OPTIONS} value={draft.parties} onChange={(parties) => onChange({ parties })} />
      </Field>

      <Field label="Was anyone injured?">
        <OptionGrid<'yes' | 'no'>
          label="Injuries"
          options={INJURY_OPTIONS}
          value={draft.injuries === null ? null : draft.injuries ? 'yes' : 'no'}
          onChange={(v) => onChange({ injuries: v === 'yes' })}
        />
      </Field>

      <Field label="What happened?" hint="A sentence or two is enough." htmlFor="narrative">
        <textarea
          id="narrative"
          value={draft.narrative}
          onChange={(e) => onChange({ narrative: e.target.value.slice(0, MAX_NARRATIVE) })}
          rows={4}
          maxLength={MAX_NARRATIVE}
          placeholder="For example: Hit from behind at the border queue. Rear bumper damaged."
          className="w-full rounded-xl border border-line bg-paper px-3 py-3 text-base text-ink focus:border-ink focus:outline-2 focus:outline-brown"
        />
        <div className="text-right text-base text-muted">
          {draft.narrative.length} / {MAX_NARRATIVE}
        </div>
      </Field>

      <Field label="Photos" hint={`Up to ${MAX_PHOTOS}. Damage, number plates, the scene.`}>
        <input
          ref={fileRef}
          id="photos"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => addPhotos(e.target.files)}
          className="sr-only"
          aria-label="Add a photo"
        />
        <div className="flex items-center gap-3">
          <label
            htmlFor="photos"
            aria-disabled={photosLeft === 0}
            className={`flex min-h-12 flex-1 cursor-pointer items-center justify-center rounded-xl border text-base font-semibold ${
              photosLeft === 0 ? 'pointer-events-none border-line text-muted' : 'border-ink bg-paper text-ink hover:bg-stone'
            }`}
          >
            {draft.photoCount === 0 ? 'Take or add a photo' : photosLeft === 0 ? 'Photo limit reached' : 'Add another photo'}
          </label>
          {draft.photoCount > 0 && (
            <Button variant="ghost" onClick={() => onChange({ photoCount: 0 })}>
              Clear
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 text-base" aria-live="polite">
          <div className="flex gap-1" aria-hidden="true">
            {Array.from({ length: MAX_PHOTOS }, (_, i) => (
              <span key={i} className={`h-3 w-3 rounded-full ${i < draft.photoCount ? 'bg-mint' : 'bg-line'}`} />
            ))}
          </div>
          <span className="text-muted">
            {draft.photoCount} of {MAX_PHOTOS} photos added. Photos are counted, not uploaded, in this demo.
          </span>
        </div>
      </Field>

      <Actions onBack={onBack}>
        <Button onClick={onNext} disabled={!canContinue} className="w-full">
          Review
        </Button>
      </Actions>
    </div>
  )
}
