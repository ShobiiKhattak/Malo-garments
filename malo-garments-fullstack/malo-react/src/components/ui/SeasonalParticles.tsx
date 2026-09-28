import { useMemo } from 'react'
import { getCurrentSeason } from '../../utils/season'

const THEME = {
  winter: { glyphs: ['❄', '❅', '❆'], colors: ['#ffffff', '#dceaf7', '#bfe3ff'], glow: '255,255,255' },
  summer: { glyphs: ['✦', '✧', '☀'], colors: ['#ffd76a', '#ffb703', '#fff3c4'], glow: '255,183,3' },
}

interface Particle {
  id: number
  glyph: string
  color: string
  left: number
  size: number
  duration: number
  delay: number
  drift: number
}

export default function SeasonalParticles({ count = 24 }: { count?: number }) {
  const season = getCurrentSeason()
  const theme = THEME[season]

  const particles = useMemo<Particle[]>(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    glyph: theme.glyphs[i % theme.glyphs.length],
    color: theme.colors[i % theme.colors.length],
    left: Math.random() * 100,
    size: 10 + Math.random() * 16,
    duration: 9 + Math.random() * 12,
    delay: Math.random() * -20,
    drift: Math.random() * 70 - 35,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  })), [season, count])

  return (
    <div className="seasonal-particles" aria-hidden="true">
      <style>{`
        .seasonal-particles { position:absolute; inset:0; overflow:hidden; pointer-events:none; z-index:0; }
        .seasonal-particle { position:absolute; top:-8%; line-height:1; will-change:transform,opacity; animation-name:particleFall; animation-timing-function:linear; animation-iteration-count:infinite; }
        @keyframes particleFall {
          0%   { transform:translate(0,0) rotate(0deg); opacity:0; }
          8%   { opacity:0.9; }
          92%  { opacity:0.8; }
          100% { transform:translate(var(--drift), 118vh) rotate(360deg); opacity:0; }
        }
        @media (prefers-reduced-motion: reduce) { .seasonal-particle { animation:none; display:none; } }
      `}</style>
      {particles.map(p => (
        <span
          key={p.id}
          className="seasonal-particle"
          style={{
            left: `${p.left}%`,
            fontSize: p.size,
            color: p.color,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            textShadow: `0 0 8px rgba(${theme.glow},0.7)`,
            ['--drift' as string]: `${p.drift}px`,
          } as React.CSSProperties}
        >
          {p.glyph}
        </span>
      ))}
    </div>
  )
}
