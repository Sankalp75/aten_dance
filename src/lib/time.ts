// All attendance logic is based on India (IST, UTC+5:30).
const TZ = 'Asia/Kolkata'

export function istNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: TZ }))
}

export function istDateKey(d: Date = istNow()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function windowFor(date: Date = istNow()): { open: Date; close: Date } {
  const open = new Date(date)
  open.setHours(22, 30, 0, 0)
  const close = new Date(date)
  close.setHours(23, 0, 0, 0)
  return { open, close }
}

export type WindowState = 'before' | 'open' | 'closed'

export function windowState(now: Date = istNow()): WindowState {
  const { open, close } = windowFor(now)
  if (now < open) return 'before'
  if (now <= close) return 'open'
  return 'closed'
}

export function msUntilOpen(now: Date = istNow()): number {
  const { open } = windowFor(now)
  if (now >= open) {
    // next day
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const w = windowFor(tomorrow)
    return w.open.getTime() - now.getTime()
  }
  return open.getTime() - now.getTime()
}

export function msUntilClose(now: Date = istNow()): number {
  const { close } = windowFor(now)
  return Math.max(0, close.getTime() - now.getTime())
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}