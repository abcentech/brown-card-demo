import { useEffect, useRef, useState } from 'react'
import { platform } from '../../platform'
import { SAMPLE_BAD_CHECK, SAMPLE_COVERED, SAMPLE_LAPSED, SAMPLE_UNKNOWN } from '../../shared/seed'
import type { IncidentInput, IncidentResult, VerifyResult } from '../../shared/types'
import { useDemo } from '../../state/store'

const STORAGE = 'bcd-reporter-submission-v1'
const steps = ['Card', 'Where', 'What happened', 'Review']
const crossings = ['Seme–Krake', 'Idiroko–Igolo', 'Illela–Birnin Konni', 'Other']
const countries = ['Benin', 'Togo', 'Ghana', 'Niger']
const button = 'min-h-11 rounded-xl px-4 py-3 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown disabled:opacity-50'
const field = 'mt-2 min-h-12 w-full rounded-xl border border-line bg-white p-3 text-base focus:outline-2 focus:outline-brown'
type Submission = { id: string; resetKey: string; input: IncidentInput; result?: IncidentResult }
const requests = new Map<string, Promise<IncidentResult>>()
function readSubmission(resetKey: string): Submission | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(STORAGE) ?? 'null') as Submission | null
    return value?.resetKey === resetKey && value.input && value.id ? value : null
  } catch { return null }
}
function saveSubmission(value: Submission | null) {
  try { if (value) sessionStorage.setItem(STORAGE, JSON.stringify(value)); else sessionStorage.removeItem(STORAGE) } catch { /* Still held in memory when storage is unavailable. */ }
}
function sendOnce(submission: Submission) {
  let request = requests.get(submission.id)
  if (!request) {
    request = platform.createIncident(submission.input).then((result) => {
      if (readSubmission(submission.resetKey)?.id === submission.id) saveSubmission({ ...submission, result })
      return result
    }).catch((error: unknown) => { requests.delete(submission.id); throw error })
    requests.set(submission.id, request)
  }
  return request
}
export default function ReporterScreen() {
  const resetKey = useDemo((s) => s.claims.filter((claim) => claim.source === 'seed').map((claim) => claim.notifiedAt).join('|'))
  const [step, setStep] = useState(0)
  const [card, setCard] = useState('')
  const [verification, setVerification] = useState<VerifyResult | null>(null)
  const [checking, setChecking] = useState(false)
  const [crossing, setCrossing] = useState(crossings[0])
  const [country, setCountry] = useState(countries[0])
  const [parties, setParties] = useState(2)
  const [injuries, setInjuries] = useState(false)
  const [narrative, setNarrative] = useState('')
  const [photoCount, setPhotoCount] = useState(0)
  const [fileKey, setFileKey] = useState(0)
  const [location, setLocation] = useState('')
  const [online, setOnline] = useState(navigator.onLine)
  const [submission, setSubmission] = useState<Submission | null>(() => readSubmission(resetKey))
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const verifySequence = useRef(0)
  const generation = useRef(0)
  const previousReset = useRef(resetKey)
  const heading = useRef<HTMLHeadingElement>(null)
  const clear = () => {
    if (submission?.result) requests.delete(submission.id)
    generation.current += 1; verifySequence.current += 1; saveSubmission(null)
    setSubmission(null); setStep(0); setCard(''); setVerification(null); setChecking(false)
    setCrossing(crossings[0]); setCountry(countries[0]); setParties(2); setInjuries(false)
    setNarrative(''); setPhotoCount(0); setFileKey((key) => key + 1); setLocation(''); setSending(false); setError('')
  }
  useEffect(() => {
    if (previousReset.current !== resetKey) { previousReset.current = resetKey; clear() }
  }, [resetKey])
  useEffect(() => {
    const connected = () => setOnline(true)
    const disconnected = () => setOnline(false)
    window.addEventListener('online', connected); window.addEventListener('offline', disconnected)
    return () => {
      window.removeEventListener('online', connected); window.removeEventListener('offline', disconnected)
      generation.current += 1; verifySequence.current += 1
    }
  }, [])
  useEffect(() => { heading.current?.focus() }, [step, submission?.result])
  useEffect(() => {
    const sequence = ++verifySequence.current
    setVerification(null); setChecking(Boolean(card.trim()))
    if (!card.trim()) return
    const timer = window.setTimeout(() => {
      void platform.verifyCard(card).then((value) => {
        if (sequence === verifySequence.current) { setVerification(value); setChecking(false); setError('') }
      }).catch(() => {
        if (sequence === verifySequence.current) { setChecking(false); setError('Could not check this card. Try again before continuing.') }
      })
    }, 200)
    return () => window.clearTimeout(timer)
  }, [card, retry])
  useEffect(() => {
    if (!submission || submission.result || !online || submission.resetKey !== resetKey) return
    const activeGeneration = generation.current
    setSending(true); setError('')
    void sendOnce(submission).then((result) => {
      if (activeGeneration !== generation.current) return
      setSubmission({ ...submission, result }); setSending(false)
    }).catch(() => {
      if (activeGeneration !== generation.current) return
      setSending(false); setError('The report could not be sent. It is still saved here. Try again when connected.')
    })
  }, [submission, online, retry, resetKey])
  const submit = () => {
    if (submission || !verification || !narrative.trim()) return
    const value: Submission = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, resetKey,
      input: { cardNumber: verification.cardNumber, crossing, country, parties, injuries, narrative: narrative.trim(), photoCount } }
    saveSubmission(value); setSubmission(value)
  }
  const locate = () => {
    const activeGeneration = generation.current
    setLocation('Finding your location…')
    navigator.geolocation.getCurrentPosition(
      () => { if (activeGeneration === generation.current) setLocation('Location available. Confirm the crossing and country below. Coordinates are not sent in this demo.') },
      () => { if (activeGeneration === generation.current) setLocation('Location unavailable. Choose the crossing and country below.') },
      { timeout: 5000, maximumAge: 60000 })
  }
  const statusLabel = verification?.status === 'covered' ? 'Covered' : verification?.status === 'lapsed' ? 'Policy lapsed' : verification?.status === 'not_found' ? 'Card not found' : 'Invalid card number'
  const statusColor = verification?.status === 'covered' ? 'border-mint bg-mint/10' : verification?.status === 'lapsed' ? 'border-gold bg-gold/15' : 'border-clay bg-clay/10'
  return <section className="mx-auto min-h-full w-full max-w-lg bg-paper p-4 text-base text-ink sm:p-5" aria-label="Incident reporter">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3"><span className="rounded-full bg-gold/15 px-3 py-1 font-semibold text-brown">Illustrative data</span><span className="text-muted">{online ? 'Demo connection ready' : 'Offline · reports queue here'}</span></div>
    {!submission && <><p className="font-semibold text-brown">Incident reporter</p><h2 ref={heading} tabIndex={-1} className="mt-1 text-2xl font-bold outline-none">{steps[step]}</h2><p className="mt-1 text-muted">Step {step + 1} of 4 · About two minutes</p><ol className="my-5 flex gap-2" aria-label="Report progress">{steps.map((label, index) => <li key={label} aria-current={index === step ? 'step' : undefined} className={`h-2 flex-1 rounded-full ${index <= step ? 'bg-brown' : 'bg-line'}`}><span className="sr-only">{label}{index < step ? ', complete' : ''}</span></li>)}</ol></>}
    <div className="space-y-5">
      {!submission && step === 0 && <>
        <label className="block font-semibold" htmlFor="report-card">Brown Card number<input id="report-card" value={card} onChange={(event) => { setCard(event.target.value.toUpperCase()); setError('') }} className={`${field} font-mono`} placeholder="NG-26-XXXX-XXXX-C" autoCapitalize="characters" autoComplete="off" spellCheck={false} aria-describedby="card-help card-result" /></label>
        <p id="card-help" className="text-muted">Enter a card or tap an illustrative sample.</p>
        <div className="grid grid-cols-2 gap-2">{[['Covered', SAMPLE_COVERED], ['Lapsed', SAMPLE_LAPSED], ['Not found', SAMPLE_UNKNOWN], ['Invalid', SAMPLE_BAD_CHECK]].map(([label, number]) => <button key={label} type="button" onClick={() => { setCard(number); setError('') }} className={`${button} border border-line bg-white text-left`}>{label}</button>)}</div>
        <div id="card-result" aria-live="polite">{checking && <p className="rounded-xl bg-stone p-4">Checking card…</p>}{verification && <div className={`space-y-2 rounded-xl border p-4 ${statusColor}`}><p className="font-bold">{statusLabel}</p><p>{verification.message}</p>{verification.insurerId && <p>Insurer {verification.insurerId} · {verification.cover}</p>}{verification.validTo && <p>Valid to {verification.validTo}</p>}{verification.status !== 'covered' && <p className="font-semibold">You can still report. We will flag the card for review.</p>}</div>}</div>
      </>}
      {!submission && step === 1 && <>
        <label className="block font-semibold" htmlFor="report-crossing">Border crossing<select id="report-crossing" className={field} value={crossing} onChange={(event) => setCrossing(event.target.value)}>{crossings.map((name) => <option key={name}>{name}</option>)}</select></label>
        <label className="block font-semibold" htmlFor="report-country">Accident country<select id="report-country" className={field} value={country} onChange={(event) => setCountry(event.target.value)}>{countries.map((name) => <option key={name}>{name}</option>)}</select></label>
        {'geolocation' in navigator && <button type="button" onClick={locate} className={`${button} w-full border border-line bg-white`}>Use my location</button>}<p aria-live="polite" className="text-muted">{location || 'Choose where the accident happened. Location access is optional.'}</p>
      </>}
      {!submission && step === 2 && <>
        <label className="block font-semibold" htmlFor="report-parties">Parties involved<select id="report-parties" value={parties} onChange={(event) => setParties(Number(event.target.value))} className={field}>{[1, 2, 3, 4, 5].map((number) => <option key={number} value={number}>{number} {number === 1 ? 'party' : 'parties'}</option>)}</select></label>
        <fieldset><legend className="font-semibold">Was anyone injured?</legend><div className="mt-2 flex gap-2">{[false, true].map((value) => <label key={String(value)} className={`${button} flex flex-1 items-center justify-center gap-2 border ${injuries === value ? 'border-brown bg-brown/10' : 'border-line bg-white'}`}><input type="radio" name="report-injuries" checked={injuries === value} onChange={() => setInjuries(value)} />{value ? 'Yes' : 'No'}</label>)}</div></fieldset>
        <label className="block font-semibold" htmlFor="report-description">Short description<textarea id="report-description" className={field} rows={4} maxLength={600} value={narrative} onChange={(event) => setNarrative(event.target.value)} placeholder="Describe the accident. Use sample details only." required /></label><p className="text-muted">{narrative.length}/600 characters · Illustrative details only.</p>
        <label htmlFor="report-photos" className="block font-semibold">Photos (optional, up to 3)<input key={fileKey} id="report-photos" type="file" accept="image/*" capture="environment" multiple className={`${field} font-normal file:mr-3 file:min-h-11 file:rounded-lg file:border-0 file:bg-stone file:px-3`} onChange={(event) => { const files = Array.from(event.target.files ?? []); if (files.length > 3 || files.some((file) => !file.type.startsWith('image/'))) { event.target.value = ''; setPhotoCount(0); setError('Choose up to 3 image files.'); return } setPhotoCount(files.length); setError('') }} /></label><p className="text-muted">{photoCount} selected · This demo records the count only.</p>
      </>}
      {!submission && step === 3 && <><p className="text-muted">Check the details before sending.</p><dl className="space-y-3 rounded-xl border border-line bg-white p-4">{[['Card', verification?.cardNumber ?? card], ['Cover', statusLabel], ['Crossing', crossing], ['Country', country], ['Parties', String(parties)], ['Injuries', injuries ? 'Yes' : 'No'], ['Photos', String(photoCount)], ['Description', narrative]].map(([label, value]) => <div key={label}><dt className="text-muted">{label}</dt><dd className="break-words font-semibold">{value}</dd></div>)}</dl>{verification?.status !== 'covered' && <p className="rounded-xl border border-clay bg-clay/10 p-4">Cover is not confirmed. This report will be flagged for card review.</p>}{!online && <p className="rounded-xl bg-gold/15 p-4">You are offline. Your report will be saved in this tab and sent when the connection returns.</p>}</>}
      {submission && !submission.result && <><h2 ref={heading} tabIndex={-1} className="text-2xl font-bold outline-none">{sending ? 'Sending your report…' : online ? 'Report saved' : 'Report queued'}</h2><p role="status">{sending ? 'Please wait while the bureaux receive your report.' : 'Your report is saved in this tab. It will send when you are online. Keep this browser tab available.'}</p><p className="rounded-xl border border-line p-4">{submission.input.country} · {submission.input.crossing}<br /><span className="break-all font-mono">{submission.input.cardNumber}</span></p>{error && online && <button type="button" disabled={sending} onClick={() => setRetry((value) => value + 1)} className={`${button} w-full bg-ink text-paper`}>Retry sending</button>}</>}
      {submission?.result && <><h2 ref={heading} tabIndex={-1} className="text-2xl font-bold outline-none">Report received</h2><div role="status" className="space-y-3 rounded-xl border border-mint bg-mint/10 p-4"><p>Incident reference<br /><strong className="font-mono text-xl">{submission.result.incidentRef}</strong></p><p>Claim reference<br /><strong className="font-mono text-xl">{submission.result.claimRef}</strong></p></div>{!submission.result.verified && <p className="rounded-xl bg-gold/15 p-4">Card review required. Cover has not been confirmed.</p>}<div className="rounded-xl border border-line bg-white p-4"><h3 className="font-bold">SMS preview</h3><p className="mt-2">{submission.result.smsPreview}</p><p className="mt-2 text-muted">Illustrative message · No SMS is sent.</p></div><p>The {submission.input.country} Bureau handles the report. Nigeria Bureau has been notified.{verification?.insurerId ? ` Insurer ${verification.insurerId} has been notified.` : ' The insurer is identified from the card register where available.'} Keep your documents and photos.</p><button type="button" onClick={clear} className={`${button} w-full bg-ink text-paper`}>Start another report</button></>}
      {error && <p role="alert" className="rounded-xl border border-clay bg-clay/10 p-3">{error}</p>}
      {!submission && <div className="flex gap-3 border-t border-line pt-4">{step > 0 && <button type="button" onClick={() => { setStep((value) => value - 1); setError('') }} className={`${button} border border-line bg-white`}>Back</button>}{step < 3 ? <button type="button" disabled={(step === 0 && (!verification || checking)) || (step === 2 && !narrative.trim())} onClick={() => { setStep((value) => value + 1); setError('') }} className={`${button} flex-1 bg-ink text-paper`}>Continue</button> : <button type="button" onClick={submit} className={`${button} flex-1 bg-ink text-paper`}>{online ? 'Submit report' : 'Save report to send'}</button>}</div>}
      {!submission && error && step === 0 && <button type="button" onClick={() => setRetry((value) => value + 1)} className={`${button} w-full border border-line`}>Check card again</button>}
    </div>
  </section>
}
