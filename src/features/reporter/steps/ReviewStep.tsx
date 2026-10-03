import { STATUS_META, type Draft, type StepIndex } from '../model'
import { Actions, Button, Notice } from '../ui'

export default function ReviewStep({
  draft,
  online,
  busy,
  onEdit,
  onBack,
  onSubmit,
}: {
  draft: Draft
  online: boolean
  busy: boolean
  onEdit: (step: StepIndex) => void
  onBack: () => void
  onSubmit: () => void
}) {
  const covered = draft.verify?.status === 'covered'
  const rows: { label: string; value: string; step: StepIndex }[] = [
    { label: 'Card', value: draft.verify?.cardNumber ?? draft.cardNumber, step: 0 },
    { label: 'Cover', value: draft.verify ? STATUS_META[draft.verify.status].label : 'Not checked', step: 0 },
    { label: 'Crossing', value: draft.crossing ?? '', step: 1 },
    { label: 'Country', value: draft.country ?? '', step: 1 },
    { label: 'Parties', value: String(draft.parties), step: 2 },
    { label: 'Injuries', value: draft.injuries ? 'Yes' : 'No', step: 2 },
    { label: 'Photos', value: String(draft.photoCount), step: 2 },
    { label: 'What happened', value: draft.narrative.trim(), step: 2 },
  ]

  return (
    <div className="flex flex-1 flex-col gap-5">
      <p className="text-base text-muted">Check the details, then send.</p>

      <dl className="divide-y divide-line rounded-xl border border-line bg-paper">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start gap-3 px-3 py-2">
            <div className="min-w-0 flex-1">
              <dt className="text-base text-muted">{r.label}</dt>
              <dd className={`break-words text-base font-semibold ${r.label === 'Card' ? 'font-mono' : ''}`}>{r.value || '—'}</dd>
            </div>
            <button
              type="button"
              onClick={() => onEdit(r.step)}
              aria-label={`Edit ${r.label.toLowerCase()}`}
              className="min-h-11 min-w-11 shrink-0 rounded-lg px-2 text-base text-brown underline-offset-4 hover:underline"
            >
              Edit
            </button>
          </div>
        ))}
      </dl>

      {!covered && (
        <Notice tone="gold">
          <strong>Cover not confirmed.</strong> The report will go through, flagged for the bureau to check the card first.
        </Notice>
      )}
      {!online && (
        <Notice tone="gold">
          <strong>You are offline.</strong> The report will be saved on this phone and sent as soon as a connection returns.
        </Notice>
      )}

      <Actions onBack={onBack}>
        <Button onClick={onSubmit} disabled={busy} className="w-full">
          {busy ? 'Sending…' : online ? 'Send report' : 'Save and send when online'}
        </Button>
      </Actions>
    </div>
  )
}
