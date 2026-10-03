import { describe, expect, it } from 'vitest'
import { formatCard, hasValidCheckDigit, isWellFormed } from '../src/shared/cardNumber'
import { SAMPLE_BAD_CHECK, SAMPLE_COVERED } from '../src/shared/seed'

describe('card numbers', () => {
  it('generates numbers that pass their own check', () => {
    expect(hasValidCheckDigit(formatCard('4A7C1180'))).toBe(true)
    expect(hasValidCheckDigit(SAMPLE_COVERED)).toBe(true)
  })
  it('rejects a bad check digit and malformed numbers', () => {
    expect(isWellFormed(SAMPLE_BAD_CHECK)).toBe(true)
    expect(hasValidCheckDigit(SAMPLE_BAD_CHECK)).toBe(false)
    expect(isWellFormed('hello')).toBe(false)
  })
})
