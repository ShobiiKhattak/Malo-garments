import { useEffect, useState } from 'react'

// Placeholder palettes shown while an image loads / when no image is set yet.
export const TONES = [
  { bg: 'linear-gradient(160deg,#f8dde0 0%,#e8a7b3 100%)', ink: '#7a2f45' }, // 0 rose
  { bg: 'linear-gradient(160deg,#f1e6f7 0%,#c9b3e2 100%)', ink: '#4b2f6e' }, // 1 lavender
  { bg: 'linear-gradient(160deg,#f9ead8 0%,#e0bf95 100%)', ink: '#6b4a25' }, // 2 sand
  { bg: 'linear-gradient(160deg,#e4efe7 0%,#b3cbb9 100%)', ink: '#2f5a40' }, // 3 sage
  { bg: 'linear-gradient(160deg,#4a3b44 0%,#1f181d 100%)', ink: '#f3dfe6' }, // 4 charcoal
  { bg: 'linear-gradient(160deg,#f6dccb 0%,#d49a86 100%)', ink: '#6a3424' }, // 5 peach
]

interface Props {
  src?: string
  alt: string
  tone?: number
  /** text shown on the placeholder (defaults to alt) */
  label?: string
  eager?: boolean
  /** hide the placeholder icon/text (for tiles that already carry their own text) */
  quiet?: boolean
  className?: string
}

/** Image with a shimmer while loading and a designed placeholder if it is
 *  missing or fails — so the layout looks finished even with dummy data. */
export default function SmartImage({ src, alt, tone = 0, label, eager, quiet, className = '' }: Props) {
  const [state, setState] = useState<'loading' | 'ok' | 'err'>(src ? 'loading' : 'err')
  useEffect(() => { setState(src ? 'loading' : 'err') }, [src])

  const t = TONES[((tone % TONES.length) + TONES.length) % TONES.length]

  return (
    <div className={`smart-img ${state === 'loading' ? 'is-loading' : ''} ${className}`} style={{ background: t.bg }}>
      {state !== 'ok' && !quiet && (
        <div className="smart-img-ph" style={{ color: t.ink }} aria-hidden="true">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="m21 16-5-5-8 8" />
          </svg>
          <span>{label ?? alt}</span>
        </div>
      )}
      {src && state !== 'err' && (
        <img
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          style={{ opacity: state === 'ok' ? 1 : 0 }}
          onLoad={() => setState('ok')}
          onError={() => setState('err')}
        />
      )}
    </div>
  )
}
