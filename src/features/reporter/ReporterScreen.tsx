// Incident reporter: a four-step, one-hand report flow with live card checks and an offline queue.
// Rendered inside the phone frame at demo step 2 and alone at /?view=reporter.
import { useCallback, useEffect, useRef, useState } from 'react'
import { platform } from '../../platform'
import type { IncidentInput, IncidentResult } from '../../shared/types'
import { useDemo } from '../../state/store'
import { emptyDraft, toIncidentInput, type Draft, type StepIndex } from './model'
import { clearQueue, enqueue, flushQueue, isResetError, readQueue, syncResetMarker, type QueuedReport } from './queue'
import { useOnline } from './useOnline'
import { Banner, Notice, Progress } from './ui'
import CardStep from './steps/CardStep'
import WhereStep from './steps/WhereStep'
import WhatStep from './steps/WhatStep'
import ReviewStep from './steps/ReviewStep'
import { QueuedScreen, ResultScreen } from './steps/Outcome'

type Phase =
  | { kind: 'form'; step: StepIndex }
  | { kind: 'sending' }
  | { kind: 'queued'; item: QueuedReport }
  | { kind: 'done'; input: IncidentInput; result: IncidentResult; insurerId?: string }

const seedResetKey = () => useDemo.getState().claims.find((c) => c.source === 'seed')?.notifiedAt ?? ''

const isStandalone = () =>
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('view') === 'reporter'

