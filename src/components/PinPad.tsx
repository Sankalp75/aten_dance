import { useState } from 'react'

interface Props {
  length?: number
  onSubmit: (pin: string) => void
  disabled?: boolean
  error?: boolean
}

export default function PinPad({ length = 4, onSubmit, disabled, error }: Props) {
  const [val, setVal] = useState('')

  const press = (d: string) => {
    if (disabled) return
    if (val.length >= length) return
    const next = val + d
    setVal(next)
    if (next.length === length) {
      onSubmit(next)
      setTimeout(() => setVal(''), 300)
    }
  }
  const back = () => setVal((v) => v.slice(0, -1))

  return (
    <div className={error ? 'shake' : ''}>
      <div className="flex justify-center gap-3 mb-4">
        {Array.from({ length }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 ${i < val.length ? 'bg-orange-400 border-orange-400' : 'border-orange-300/40'}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
        {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
          <button
            key={i}
            type="button"
            disabled={disabled || k === ''}
            onClick={() => (k === '⌫' ? back() : k && press(k))}
            className={`pin-key h-16 ${k === '' ? 'invisible' : ''}`}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  )
}