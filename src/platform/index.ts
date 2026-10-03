import { livePlatform } from './platform.live'
import { mockPlatform } from './platform.mock'
import type { Platform } from './platform'

/** Mock by default. Set localStorage.platform = 'live' to try the live adapter once it exists. */
export function getPlatform(): Platform {
  return typeof localStorage !== 'undefined' && localStorage.getItem('platform') === 'live' ? livePlatform : mockPlatform
}
export const platform: Platform = new Proxy({} as Platform, {
  get: (_t, prop: string) => (getPlatform() as unknown as Record<string, unknown>)[prop],
})
export type { Platform } from './platform'
