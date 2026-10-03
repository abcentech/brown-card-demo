import { useEffect, useState } from 'react'

/** Tracks navigator.onLine. Assumes online where the browser cannot say. */
export function useOnline(): boolean {
  const [online, setOnline] = useState<boolean>(() =>
    typeof navigator === 'undefined' || typeof navigator.onLine !== 'boolean' ? true : navigator.onLine,
  )
  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => {
      window.removeEventListener('online', up)
      window.removeEventListener('offline', down)
    }
  }, [])
  return online
}
