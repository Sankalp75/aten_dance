import { supabase } from './supabase'
import { getPending, markPendingSynced, cacheStudents } from './offline'

export async function syncPending(): Promise<number> {
  if (!supabase) return 0
  const pending = await getPending()
  let done = 0
  for (const p of pending) {
    try {
      if (p.type === 'attendance') {
        const rec = p.payload
        const { error } = await supabase.from('attendance').upsert({
          student_id: rec.studentId,
          date_key: rec.dateKey,
          status: rec.status,
          marked_at: new Date(rec.markedAt).toISOString(),
          source: rec.source,
        }, { onConflict: 'student_id,date_key' })
        if (!error) {
          await markPendingSynced(p.id)
          done++
        }
      }
    } catch (e) {
      console.warn('sync failed', e)
    }
  }
  return done
}

export async function fetchStudentsFromCloud() {
  if (!supabase) return []
  const { data, error } = await supabase.from('students').select('*').order('name')
  if (error) { console.warn(error); return [] }
  await cacheStudents(data || [])
  return data || []
}

export async function fetchAttendanceFromCloud(studentId?: string, dateKey?: string) {
  if (!supabase) return []
  let q = supabase.from('attendance').select('*')
  if (studentId) q = q.eq('student_id', studentId)
  if (dateKey) q = q.eq('date_key', dateKey)
  const { data, error } = await q.order('marked_at', { ascending: false })
  if (error) { console.warn(error); return [] }
  return data || []
}

export async function fetchAllAttendanceCloud() {
  if (!supabase) return []
  const { data, error } = await supabase.from('attendance').select('*').order('marked_at', { ascending: false })
  if (error) { console.warn(error); return [] }
  return data || []
}

// subscribe to realtime attendance changes
export function subscribeAttendance(cb: (row: any) => void) {
  if (!supabase) return () => {}
  const channel = supabase.channel('attendance-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, (payload) => {
      cb(payload.new || payload.old)
    })
    .subscribe()
  return () => { if (supabase) supabase.removeChannel(channel) }
}