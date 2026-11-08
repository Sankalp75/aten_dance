import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getAllAttendanceLocal } from '../lib/offline'
import { fetchAttendanceFromCloud } from '../lib/sync'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Flame, Trophy, History as HIcon, Users } from 'lucide-react'

export default function History() {
  const { student } = useAuth()
  const nav = useNavigate()
  const [recs, setRecs] = useState<any[]>([])

  useEffect(() => {
    (async () => {
      if (!student) return
      const cloud = await fetchAttendanceFromCloud(student.id)
      const local = await getAllAttendanceLocal()
      const mine = local.filter((r) => r.studentId === student.id)
      const merged = [...mine]
      for (const c of cloud) {
        if (!merged.find((m) => m.dateKey === c.date_key)) {
          merged.push({ key: `${student.id}_${c.date_key}`, studentId: student.id, dateKey: c.date_key, status: c.status, markedAt: new Date(c.marked_at).getTime(), synced: true })
        }
      }
      merged.sort((a, b) => b.dateKey.localeCompare(a.dateKey))
      setRecs(merged)
    })()
  }, [student])

  return (
    <div className="min-h-full bg-chill p-4 pb-24">
      <header className="flex items-center gap-3 mb-4">
        <button onClick={() => nav('/')} className="p-2 rounded-full bg-white/5 text-orange-200"><ArrowLeft size={18} /></button>
        <h1 className="text-xl font-bold text-orange-300">History</h1>
      </header>
      <div className="space-y-2">
        {recs.length === 0 && <div className="card p-6 text-center text-orange-200/60">No records yet</div>}
        {recs.map((r) => (
          <div key={r.key} className="card p-3 flex items-center justify-between">
            <div>
              <div className="font-semibold text-orange-200">{r.dateKey}</div>
              <div className="text-xs text-orange-200/50">{new Date(r.markedAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${r.status === 'present' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {r.status}
            </span>
          </div>
        ))}
      </div>
      <nav className="fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur border-t border-orange-400/20 flex justify-around py-2">
        <button onClick={() => nav('/')} className="flex flex-col items-center text-orange-200/70 text-xs"><Flame size={18} /> Home</button>
        <button onClick={() => nav('/history')} className="flex flex-col items-center text-orange-300 text-xs"><HIcon size={18} /> History</button>
        <button onClick={() => nav('/badges')} className="flex flex-col items-center text-orange-200/70 text-xs"><Trophy size={18} /> Badges</button>
        <button onClick={() => nav('/leaderboard')} className="flex flex-col items-center text-orange-200/70 text-xs"><Users size={18} /> Board</button>
      </nav>
    </div>
  )
}