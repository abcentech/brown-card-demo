import type { ReactNode } from 'react'

/** Shows a mobile screen inside a phone outline on the laptop. Gemini lane: polish. */
export default function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-[390px] max-w-full rounded-[2.2rem] border-[10px] border-ink bg-paper shadow-xl">
      <div className="h-[760px] max-h-[80vh] overflow-y-auto rounded-[1.6rem]">{children}</div>
    </div>
  )
}
