import { useEffect, useState } from 'react'
import { windowState, msUntilOpen, msUntilClose, formatCountdown } from '../lib/time'

export default function Countdown() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))), 1000)
    return () => clearInterval(t)
  }, [])

  const st = windowState(now)
  if (st === 'open') {
    return (
      <div className="card p-4 text-center">
        <div className="text-sm text-orange-200">Window open! Closes in</div>
        <div className="text-3xl font-bold text-orange-400 tabular-nums">{formatCountdown(msUntilClose(now))}</div>
      </div>
    )
  }
  if (st === 'before') {
    return (
      <div className="card p-4 text-center">
        <div className="text-sm text-orange-200">Opens at 10:30 PM. Countdown</div>
        <div className="text-3xl font-bold text-orange-400 tabular-nums">{formatCountdown(msUntilOpen(now))}</div>
      </div>
    )
  }
  return (
    <div className="card p-4 text-center">
      <div className="text-sm text-orange-200">Window closed for today</div>
      <div className="text-lg font-bold text-orange-400">Come back tomorrow 10:30 PM</div>
    </div>
  )
}