import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Mascot from '../components/Mascot'
import PinPad from '../components/PinPad'
import { toast } from 'sonner'

export default function Login() {
  const { loginStudent, loginAdmin } = useAuth()
  const nav = useNavigate()
  const [mode, setMode] = useState<'student' | 'admin'>('student')
  const [sid, setSid] = useState('')
  // adminPin not needed; PinPad handles input
  const [err, setErr] = useState(false)
  const [loading, setLoading] = useState(false)

  const onStudentPin = async (pin: string) => {
    if (!sid.trim()) { toast.error('Enter your Student ID first'); return }
    setLoading(true)
    const r = await loginStudent(sid, pin)
    setLoading(false)
    if (r.ok) { toast.success('Welcome back!'); nav('/') }
    else { setErr(true); setTimeout(() => setErr(false), 400); toast.error(r.error || 'Login failed') }
  }

  const onAdminPin = async (pin: string) => {
    setLoading(true)
    const r = await loginAdmin(pin)
    setLoading(false)
    if (r.ok) { toast.success('Admin logged in'); nav('/admin') }
    else { setErr(true); setTimeout(() => setErr(false), 400); toast.error(r.error || 'Login failed') }
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6 bg-chill">
      <Mascot mood="cool" size={110} />
      <h1 className="text-3xl font-bold mt-2 text-orange-300">ChillBro</h1>
      <p className="text-orange-200/70 text-sm mb-6">Hostel attendance, the chill way</p>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setMode('student')} className={`px-4 py-2 rounded-full text-sm font-semibold ${mode === 'student' ? 'bg-orange-500 text-black' : 'bg-white/10 text-orange-200'}`}>Student</button>
        <button onClick={() => setMode('admin')} className={`px-4 py-2 rounded-full text-sm font-semibold ${mode === 'admin' ? 'bg-orange-500 text-black' : 'bg-white/10 text-orange-200'}`}>Warden</button>
      </div>

      <div className="card p-6 w-full max-w-sm">
        {mode === 'student' ? (
          <>
            <label className="text-sm text-orange-200">Student ID</label>
            <input
              value={sid}
              onChange={(e) => setSid(e.target.value)}
              placeholder="e.g. H2024-001"
              className="w-full mt-1 mb-4 px-4 py-3 rounded-xl bg-white/5 border border-orange-400/30 text-orange-100 placeholder-orange-200/40 focus:outline-none focus:border-orange-400"
            />
            <p className="text-xs text-orange-200/60 mb-3 text-center">Enter your 4-digit PIN</p>
            <PinPad onSubmit={onStudentPin} disabled={loading} error={err} />
          </>
        ) : (
          <>
            <p className="text-xs text-orange-200/60 mb-3 text-center">Enter warden PIN</p>
            <PinPad onSubmit={onAdminPin} disabled={loading} error={err} />
          </>
        )}
      </div>
      <p className="text-xs text-orange-200/40 mt-6">Offline-friendly · works even with spotty wifi</p>
    </div>
  )
}