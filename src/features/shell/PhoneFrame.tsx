import { useEffect, useState, type ReactNode } from 'react'

/** Shows a mobile screen inside a phone outline on the laptop. Pure CSS: notch, status bar, home bar. */
export default function PhoneFrame({ children }: { children: ReactNode }) {
  const time = useClockLabel()
  return (
    <div className="mx-auto w-[400px] max-w-full">
      <p className="mb-2 text-center text-base font-semibold text-muted">Phone view · report from the accident scene</p>
      <div className="relative rounded-[3rem] bg-ink p-[10px] shadow-[0_30px_60px_-20px_rgba(18,38,30,0.6)] ring-1 ring-ink2">
        {/* Side buttons */}
        <span aria-hidden className="absolute -left-[3px] top-28 h-10 w-[3px] rounded-l bg-ink2" />
        <span aria-hidden className="absolute -left-[3px] top-44 h-16 w-[3px] rounded-l bg-ink2" />
        <span aria-hidden className="absolute -right-[3px] top-36 h-20 w-[3px] rounded-r bg-ink2" />

        {/* Height follows the window so the whole phone sits above the fold on a 768px projector; the screen inside scrolls. */}
        <div className="flex h-[clamp(360px,calc(100dvh_-_320px),780px)] flex-col overflow-hidden rounded-[2.4rem] bg-paper">
          {/* Status bar with notch */}
          <div className="relative flex h-11 shrink-0 items-center justify-between bg-paper px-6 text-base font-semibold text-ink">
            <span className="tabular-nums">{time}</span>
            <span aria-hidden className="absolute left-1/2 top-0 h-7 w-32 -translate-x-1/2 rounded-b-2xl bg-ink" />
            <span className="flex items-center gap-1.5" aria-label="Signal, Wi-Fi and battery">
              <span aria-hidden className="flex items-end gap-[2px]">
                <i className="block h-1.5 w-[3px] rounded-sm bg-ink" />
                <i className="block h-2.5 w-[3px] rounded-sm bg-ink" />
                <i className="block h-3.5 w-[3px] rounded-sm bg-ink" />
                <i className="block h-4 w-[3px] rounded-sm bg-ink/40" />
              </span>
              <span aria-hidden className="ml-1 flex h-3 w-6 items-center rounded-[3px] border border-ink p-[1px]">
                <i className="block h-full w-[80%] rounded-[1px] bg-mint" />
              </span>
            </span>
          </div>

          {/* The screen itself keeps its own scroll */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>

          {/* Home indicator */}
          <div className="flex h-6 shrink-0 items-center justify-center bg-paper">
            <span aria-hidden className="h-1.5 w-28 rounded-full bg-ink/70" />
          </div>
        </div>
      </div>
    </div>
  )
}

function useClockLabel() {
  const fmt = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const [label, setLabel] = useState(fmt)
  useEffect(() => {
    const id = setInterval(() => setLabel(fmt()), 30_000)
    return () => clearInterval(id)
  }, [])
  return label
}
