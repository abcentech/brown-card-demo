// Single source of truth for the demo, persisted in the browser and synced across windows
// with BroadcastChannel (works offline). FROZEN after the scaffold: lanes read it through hooks
// and mutate it only through the platform adapter (src/platform).
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { seedClaims, seedExceptions, seedRegistry } from '../shared/seed'
import type { Claim, DemoStep, ExceptionAction, ExceptionRow, IssuedPolicy, RegistryEntry } from '../shared/types'

export interface DemoData {
  step: DemoStep
  claims: Claim[]
  exceptions: ExceptionRow[]
  registry: Record<string, RegistryEntry>
  issued: IssuedPolicy[]
  revision: number // increments on every change; useful for "new arrival" effects
}

export interface DemoActions {
  setStep: (s: DemoStep) => void
  addClaim: (c: Claim) => void
  advanceClaim: (ref: string) => void
  escalateClaim: (ref: string) => void
  addRegistryEntry: (card: string, entry: RegistryEntry, issued: IssuedPolicy) => void
  applyExceptionAction: (ids: string[], action: ExceptionAction, assignee?: string) => number
  reset: () => void
}

export type DemoState = DemoData & DemoActions

/** Bumped on every reset so adapters can drop requests that were in flight when the demo was reset. */
let resetGeneration = 0
export const getResetGeneration = () => resetGeneration

const fresh = (): DemoData => ({
  step: 0,
  claims: seedClaims(),
  exceptions: seedExceptions(),
  registry: seedRegistry(),
  issued: [],
  revision: 0,
})

const DATA_KEYS: (keyof DemoData)[] = ['step', 'claims', 'exceptions', 'registry', 'issued', 'revision']
const dataOf = (s: DemoState): DemoData =>
  Object.fromEntries(DATA_KEYS.map((k) => [k, s[k]])) as unknown as DemoData

export const useDemo = create<DemoState>()(
  persist(
    (set, get) => ({
      ...fresh(),
      setStep: (step) => set((s) => ({ step, revision: s.revision + 1 })),
      addClaim: (c) => set((s) => ({ claims: [c, ...s.claims], revision: s.revision + 1 })),
      advanceClaim: (ref) =>
        set((s) => ({
          claims: s.claims.map((c) => (c.ref === ref && c.stage < 4 ? { ...c, stage: (c.stage + 1) as Claim['stage'] } : c)),
          revision: s.revision + 1,
        })),
      escalateClaim: (ref) =>
        set((s) => ({ claims: s.claims.map((c) => (c.ref === ref ? { ...c, escalated: true } : c)), revision: s.revision + 1 })),
      addRegistryEntry: (card, entry, issued) =>
        set((s) => ({ registry: { ...s.registry, [card]: entry }, issued: [issued, ...s.issued], revision: s.revision + 1 })),
      // Returns the number of policies cleared. 'backfill' resolves a batch; 'remind' and 'assign' mark progress.
      applyExceptionAction: (ids, action, assignee) => {
        const wanted = new Set(ids)
        let cleared = 0
        set((s) => ({
          exceptions: s.exceptions.map((e) => {
            if (!wanted.has(e.id) || e.status === 'resolved') return e
            if (action === 'backfill') {
              cleared += e.policiesAffected
              return { ...e, status: 'resolved' as const }
            }
            if (action === 'remind') return { ...e, status: 'reminded' as const }
            return { ...e, status: 'assigned' as const, assignee: assignee ?? e.assignee ?? 'Compliance desk' }
          }),
          revision: s.revision + 1,
        }))
        return cleared
      },
      reset: () => {
        resetGeneration += 1
        set({ ...fresh(), revision: get().revision + 1 })
      },
    }),
    { name: 'bcd-state-v1', partialize: (s) => dataOf(s) as unknown as DemoState },
  ),
)

// Cross-window sync (e.g. phone view in one window, dashboard in another).
const TAB_ID = Math.random().toString(36).slice(2)
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('bcd-sync') : null
let applyingRemote = false
channel?.addEventListener('message', (e: MessageEvent) => {
  if (!e.data || e.data.from === TAB_ID) return
  applyingRemote = true
  useDemo.setState(e.data.data as DemoData)
  applyingRemote = false
})
useDemo.subscribe((s) => {
  if (applyingRemote) return
  channel?.postMessage({ from: TAB_ID, data: dataOf(s) })
})
