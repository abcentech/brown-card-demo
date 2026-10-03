// PLACEHOLDER card-number format: NG-26-XXXX-XXXX-C, where C is a check digit.
// Replace with the operators' real format once confirmed. Keep these function names.

export function checkDigit(core: string): number {
  let sum = 0
  for (let i = 0; i < core.length; i++) {
    const c = core.charCodeAt(i)
    const v = c >= 48 && c <= 57 ? c - 48 : c >= 65 && c <= 70 ? c - 55 : 0
    sum += v * ((i % 6) + 2)
  }
  return (sum % 11) % 10
}

/** core8 = 8 hex characters, e.g. '4A7C1180' */
export function formatCard(core8: string): string {
  const c = core8.toUpperCase()
  return `NG-26-${c.slice(0, 4)}-${c.slice(4, 8)}-${checkDigit(c)}`
}

const RE = /^NG-26-([0-9A-F]{4})-([0-9A-F]{4})-(\d)$/

export function normaliseCard(n: string): string {
  return n.trim().toUpperCase()
}

export function isWellFormed(n: string): boolean {
  return RE.test(normaliseCard(n))
}

export function hasValidCheckDigit(n: string): boolean {
  const m = RE.exec(normaliseCard(n))
  return !!m && checkDigit(m[1] + m[2]) === Number(m[3])
}

export function randomCard(rng: () => number): string {
  const hex = '0123456789ABCDEF'
  let core = ''
  for (let i = 0; i < 8; i++) core += hex[Math.floor(rng() * 16)]
  return formatCard(core)
}
