import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Home from './pages/Home'
import History from './pages/History'
import Badges from './pages/Badges'
import Leaderboard from './pages/Leaderboard'
import AdminDashboard from './pages/AdminDashboard'
import AdminStudents from './pages/AdminStudents'
import AdminReports from './pages/AdminReports'

function StudentGuard({ children }: { children: React.ReactNode }) {
  const { student, loading } = useAuth()
  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (!student) return <Navigate to="/login" replace />
  return <>{children}</>
}
function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuth()
  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (!isAdmin) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<StudentGuard><Home /></StudentGuard>} />
      <Route path="/history" element={<StudentGuard><History /></StudentGuard>} />
      <Route path="/badges" element={<StudentGuard><Badges /></StudentGuard>} />
      <Route path="/leaderboard" element={<StudentGuard><Leaderboard /></StudentGuard>} />
      <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
      <Route path="/admin/students" element={<AdminGuard><AdminStudents /></AdminGuard>} />
      <Route path="/admin/reports" element={<AdminGuard><AdminReports /></AdminGuard>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}