import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getAllAttendanceLocal } from '../lib/offline'
import { fetchAttendanceFromCloud } from '../lib/sync'
import { computeStreak, computeBadges } from '../lib/stats'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Flame, Trophy, History as HIcon, Users, Lock } from 'lucide-react'

const ALL_BADGES = [
  { name: 'First Check-in', desc: 'Mark your first attendance', need: 1, type: 'total' },
  { name: '3-Day Streak', desc: '3 days in a row', need: 3, type: 'streak' },
  { name: 'Week Warrior', desc: '7-day streak', need: 7, type: 'streak' },
  { name: 'Fortnight Hero', desc: '14-day streak', need: 14, type: 'streak' },
  { name: 'Monthly Master', desc: '30-day streak', need: 30, type: 'streak' },
  { name: 'Fifty Club', desc: '50 total present', need: 50, type: 'total' },
  { name: 'Century Club', desc: '100 total present', need: 100, type: 'total' },
]

export default function Badges() {
  const { student } = useAuth()
  const nav = useNavigate()
  const [streak, setStreak] = useState(0)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    (async () => {
      if (!student) return
      const cloud = await fetchAttendanceFromCloud(student.id)
      const local = await getAllAttendanceLocal()
      const mine = local.filter((r) => r.studentId === student.id)
      const merged = [...mine]
      for (const c of cloud) if (!merged.find((m) => m.dateKey === c.date_key)) merged.push({ dateKey: c.date_key, status: c.status } as any)
      setStreak(computeStreak(merged.map((r: any) => ({ date_key: r.dateKey, status: r.status }))))
      setTotal(merged.filter((r: any) => r.status === 'present').length)
    })()
  }, [student])

  const earned = computeBadges(streak, total)

  return (
    <div className="min-h-full bg-chill p-4 pb-24">
      <header className="flex items-center gap-3 mb-4">
        <button onClick={() => nav('/')} className="p-2 rounded-full bg-white/5 text-orange-200"><ArrowLeft size={18} /></button>
        <h1 className="text-xl font-bold text-orange-300">Badges</h1>
      </header>
      <div className="grid grid-cols-2 gap-3">
        {ALL_BADGES.map((b) => {
          const have = earned.includes(b.name)
          const progress = b.type === 'streak' ? Math.min(100, Math.round((streak / b.need) * 100)) : Math.min(100, Math.round((total / b.need) * 100))
          const val = b.type === 'streak' ? streak : total
          return (
            <div key={b.name} className={`card p-4 text-center ${have ? '' : 'opacity-60'}`}>
              <div className="text-3xl mb-1">{have ? '🏆' : <Lock className="mx-auto" size={24} />}</div>
              <div className="font-bold text-orange-300 text-sm">{b.name}</div>
              <div className="text-xs text-orange-200/60">{b.desc}</div>
              {!have && (
                <div className="mt-2">
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="text-[10px] text-orange-200/50 mt-1">{val}/{b.need}</div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <nav className="fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur border-t border-orange-400/20 flex justify-around py-2">
        <button onClick={() => nav('/')} className="flex flex-col items-center text-orange-200/70 text-xs"><Flame size={18} /> Home</button>
        <button onClick={() => nav('/history')} className="flex flex-col items-center text-orange-200/70 text-xs"><HIcon size={18} /> History</button>
        <button onClick={() => nav('/badges')} className="flex flex-col items-center text-orange-300 text-xs"><Trophy size={18} /> Badges</button>
        <button onClick={() => nav('/leaderboard')} className="flex flex-col items-center text-orange-200/70 text-xs"><Users size={18} /> Board</button>
      </nav>
    </div>
  )
}