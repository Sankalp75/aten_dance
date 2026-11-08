import { useEffect, useState, useRef } from 'react'

import { fetchStudentsFromCloud } from '../lib/sync'
import { getCachedStudents, cacheStudents } from '../lib/offline'
import { supabase } from '../lib/supabase'
import Papa from 'papaparse'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, Plus, KeyRound, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminStudents() {
  const nav = useNavigate()
  const [students, setStudents] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ id: '', name: '', room: '', pin: '' })
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    const s = await fetchStudentsFromCloud()
    setStudents(s.length ? s : await getCachedStudents())
  }
  useEffect(() => { load() }, [])

  const addOne = async () => {
    if (!form.id || !form.name) { toast.error('ID and name required'); return }
    const rec = { id: form.id.trim(), name: form.name.trim(), room: form.room.trim(), pin: form.pin || '0000' }
    if (supabase) {
      const { error } = await supabase.from('students').upsert(rec)
      if (error) { toast.error(error.message); return }
    }
    await cacheStudents([rec])
    toast.success('Student added')
    setForm({ id: '', name: '', room: '', pin: '' })
    setShowAdd(false)
    load()
  }

  const importCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (res) => {
        const rows = res.data as any[]
        const recs = rows.map((r) => ({
          id: String(r.id || r.ID || r.student_id || '').trim(),
          name: String(r.name || r.Name || '').trim(),
          room: String(r.room || r.Room || '').trim(),
          pin: String(r.pin || r.PIN || '0000').trim() || '0000',
        })).filter((r) => r.id && r.name)
        if (!recs.length) { toast.error('No valid rows'); return }
        if (supabase) {
          const { error } = await supabase.from('students').upsert(recs)
          if (error) { toast.error(error.message); return }
        }
        await cacheStudents(recs)
        toast.success(`Imported ${recs.length} students`)
        load()
      },
    })
  }

  const resetPin = async (s: any) => {
    const newPin = prompt(`New PIN for ${s.name}:`, '0000')
    if (!newPin) return
    if (supabase) {
      const { error } = await supabase.from('students').update({ pin: newPin }).eq('id', s.id)
      if (error) { toast.error(error.message); return }
    }
    await cacheStudents([{ ...s, pin: newPin }])
    toast.success('PIN reset')
    load()
  }

  const remove = async (s: any) => {
    if (!confirm(`Delete ${s.name}?`)) return
    if (supabase) {
      const { error } = await supabase.from('students').delete().eq('id', s.id)
      if (error) { toast.error(error.message); return }
    }
    toast.success('Deleted')
    load()
  }

  return (
    <div className="min-h-full bg-chill p-4 pb-24">
      <header className="flex items-center gap-3 mb-4">
        <button onClick={() => nav('/admin')} className="p-2 rounded-full bg-white/5 text-orange-200"><ArrowLeft size={18} /></button>
        <h1 className="text-xl font-bold text-orange-300 flex-1">Students</h1>
        <button onClick={() => setShowAdd((v) => !v)} className="p-2 rounded-full bg-orange-500 text-black"><Plus size={18} /></button>
      </header>

      {showAdd && (
        <div className="card p-4 mb-4 space-y-2">
          <input placeholder="Student ID" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-orange-400/30 text-orange-100" />
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-orange-400/30 text-orange-100" />
          <input placeholder="Room" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-orange-400/30 text-orange-100" />
          <input placeholder="PIN (default 0000)" value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-orange-400/30 text-orange-100" />
          <button onClick={addOne} className="btn-primary w-full py-2">Add Student</button>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <button onClick={() => fileRef.current?.click()} className="btn-primary flex-1 py-2 flex items-center justify-center gap-2">
          <Upload size={16} /> Import CSV
        </button>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && importCSV(e.target.files[0])} />
      </div>
      <p className="text-xs text-orange-200/50 mb-3">CSV columns: id, name, room, pin</p>

      <div className="space-y-2">
        {students.map((s) => (
          <div key={s.id} className="card p-3 flex items-center gap-2">
            <div className="flex-1">
              <div className="font-semibold text-orange-200">{s.name}</div>
              <div className="text-xs text-orange-200/50">{s.id} · Room {s.room}</div>
            </div>
            <button onClick={() => resetPin(s)} className="p-2 rounded-lg bg-white/5 text-orange-300" title="Reset PIN"><KeyRound size={16} /></button>
            <button onClick={() => remove(s)} className="p-2 rounded-lg bg-white/5 text-red-400" title="Delete"><Trash2 size={16} /></button>
          </div>
        ))}
        {students.length === 0 && <div className="card p-6 text-center text-orange-200/60">No students yet. Import CSV or add manually.</div>}
      </div>
    </div>
  )
}