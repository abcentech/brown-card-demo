import { useEffect, useRef, useState } from 'react'

/** Tween a number toward its target so a figure visibly counts up or down. */
export function useTweened(target: number, ms = 800): number {
  const [value, setValue] = useState(target)
  const from = useRef(target)
  const raf = useRef(0)
  useEffect(() => {
    const start = performance.now()
    const begin = from.current
    if (begin === target) return
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms)
      const eased = 1 - Math.pow(1 - t, 3)
      const v = begin + (target - begin) * eased
      setValue(v)
      from.current = v // a new target mid-tween continues from the shown value instead of jumping back
      if (t < 1) raf.current = requestAnimationFrame(tick)
      else from.current = target
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, ms])
  return value
}

/** True once the component has painted; used to grow bars in from zero on mount. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return mounted
}

/** Whether the user prefers reduced motion (read once; the demo laptop will not flip it mid-session). */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
