import { useEffect, useRef, useState } from 'react'
import { useDemo } from '../../state/store'

/**
 * Main-window toast when a claim created by the reporter arrives in the store (from this or another window).
 * Read-only: uses useDemo selectors, never writes. Shows for 5 s; "Show" jumps to the claims dashboard.
 */
export default function ArrivalToast({ onShow }: { onShow: () => void }) {
  const claims = useDemo((s) => s.claims)
  const seen = useRef<Set<string> | null>(null)
  const [toast, setToast] = useState<{ ref: string; key: number } | null>(null)

  useEffect(() => {
    const refs = new Set(claims.map((c) => c.ref))
    if (seen.current) {
      const fresh = claims.find((c) => c.source === 'reporter' && !seen.current!.has(c.ref))
      if (fresh) setToast({ ref: fresh.ref, key: Date.now() })
    }
    seen.current = refs
  }, [claims])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 5_000)
    return () => clearTimeout(id)
  }, [toast])

  if (!toast) return null
  return (
    <div
      key={toast.key}
      aria-live="polite"
      data-testid="arrival-toast"
      className="bcd-toast bcd-shadow-lg fixed bottom-6 right-6 z-40 flex max-w-[560px] items-center gap-4 rounded-xl border border-paper/10 bg-ink px-5 py-4 text-paper"
    >
      <span aria-hidden className="relative flex h-4 w-4 shrink-0">
        <span className="bcd-pulse absolute inset-0 rounded-full bg-gold" />
        <span className="relative h-4 w-4 rounded-full bg-gold" />
      </span>
      <p className="text-base leading-snug">
        New report from the crossing · <span className="font-mono font-semibold text-gold">{toast.ref}</span> · now on the claims
        dashboard
      </p>
      <button
        type="button"
        onClick={() => {
          setToast(null)
          onShow()
        }}
        className="shrink-0 rounded-lg bg-gold px-4 py-2 text-base font-bold text-ink hover:bg-paper"
      >
        Show
      </button>
    </div>
  )
}
