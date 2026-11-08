import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchStudentsFromCloud, fetchAllAttendanceCloud } from '../lib/sync'
import { getCachedStudents } from '../lib/offline'
import { ArrowLeft, Download } from 'lucide-react'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function AdminReports() {
  const nav = useNavigate()
  const [students, setStudents] = useState<any[]>([])
  const [att, setAtt] = useState<any[]>([])
  const [dateFilter, setDateFilter] = useState('')

  useEffect(() => {
    (async () => {
      const s = await fetchStudentsFromCloud()
      setStudents(s.length ? s : await getCachedStudents())
      setAtt(await fetchAllAttendanceCloud())
    })()
  }, [])

  const filtered = dateFilter ? att.filter((a) => a.date_key === dateFilter) : att

  const exportCSV = () => {
    const rows = [['Student ID', 'Name', 'Room', 'Date', 'Status', 'Marked At']]
    for (const a of filtered) {
      const s = students.find((x) => x.id === a.student_id)
      rows.push([a.student_id, s?.name || '', s?.room || '', a.date_key, a.status, a.marked_at])
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chillbro-attendance-${dateFilter || 'all'}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported')
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.text('ChillBro Attendance Report', 14, 16)
    doc.setFontSize(10)
    doc.text(`Filter: ${dateFilter || 'All dates'}`, 14, 24)
    const body = filtered.map((a) => {
      const s = students.find((x) => x.id === a.student_id)
      return [a.student_id, s?.name || '', s?.room || '', a.date_key, a.status]
    })
    autoTable(doc, { head: [['ID', 'Name', 'Room', 'Date', 'Status']], body, startY: 30 })
    doc.save(`chillbro-attendance-${dateFilter || 'all'}.pdf`)
    toast.success('PDF exported')
  }

  // per-student summary
  const summary = students.map((s) => {
    const recs = att.filter((a) => a.student_id === s.id)
    const present = recs.filter((a) => a.status === 'present').length
    const pct = recs.length ? Math.round((present / recs.length) * 100) : 0
    return { ...s, present, total: recs.length, pct }
  })

  return (
    <div className="min-h-full bg-chill p-4 pb-24">
      <header className="flex items-center gap-3 mb-4">
        <button onClick={() => nav('/admin')} className="p-2 rounded-full bg-white/5 text-orange-200"><ArrowLeft size={18} /></button>
        <h1 className="text-xl font-bold text-orange-300 flex-1">Reports</h1>
      </header>

      <div className="card p-4 mb-4 flex gap-2 items-center">
        <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-orange-400/30 text-orange-100" />
        <button onClick={() => setDateFilter('')} className="px-3 py-2 rounded-lg bg-white/5 text-orange-200 text-sm">All</button>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={exportCSV} className="btn-primary flex-1 py-2 flex items-center justify-center gap-2"><Download size={16} /> CSV</button>
        <button onClick={exportPDF} className="btn-primary flex-1 py-2 flex items-center justify-center gap-2"><Download size={16} /> PDF</button>
      </div>

      <div className="card p-4 mb-4">
        <div className="font-semibold text-orange-300 mb-2">Per-Student Summary</div>
        <div className="max-h-72 overflow-y-auto space-y-1">
          {summary.map((s) => (
            <div key={s.id} className="flex items-center justify-between text-sm">
              <span className="text-orange-200">{s.name}</span>
              <span className="text-orange-200/60">{s.present}/{s.total} · {s.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <div className="font-semibold text-orange-300 mb-2">Records ({filtered.length})</div>
        <div className="max-h-72 overflow-y-auto space-y-1">
          {filtered.slice(0, 200).map((a, i) => {
            const s = students.find((x) => x.id === a.student_id)
            return (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-orange-200">{s?.name || a.student_id}</span>
                <span className="text-orange-200/50">{a.date_key} · {a.status}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}