import { useEffect, useState } from 'react'

/** Current time as HH:MM, refreshed every 20 s. Used in the presenter header and the phone status bar. */
export function useClockLabel() {
  const fmt = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const [label, setLabel] = useState(fmt)
  useEffect(() => {
    const id = setInterval(() => setLabel(fmt()), 20_000)
    return () => clearInterval(id)
  }, [])
  return label
}

/** True when the OS asks for reduced motion. */
export function useReducedMotion() {
  const query = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const [reduce, setReduce] = useState<boolean>(query)
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return
    const on = () => setReduce(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduce
}
