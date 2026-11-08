import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchStudentsFromCloud, fetchAttendanceFromCloud, fetchAllAttendanceCloud } from '../lib/sync'
import { getCachedStudents } from '../lib/offline'
import { istDateKey } from '../lib/time'
import { useNavigate } from 'react-router-dom'
import { LogOut, Users, UserX, CheckCircle, AlertTriangle } from 'lucide-react'

export default function AdminDashboard() {
  const { logout } = useAuth()
  const nav = useNavigate()
  const [students, setStudents] = useState<any[]>([])
  const [todayAtt, setTodayAtt] = useState<any[]>([])
  const [allAtt, setAllAtt] = useState<any[]>([])

  const load = async () => {
    let s = await fetchStudentsFromCloud()
    if (!s.length) s = await getCachedStudents()
    setStudents(s)
    const key = istDateKey()
    const t = await fetchAttendanceFromCloud(undefined, key)
    setTodayAtt(t)
    const a = await fetchAllAttendanceCloud()
    setAllAtt(a)
  }
  useEffect(() => { load() }, [])

  const presentIds = new Set(todayAtt.filter((a) => a.status === 'present').map((a) => a.student_id))
  const absent = students.filter((s) => !presentIds.has(s.id))
  // consecutive absence alerts (3+)
  const alerts: any[] = []
  const byStudent: Record<string, any[]> = {}
  for (const a of allAtt) { (byStudent[a.student_id] ||= []).push(a) }
  for (const s of students) {
    const recs = (byStudent[s.id] || []).sort((x, y) => y.date_key.localeCompare(x.date_key))
    let consec = 0
    for (const r of recs) {
      if (r.status !== 'present') consec++
      else break
    }
    if (consec >= 3) alerts.push({ student: s, consec })
  }

  return (
    <div className="min-h-full bg-chill p-4 pb-24">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-orange-300">Warden Dashboard</h1>
        <button onClick={() => { logout(); nav('/login') }} className="p-2 rounded-full bg-white/5 text-orange-200"><LogOut size={18} /></button>
      </header>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="card p-3 text-center">
          <Users className="mx-auto text-orange-400" size={20} />
          <div className="text-xl font-bold text-orange-300">{students.length}</div>
          <div className="text-xs text-orange-200/60">Students</div>
        </div>
        <div className="card p-3 text-center">
          <CheckCircle className="mx-auto text-green-400" size={20} />
          <div className="text-xl font-bold text-green-400">{presentIds.size}</div>
          <div className="text-xs text-orange-200/60">Present</div>
        </div>
        <div className="card p-3 text-center">
          <UserX className="mx-auto text-red-400" size={20} />
          <div className="text-xl font-bold text-red-400">{absent.length}</div>
          <div className="text-xs text-orange-200/60">Absent</div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="card p-4 mb-4 border-red-500/40">
          <div className="flex items-center gap-2 text-red-400 font-semibold mb-2"><AlertTriangle size={18} /> Absence Alerts</div>
          <div className="space-y-1">
            {alerts.map((a) => (
              <div key={a.student.id} className="text-sm text-orange-200">
                {a.student.name} (Room {a.student.room}) — {a.consec} consecutive absences
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-4 mb-4">
        <div className="font-semibold text-orange-300 mb-2">Absent Tonight ({absent.length})</div>
        <div className="max-h-60 overflow-y-auto space-y-1">
          {absent.length === 0 && <div className="text-sm text-green-400">Everyone present! 🎉</div>}
          {absent.map((s) => (
            <div key={s.id} className="flex items-center justify-between text-sm">
              <span className="text-orange-200">{s.name}</span>
              <span className="text-orange-200/50">Room {s.room}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => nav('/admin/students')} className="btn-primary flex-1 py-3">Manage Students</button>
        <button onClick={() => nav('/admin/reports')} className="btn-primary flex-1 py-3">Reports</button>
      </div>
    </div>
  )
}