export default function ReporterScreen() {
  const online = useOnline()
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [phase, setPhase] = useState<Phase>({ kind: 'form', step: 0 })
  const [formKey, setFormKey] = useState(0)
  // On the main page a reset also unmounts this screen (step goes back to 0), so reconcile the queue on mount too.
  const [queueCount, setQueueCount] = useState(() => {
    syncResetMarker(seedResetKey())
    return readQueue().length
  })
  const [flushing, setFlushing] = useState(false)
  const [flushError, setFlushError] = useState('')
  const [sentWhileAway, setSentWhileAway] = useState<IncidentResult[]>([])
  const [resetNotice, setResetNotice] = useState('')
  const flushingRef = useRef(false)
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const draftRef = useRef(draft)
  draftRef.current = draft
  const topRef = useRef<HTMLDivElement>(null)

  // "Reset demo" re-seeds the store with fresh timestamps; use that as a signal to clear this screen.
  const resetKey = useDemo((s) => s.claims.find((c) => c.source === 'seed')?.notifiedAt ?? '')
  const lastReset = useRef(resetKey)
  const resetKeyRef = useRef(resetKey)
  resetKeyRef.current = resetKey

  const patch = useCallback((p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p })), [])

  const restart = useCallback(() => {
    setDraft(emptyDraft())
    setPhase({ kind: 'form', step: 0 })
    setFlushError('')
    setResetNotice('')
    setFormKey((k) => k + 1)
  }, [])

  useEffect(() => {
    if (lastReset.current === resetKey) return
    lastReset.current = resetKey
    syncResetMarker(resetKey)
    clearQueue()
    setQueueCount(0)
    setSentWhileAway([])
    restart()
  }, [resetKey, restart])

  // Scroll the phone screen back to the top on each step change (not on first paint).
  const mounted = useRef(false)
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    topRef.current?.scrollIntoView({ block: 'start' })
  }, [phase.kind, phase.kind === 'form' ? phase.step : -1])

  // Send everything held in the queue. Called on the 'online' event, on mount, and from "Try again".
  const flush = useCallback(async () => {
    if (flushingRef.current || readQueue().length === 0) return
    flushingRef.current = true
    setFlushing(true)
    setFlushError('')
    const startedAt = resetKeyRef.current
    try {
      const outcome = await flushQueue((input) => platform.createIncident(input))
      // A reset during the flush empties the queue anyway; say nothing about the dropped sends.
      if (resetKeyRef.current !== startedAt) return
      const current = phaseRef.current
      const mine = current.kind === 'queued' ? outcome.sent.find((s) => s.id === current.item.id) : undefined
      if (mine) {
        setPhase({ kind: 'done', input: mine.input, result: mine.result, insurerId: draftRef.current.verify?.insurerId })
      }
      const others = outcome.sent.filter((s) => s !== mine).map((s) => s.result)
      if (others.length) setSentWhileAway((prev) => [...prev, ...others])
      if (outcome.failed.length) setFlushError('Some reports could not be sent. They are still saved here.')
    } finally {
      flushingRef.current = false
      setFlushing(false)
      setQueueCount(readQueue().length)
    }
  }, [])

  useEffect(() => {
    if (online) void flush()
  }, [online, flush])

  const submit = async () => {
    const input = toIncidentInput(draft)
    if (!online) {
      const item = enqueue(input)
      setQueueCount(readQueue().length)
      setPhase({ kind: 'queued', item })
      return
    }
    setPhase({ kind: 'sending' })
    setResetNotice('')
    const startedAt = resetKeyRef.current
    // "Reset demo" ran while the request was in flight (same window: the adapter rejects; another window:
    // the reset arrives over the sync channel). Either way the demo starts over: say so plainly, queue nothing.
    const resetWhileSending = () => {
      setResetNotice('The demo was reset while this report was being sent. Start a new report.')
      setDraft(emptyDraft())
      setPhase({ kind: 'form', step: 0 })
      setFormKey((k) => k + 1)
    }
    try {
      const result = await platform.createIncident(input)
      if (resetKeyRef.current !== startedAt) return resetWhileSending()
      setPhase({ kind: 'done', input, result, insurerId: draft.verify?.insurerId })
    } catch (e) {
      if (isResetError(e) || resetKeyRef.current !== startedAt) return resetWhileSending()
      // Hold it on the phone rather than lose it; the queue screen offers a retry.
      const item = enqueue(input)
      setQueueCount(readQueue().length)
      setPhase({ kind: 'queued', item })
    }
  }

  const go = (step: StepIndex) => setPhase({ kind: 'form', step })
  const standalone = isStandalone()

  return (
    <div className={`flex min-h-full flex-col bg-paper text-base text-ink ${standalone ? 'min-h-screen' : ''}`}>
      <div ref={topRef} />
      <Banner />
      <div className={`flex w-full flex-1 flex-col ${standalone ? 'mx-auto max-w-md' : ''}`}>
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="leading-tight">
            <div className="text-base font-bold">Brown Card incident report</div>
            <div className="text-base text-muted">About two minutes</div>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-base font-semibold ${online ? 'bg-mint/15 text-mint' : 'bg-gold/20 text-brown'}`}
            aria-live="polite"
          >
            {online ? 'Online' : 'Offline'}
          </span>
        </header>

        {(queueCount > 0 || sentWhileAway.length > 0 || flushError || resetNotice) && (
          <div className="space-y-2 px-4 pt-3">
            {resetNotice && <Notice tone="stone">{resetNotice}</Notice>}
            {queueCount > 0 && (
              <Notice tone="gold">
                {queueCount} {queueCount === 1 ? 'report' : 'reports'} saved on this phone, {online ? (flushing ? 'sending now…' : 'ready to send.') : 'waiting for a connection.'}
              </Notice>
            )}
            {sentWhileAway.map((r) => (
              <Notice key={r.incidentRef} tone="mint">
                Saved report sent: {r.incidentRef} → claim {r.claimRef}.
              </Notice>
            ))}
            {flushError && phase.kind !== 'queued' && <Notice tone="clay">{flushError}</Notice>}
          </div>
        )}

        <main className="flex-1 space-y-5 px-4 py-4">
          {phase.kind === 'form' && (
            <>
              <Progress step={phase.step} />
              <div key={`${formKey}-${phase.step}`}>
                {phase.step === 0 && (
                  <CardStep
                    cardNumber={draft.cardNumber}
                    verify={draft.verify}
                    onChange={(cardNumber, verify) => patch({ cardNumber, verify })}
                    onNext={() => go(1)}
                  />
                )}
                {phase.step === 1 && <WhereStep draft={draft} onChange={patch} onBack={() => go(0)} onNext={() => go(2)} />}
                {phase.step === 2 && <WhatStep draft={draft} onChange={patch} onBack={() => go(1)} onNext={() => go(3)} />}
                {phase.step === 3 && (
                  <ReviewStep draft={draft} online={online} busy={false} onEdit={go} onBack={() => go(2)} onSubmit={() => void submit()} />
                )}
              </div>
            </>
          )}
          {phase.kind === 'sending' && (
            <>
              <Progress step={3} />
              <ReviewStep draft={draft} online={online} busy onEdit={() => undefined} onBack={() => undefined} onSubmit={() => undefined} />
            </>
          )}
          {phase.kind === 'queued' && (
            <QueuedScreen item={phase.item} online={online} sending={flushing} error={flushError} onRetry={() => void flush()} onRestart={restart} />
          )}
          {phase.kind === 'done' && <ResultScreen input={phase.input} result={phase.result} insurerId={phase.insurerId} onRestart={restart} />}
        </main>
      </div>
    </div>
  )
}
