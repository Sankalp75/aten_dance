import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchStudentsFromCloud, fetchAllAttendanceCloud } from '../lib/sync'
import { getCachedStudents, getAllAttendanceLocal } from '../lib/offline'
import { istDateKey } from '../lib/time'
import { computeStreak, computeBadges } from '../lib/stats'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, Flame, Trophy, UserCheck, Award } from 'lucide-react'

interface PersonRow {
  id: string
  name: string
  room: string
  status: string
  streak: number
  total: number
  badges: string[]
}

export default function People() {
  const { student } = useAuth()
  const nav = useNavigate()
  const [rows, setRows] = useState<PersonRow[]>([])

  useEffect(() => {
    (async () => {
      let s = await fetchStudentsFromCloud()
      if (!s.length) s = await getCachedStudents()
      const cloudAtt = await fetchAllAttendanceCloud()
      const localAtt = await getAllAttendanceLocal()
      const key = istDateKey()

      // merge attendance (cloud + local) per student
      const byStudent: Record<string, { date_key: string; status: string }[]> = {}
      for (const a of cloudAtt) {
        (byStudent[a.student_id] ||= []).push({ date_key: a.date_key, status: a.status })
      }
      for (const r of localAtt) {
        const arr = byStudent[r.studentId] ||= []
        if (!arr.find((x) => x.date_key === r.dateKey)) {
          arr.push({ date_key: r.dateKey, status: r.status })
        }
      }

      const todayMap: Record<string, string> = {}
      for (const a of cloudAtt) {
        if (a.date_key === key) todayMap[a.student_id] = a.status
      }
      for (const r of localAtt) {
        if (r.dateKey === key && !todayMap[r.studentId]) todayMap[r.studentId] = r.status
      }

      const rows: PersonRow[] = s.map((st: any) => {
        const recs = byStudent[st.id] || []
        const streak = computeStreak(recs)
        const total = recs.filter((r) => r.status === 'present').length
        const badges = computeBadges(streak, total)
        return {
          id: st.id,
          name: st.name,
          room: st.room,
          status: todayMap[st.id] || '',
          streak,
          total,
          badges,
        }
      })
      // sort: present first, then by streak desc
      rows.sort((a, b) => {
        const rank = (x: string) => (x === 'present' ? 0 : x === 'absent' ? 2 : 1)
        if (rank(a.status) !== rank(b.status)) return rank(a.status) - rank(b.status)
        return b.streak - a.streak
      })
      setRows(rows)
    })()
  }, [])

  const presentCount = rows.filter((r) => r.status === 'present').length

  return (
    <div className="min-h-full bg-chill p-4 pb-24">
      <header className="flex items-center gap-3 mb-4">
        <button onClick={() => nav('/')} className="p-2 rounded-full bg-white/5 text-orange-200"><ArrowLeft size={18} /></button>
        <h1 className="text-xl font-bold text-orange-300 flex-1">People</h1>
        <div className="text-sm text-orange-200/70">{presentCount}/{rows.length} present</div>
      </header>

      <div className="space-y-2">
        {rows.map((r) => {
          const isMe = r.id === student?.id
          return (
            <div key={r.id} className={`card p-3 ${isMe ? 'ring-2 ring-orange-400' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-300 font-bold">
                  {r.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-orange-200 truncate">
                    {r.name} {isMe && <span className="text-xs text-orange-400">(you)</span>}
                  </div>
                  <div className="text-xs text-orange-200/50">Room {r.room}</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                  r.status === 'present' ? 'bg-green-500/20 text-green-400' :
                  r.status === 'absent' ? 'bg-red-500/20 text-red-400' :
                  'bg-white/10 text-orange-200/60'
                }`}>
                  {r.status === 'present' ? 'Present' : r.status === 'absent' ? 'Absent' : 'Pending'}
                </span>
              </div>

              {/* achievement status */}
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-orange-300">
                  <Flame size={12} /> {r.streak}
                </span>
                <span className="flex items-center gap-1 text-xs text-yellow-400">
                  <Trophy size={12} /> {r.total}
                </span>
                {r.badges.length > 0 ? (
                  r.badges.map((b) => (
                    <span key={b} className="px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-300 text-[10px] font-semibold flex items-center gap-1">
                      <Award size={10} /> {b}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-orange-200/40">No badges yet</span>
                )}
              </div>
            </div>
          )
        })}
        {rows.length === 0 && <div className="card p-6 text-center text-orange-200/60">No students yet</div>}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur border-t border-orange-400/20 flex justify-around py-2">
        <button onClick={() => nav('/')} className="flex flex-col items-center text-orange-200/70 text-xs"><Flame size={18} /> Home</button>
        <button onClick={() => nav('/people')} className="flex flex-col items-center text-orange-300 text-xs"><Users size={18} /> People</button>
        <button onClick={() => nav('/badges')} className="flex flex-col items-center text-orange-200/70 text-xs"><Trophy size={18} /> Badges</button>
        <button onClick={() => nav('/leaderboard')} className="flex flex-col items-center text-orange-200/70 text-xs"><UserCheck size={18} /> Board</button>
      </nav>
    </div>
  )
}