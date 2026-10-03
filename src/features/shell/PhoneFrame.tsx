import type { ReactNode } from 'react'
export default function PhoneFrame({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-[430px]">
    <p className="mb-3 text-center text-base font-semibold text-muted">Phone view · report from the accident scene</p>
    <div className="overflow-hidden rounded-[2.2rem] border-[8px] border-ink bg-paper shadow-xl sm:border-[10px]">
      <div className="flex h-7 items-center justify-center bg-ink"><div className="h-1.5 w-20 rounded-full bg-paper/40" /></div>
      <div className="max-h-[78vh] overflow-y-auto bg-paper">{children}</div>
      <div className="flex h-6 items-center justify-center"><div className="h-1 w-24 rounded-full bg-ink/40" /></div>
    </div>
  </div>
}
