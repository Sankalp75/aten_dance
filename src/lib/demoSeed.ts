import { getCachedStudents, cacheStudents } from './offline'

const DEMO_STUDENTS = [
  { id: 'H001', name: 'Aarav Sharma', room: '101', pin: '1234' },
  { id: 'H002', name: 'Priya Patel', room: '102', pin: '1234' },
  { id: 'H003', name: 'Rohan Verma', room: '203', pin: '1234' },
  { id: 'H004', name: 'Sneha Iyer', room: '204', pin: '1234' },
  { id: 'H005', name: 'Karan Singh', room: '305', pin: '1234' },
]

export async function seedDemoIfNeeded() {
  const existing = await getCachedStudents()
  if (existing && existing.length > 0) return
  await cacheStudents(DEMO_STUDENTS)
}