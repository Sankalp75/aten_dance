import { openDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'chillbro'
const DB_VER = 1

interface PendingItem {
  id: string
  type: 'attendance'
  payload: any
  createdAt: number
  synced: boolean
}

let dbPromise: Promise<IDBPDatabase> | null = null
function db() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VER, {
      upgrade(d) {
        if (!d.objectStoreNames.contains('attendance')) {
          const s = d.createObjectStore('attendance', { keyPath: 'key' })
          s.createIndex('byStudent', 'studentId')
          s.createIndex('byDate', 'dateKey')
        }
        if (!d.objectStoreNames.contains('pending')) {
          d.createObjectStore('pending', { keyPath: 'id' })
        }
        if (!d.objectStoreNames.contains('students')) {
          d.createObjectStore('students', { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

export interface LocalAttendance {
  key: string // studentId_dateKey
  studentId: string
  dateKey: string
  status: 'present' | 'absent' | 'late'
  markedAt: number
  synced: boolean
  source: 'online' | 'offline'
}

export async function saveAttendanceLocal(rec: LocalAttendance) {
  const d = await db()
  await d.put('attendance', rec)
  if (!rec.synced) {
    const item: PendingItem = {
      id: rec.key,
      type: 'attendance',
      payload: rec,
      createdAt: rec.markedAt,
      synced: false,
    }
    await d.put('pending', item)
  }
}

export async function getAttendanceLocal(studentId: string, dateKey: string) {
  const d = await db()
  return d.get('attendance', `${studentId}_${dateKey}`)
}

export async function getAllAttendanceLocal() {
  const d = await db()
  return d.getAll('attendance')
}

export async function getPending() {
  const d = await db()
  const all = await d.getAll('pending')
  return all.filter((p) => !p.synced)
}

export async function markPendingSynced(id: string) {
  const d = await db()
  const p = await d.get('pending', id)
  if (p) {
    p.synced = true
    await d.put('pending', p)
  }
  // update attendance record
  const att = await d.get('attendance', id)
  if (att) {
    att.synced = true
    await d.put('attendance', att)
  }
}

export async function cacheStudents(list: any[]) {
  const d = await db()
  const tx = d.transaction('students', 'readwrite')
  await Promise.all(list.map((s) => tx.store.put(s)))
  await tx.done
}

export async function getCachedStudents() {
  const d = await db()
  return d.getAll('students')
}

export async function getCachedStudent(id: string) {
  const d = await db()
  return d.get('students', id)
}