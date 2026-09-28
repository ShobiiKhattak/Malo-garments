interface LogoProps {
  variant?: 'dark' | 'light'
  height?: number
}

/**
 * Malo Garments wordmark, rendered inline (not <img>) so it inherits the
 * page's already-loaded Playfair Display / Poppins fonts instead of falling
 * back to generic serif/sans-serif the way a standalone .svg file would.
 */
export default function Logo({ variant = 'dark', height = 44 }: LogoProps) {
  const isDark = variant === 'dark'
  const textColor = isDark ? '#4A1942' : '#FDF6F0'
  const knotColor = isDark ? '#A85C5C' : '#E8A0A0'

  return (
    <svg height={height} viewBox="0 0 320 110" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Malo Garments">
      <g fill="none" stroke="#C9A96E" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(2,5)">
        <path d="M50,32 C39,14 15,13 7,24 C1,34 13,42 30,39 C39,37 46,34 50,32 Z" />
        <path d="M50,32 C61,14 85,13 93,24 C99,34 87,42 70,39 C61,37 54,34 50,32 Z" />
        <path d="M50,32 L43,62" />
        <path d="M50,32 L57,62" />
      </g>
      <circle cx="52" cy="37" r="5.5" fill={knotColor} />
      <text x="112" y="66" fontFamily="'Playfair Display', Georgia, serif" fontStyle="italic" fontWeight="700" fontSize="54" fill={textColor}>Malo</text>
      <text x="115" y="90" fontFamily="'Poppins', sans-serif" fontWeight="600" fontSize="15" letterSpacing="4" fill="#C9A96E">GARMENTS</text>
    </svg>
  )
}

/** Icon-only mark (bow in a ring) — for compact spaces like a mobile avatar. */
export function LogoIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Malo Garments">
      <circle cx="50" cy="50" r="47" fill="#FDF6F0" stroke="#C9A96E" strokeWidth="2" />
      <g fill="none" stroke="#C9A96E" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(2,12)">
        <path d="M50,32 C39,14 15,13 7,24 C1,34 13,42 30,39 C39,37 46,34 50,32 Z" />
        <path d="M50,32 C61,14 85,13 93,24 C99,34 87,42 70,39 C61,37 54,34 50,32 Z" />
        <path d="M50,32 L43,58" />
        <path d="M50,32 L57,58" />
      </g>
      <circle cx="52" cy="44" r="5.5" fill="#A85C5C" />
    </svg>
  )
}

/** Picks the dark or light wordmark from the active theme via CSS, so it
 *  stays readable in both the day and night themes without a re-render. */
export function ThemedLogo({ height = 44 }: { height?: number }) {
  return (
    <>
      <span className="logo-on-light"><Logo variant="dark" height={height} /></span>
      <span className="logo-on-dark"><Logo variant="light" height={height} /></span>
    </>
  )
}
