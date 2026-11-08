import { istDateKey } from './time'

export interface AttRecord { date_key: string; status: string; student_id?: string }

export function computeStreak(records: AttRecord[]): number {
  // records sorted desc by date
  const presentDates = new Set(records.filter((r) => r.status === 'present').map((r) => r.date_key))
  let streak = 0
  const today = new Date()
  // walk backwards day by day
  const d = new Date(today)
  // start from today or yesterday? Streak counts consecutive days present up to today.
  for (let i = 0; i < 365; i++) {
    const key = istDateKey(d)
    if (presentDates.has(key)) {
      streak++
    } else {
      // allow today to be missing (not yet marked) without breaking
      if (i === 0) {
        // skip today if not present
      } else {
        break
      }
    }
    d.setDate(d.getDate() - 1)
  }
  return streak
}

export function computeBadges(streak: number, totalPresent: number): string[] {
  const b: string[] = []
  if (totalPresent >= 1) b.push('First Check-in')
  if (streak >= 3) b.push('3-Day Streak')
  if (streak >= 7) b.push('Week Warrior')
  if (streak >= 14) b.push('Fortnight Hero')
  if (streak >= 30) b.push('Monthly Master')
  if (totalPresent >= 50) b.push('Fifty Club')
  if (totalPresent >= 100) b.push('Century Club')
  return b
}

export function attendancePercent(records: AttRecord[]): number {
  if (!records.length) return 0
  const present = records.filter((r) => r.status === 'present').length
  return Math.round((present / Math.max(1, records.length)) * 100)
}