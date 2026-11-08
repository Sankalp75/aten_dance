interface Props {
  mood?: 'happy' | 'sleepy' | 'excited' | 'sad' | 'cool'
  size?: number
  className?: string
}

const eyes: Record<string, string> = {
  happy: '◡ ◡',
  sleepy: '— —',
  excited: '★ ★',
  sad: '╥ ╥',
  cool: '■ ■',
}

export default function Mascot({ mood = 'happy', size = 96, className = '' }: Props) {
  return (
    <div className={`mascot-bob inline-flex flex-col items-center ${className}`} style={{ width: size }}>
      <svg viewBox="0 0 120 120" width={size} height={size}>
        <defs>
          <radialGradient id="body" cx="50%" cy="40%">
            <stop offset="0%" stopColor="#fdba74" />
            <stop offset="100%" stopColor="#f97316" />
          </radialGradient>
        </defs>
        {/* body */}
        <circle cx="60" cy="62" r="46" fill="url(#body)" stroke="#9a3412" strokeWidth="2" />
        {/* blush */}
        <ellipse cx="38" cy="72" rx="7" ry="4" fill="#fca5a5" opacity="0.6" />
        <ellipse cx="82" cy="72" rx="7" ry="4" fill="#fca5a5" opacity="0.6" />
        {/* eyes */}
        <text x="60" y="62" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#1a1208">{eyes[mood]}</text>
        {/* smile */}
        <path d="M 46 74 Q 60 86 74 74" stroke="#1a1208" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* sunglasses for cool */}
        {mood === 'cool' && (
          <g>
            <rect x="34" y="50" width="22" height="14" rx="4" fill="#1a1208" />
            <rect x="64" y="50" width="22" height="14" rx="4" fill="#1a1208" />
            <line x1="56" y1="57" x2="64" y2="57" stroke="#1a1208" strokeWidth="3" />
          </g>
        )}
      </svg>
      <div className="text-xs font-bold text-orange-300 mt-1">ChillBro</div>
    </div>
  )
}