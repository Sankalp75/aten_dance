import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { supabase, DEMO } from '../lib/supabase'
import { getCachedStudent, cacheStudents } from '../lib/offline'

export interface Student {
  id: string
  name: string
  room: string
  pin: string
  streak?: number
  totalPresent?: number
}

interface AuthState {
  student: Student | null
  isAdmin: boolean
  loading: boolean
  loginStudent: (id: string, pin: string) => Promise<{ ok: boolean; error?: string }>
  loginAdmin: (pin: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
  refreshStudent: () => Promise<void>
}

const Ctx = createContext<AuthState | null>(null)

const ADMIN_PIN = (import.meta.env.VITE_ADMIN_PIN as string) || ''
const SESSION_KEY = 'chillbro_session'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const raw = localStorage.getItem(SESSION_KEY)
        if (raw) {
          const s = JSON.parse(raw)
          if (s?.type === 'student') setStudent(s.data)
          else if (s?.type === 'admin') setIsAdmin(true)
        }
      } catch {}
      setLoading(false)
    })()
  }, [])

  const persist = (data: any) => localStorage.setItem(SESSION_KEY, JSON.stringify(data))

  const loginStudent = useCallback(async (id: string, pin: string) => {
    const sid = id.trim()
    // try cache first
    let st = await getCachedStudent(sid)
    if (!st && supabase) {
      const { data, error } = await supabase.from('students').select('*').eq('id', sid).single()
      if (error || !data) {
        // maybe by name? no
      } else {
        st = data
        await cacheStudents([data])
      }
    }
    if (!st && DEMO) {
      // demo: accept any id with pin 0000? Instead seed demo students elsewhere.
    }
    if (!st) return { ok: false, error: 'Student not found' }
    if (String(st.pin) !== String(pin)) return { ok: false, error: 'Wrong PIN' }
    const s: Student = { id: st.id, name: st.name, room: st.room, pin: st.pin }
    setStudent(s)
    persist({ type: 'student', data: s })
    return { ok: true }
  }, [])

  const loginAdmin = useCallback(async (pin: string) => {
    if (supabase) {
      try {
        const { data } = await supabase.from('admins').select('*').eq('pin', pin).limit(1)
        if (data && data.length > 0) {
          setIsAdmin(true)
          persist({ type: 'admin' })
          return { ok: true }
        }
      } catch (e) {
        console.warn('admin lookup failed', e)
      }
    }
    if (ADMIN_PIN && pin === ADMIN_PIN) {
      setIsAdmin(true)
      persist({ type: 'admin' })
      return { ok: true }
    }
    return { ok: false, error: 'Wrong admin PIN' }
  }, [])

  const logout = useCallback(() => {
    setStudent(null)
    setIsAdmin(false)
    localStorage.removeItem(SESSION_KEY)
  }, [])

  const refreshStudent = useCallback(async () => {
    if (!student) return
    const st = await getCachedStudent(student.id)
    if (st) setStudent({ id: st.id, name: st.name, room: st.room, pin: st.pin })
  }, [student])

  return (
    <Ctx.Provider value={{ student, isAdmin, loading, loginStudent, loginAdmin, logout, refreshStudent }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth outside provider')
  return c
}