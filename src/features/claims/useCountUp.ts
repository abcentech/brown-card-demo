import { useEffect, useRef, useState } from 'react'

/** Tween a number toward its target with requestAnimationFrame so big figures visibly count. */
export function useCountUp(target: number, ms = 500): number {
  const [value, setValue] = useState(target)
  const shown = useRef(target)
  const raf = useRef(0)
  useEffect(() => {
    const begin = shown.current
    if (begin === target) return
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms)
      const eased = 1 - Math.pow(1 - t, 3)
      const v = begin + (target - begin) * eased
      shown.current = v
      setValue(v)
      if (t < 1) raf.current = requestAnimationFrame(tick)
      else shown.current = target
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, ms])
  return value
}
