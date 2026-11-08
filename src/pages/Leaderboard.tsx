import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchStudentsFromCloud, fetchAllAttendanceCloud } from '../lib/sync'
import { getCachedStudents } from '../lib/offline'
import { computeStreak } from '../lib/stats'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Flame, Trophy, Users } from 'lucide-react'

interface Row { id: string; name: string; room: string; streak: number; total: number }

export default function Leaderboard() {
  const { student } = useAuth()
  const nav = useNavigate()
  const [rows, setRows] = useState<Row[]>([])

  useEffect(() => {
    (async () => {
      let students = await fetchStudentsFromCloud()
      if (!students.length) students = await getCachedStudents()
      const att = await fetchAllAttendanceCloud()
      const byStudent: Record<string, any[]> = {}
      for (const a of att) {
        if (!byStudent[a.student_id]) byStudent[a.student_id] = []
        byStudent[a.student_id].push({ date_key: a.date_key, status: a.status })
      }
      const rows: Row[] = students.map((s: any) => {
        const recs = byStudent[s.id] || []
        const present = recs.filter((r) => r.status === 'present').length
        return { id: s.id, name: s.name, room: s.room, streak: computeStreak(recs), total: present }
      })
      rows.sort((a, b) => b.streak - a.streak || b.total - a.total)
      setRows(rows)
    })()
  }, [])

  return (
    <div className="min-h-full bg-chill p-4 pb-24">
      <header className="flex items-center gap-3 mb-4">
        <button onClick={() => nav('/')} className="p-2 rounded-full bg-white/5 text-orange-200"><ArrowLeft size={18} /></button>
        <h1 className="text-xl font-bold text-orange-300">Leaderboard</h1>
      </header>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={r.id} className={`card p-3 flex items-center gap-3 ${r.id === student?.id ? 'ring-2 ring-orange-400' : ''}`}>
            <div className="text-2xl font-bold text-orange-400 w-8 text-center">
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-orange-200">{r.name}</div>
              <div className="text-xs text-orange-200/50">Room {r.room}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-orange-300">{r.streak}🔥</div>
              <div className="text-xs text-orange-200/50">{r.total} total</div>
            </div>
          </div>
        ))}
        {rows.length === 0 && <div className="card p-6 text-center text-orange-200/60">No data yet</div>}
      </div>
      <nav className="fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur border-t border-orange-400/20 flex justify-around py-2">
        <button onClick={() => nav('/')} className="flex flex-col items-center text-orange-200/70 text-xs"><Flame size={18} /> Home</button>
        <button onClick={() => nav('/people')} className="flex flex-col items-center text-orange-200/70 text-xs"><Users size={18} /> People</button>
        <button onClick={() => nav('/badges')} className="flex flex-col items-center text-orange-200/70 text-xs"><Trophy size={18} /> Badges</button>
        <button onClick={() => nav('/leaderboard')} className="flex flex-col items-center text-orange-300 text-xs"><Users size={18} /> Board</button>
      </nav>
    </div>
  )
}