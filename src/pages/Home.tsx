import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { istDateKey, windowState } from '../lib/time'
import { saveAttendanceLocal, getAttendanceLocal, getAllAttendanceLocal } from '../lib/offline'
import { syncPending, fetchAttendanceFromCloud } from '../lib/sync'
import { computeStreak, computeBadges } from '../lib/stats'
import Mascot from '../components/Mascot'
import Countdown from '../components/Countdown'
import confetti from 'canvas-confetti'
import { toast } from 'sonner'
import { Flame, Trophy, History as HistoryIcon, Users, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const { student, logout } = useAuth()
  const nav = useNavigate()
  const [todayRec, setTodayRec] = useState<any>(null)
  const [streak, setStreak] = useState(0)
  const [total, setTotal] = useState(0)
  const [marking, setMarking] = useState(false)

  const load = async () => {
    if (!student) return
    const key = istDateKey()
    const local = await getAttendanceLocal(student.id, key)
    setTodayRec(local || null)
    // cloud
    await syncPending()
    const cloud = await fetchAttendanceFromCloud(student.id)
    // merge into local counts via all local
    const all = await getAllAttendanceLocal()
    const mine = all.filter((r) => r.studentId === student.id)
    // also include cloud records not in local
    const merged = [...mine]
    for (const c of cloud) {
      if (!merged.find((m) => m.dateKey === c.date_key)) {
        merged.push({ key: `${student.id}_${c.date_key}`, studentId: student.id, dateKey: c.date_key, status: c.status, markedAt: new Date(c.marked_at).getTime(), synced: true, source: c.source })
      }
    }
    setStreak(computeStreak(merged.map((r) => ({ date_key: r.dateKey, status: r.status }))))
    setTotal(merged.filter((r) => r.status === 'present').length)
    const t = await getAttendanceLocal(student.id, key)
    setTodayRec(t || null)
  }

  useEffect(() => { load() }, [student])

  const mark = async () => {
    if (!student) return
    const st = windowState()
    if (st !== 'open') {
      toast.error(st === 'before' ? 'Window opens at 10:30 PM' : 'Window closed for today')
      return
    }
    const key = istDateKey()
    if (todayRec) { toast.info('Already marked today!'); return }
    setMarking(true)
    const rec = {
      key: `${student.id}_${key}`,
      studentId: student.id,
      dateKey: key,
      status: 'present' as const,
      markedAt: Date.now(),
      synced: false,
      source: 'offline' as const,
    }
    await saveAttendanceLocal(rec)
    // try sync
    if (navigator.onLine) {
      await syncPending()
    }
    setTodayRec({ ...rec, synced: true })
    setMarking(false)
    // confetti
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 }, colors: ['#fb923c', '#fdba74', '#f97316', '#fef3e2'] })
    toast.success('You showed up! ChillBro is proud 🧡')
    load()
  }

  const badges = computeBadges(streak, total)
  const mood = todayRec ? 'excited' : (windowState() === 'open' ? 'happy' : 'sleepy')

  return (
    <div className="min-h-full bg-chill p-4 pb-24">
      <header className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm text-orange-200/70">Hey,</div>
          <div className="text-xl font-bold text-orange-300">{student?.name}</div>
          <div className="text-xs text-orange-200/50">Room {student?.room}</div>
        </div>
        <button onClick={() => { logout(); nav('/login') }} className="p-2 rounded-full bg-white/5 text-orange-200">
          <LogOut size={18} />
        </button>
      </header>

      <div className="flex justify-center my-2">
        <Mascot mood={mood} size={120} />
      </div>

      <Countdown />

      <div className="card p-5 mt-4 text-center">
        {todayRec ? (
          <>
            <div className="text-green-400 font-bold text-lg">✅ Marked present tonight</div>
            <div className="text-xs text-orange-200/60 mt-1">
              {new Date(todayRec.markedAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}
            </div>
          </>
        ) : (
          <button
            onClick={mark}
            disabled={marking}
            className="btn-primary w-full py-4 text-lg"
          >
            {marking ? 'Marking...' : 'Mark Attendance'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="card p-4 text-center">
          <Flame className="mx-auto text-orange-400" />
          <div className="text-2xl font-bold text-orange-300">{streak}</div>
          <div className="text-xs text-orange-200/60">day streak</div>
        </div>
        <div className="card p-4 text-center">
          <Trophy className="mx-auto text-yellow-400" />
          <div className="text-2xl font-bold text-orange-300">{total}</div>
          <div className="text-xs text-orange-200/60">total present</div>
        </div>
      </div>

      <div className="card p-4 mt-4">
        <div className="text-sm font-semibold text-orange-300 mb-2">Badges</div>
        <div className="flex flex-wrap gap-2">
          {badges.length === 0 && <span className="text-xs text-orange-200/50">Mark attendance to earn badges</span>}
          {badges.map((b) => (
            <span key={b} className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-semibold">{b}</span>
          ))}
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur border-t border-orange-400/20 flex justify-around py-2">
        <button onClick={() => nav('/')} className="flex flex-col items-center text-orange-300 text-xs"><Flame size={18} /> Home</button>
        <button onClick={() => nav('/history')} className="flex flex-col items-center text-orange-200/70 text-xs"><HistoryIcon size={18} /> History</button>
        <button onClick={() => nav('/badges')} className="flex flex-col items-center text-orange-200/70 text-xs"><Trophy size={18} /> Badges</button>
        <button onClick={() => nav('/leaderboard')} className="flex flex-col items-center text-orange-200/70 text-xs"><Users size={18} /> Board</button>
      </nav>
    </div>
  )
}