export type GarmentType = 'dress' | 'bra' | 'underwear' | 'nighty'
export type PatternName = 'Solid' | 'Polka Dot' | 'Stripes' | 'Floral' | 'Lace' | 'Satin Sheen'

interface GarmentPreviewProps {
  type: GarmentType
  color: string
  pattern: PatternName
}

function GarmentDefs({ color }: { color: string }) {
  return (
    <defs>
      <pattern id="pat-dots" width="20" height="20" patternUnits="userSpaceOnUse">
        <rect width="20" height="20" fill={color} />
        <circle cx="10" cy="10" r="3" fill="rgba(255,255,255,0.6)" />
      </pattern>
      <pattern id="pat-stripes" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="16" height="16" fill={color} />
        <rect width="8" height="16" fill="rgba(255,255,255,0.32)" />
      </pattern>
      <pattern id="pat-floral" width="32" height="32" patternUnits="userSpaceOnUse">
        <rect width="32" height="32" fill={color} />
        <g transform="translate(16,16)">
          <circle cx="0" cy="-7" r="4.5" fill="rgba(255,255,255,0.55)" />
          <circle cx="0" cy="7" r="4.5" fill="rgba(255,255,255,0.55)" />
          <circle cx="-7" cy="0" r="4.5" fill="rgba(255,255,255,0.55)" />
          <circle cx="7" cy="0" r="4.5" fill="rgba(255,255,255,0.55)" />
          <circle cx="0" cy="0" r="3.5" fill="rgba(255,255,255,0.8)" />
        </g>
      </pattern>
      <pattern id="pat-lace" width="14" height="14" patternUnits="userSpaceOnUse">
        <rect width="14" height="14" fill={color} />
        <path d="M0,7 L7,0 L14,7 L7,14 Z" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1" />
      </pattern>
      <linearGradient id="pat-satin" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={color} />
        <stop offset="42%" stopColor="rgba(255,255,255,0.4)" />
        <stop offset="58%" stopColor={color} />
        <stop offset="100%" stopColor={color} />
      </linearGradient>
      {/* Soft directional sheen drawn over the fabric fill to suggest volume/drape */}
      <linearGradient id="sheen-h" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.32" />
        <stop offset="30%" stopColor="#fff" stopOpacity="0" />
        <stop offset="72%" stopColor="#000" stopOpacity="0" />
        <stop offset="100%" stopColor="#000" stopOpacity="0.14" />
      </linearGradient>
      <radialGradient id="sheen-round" cx="35%" cy="28%" r="75%">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
        <stop offset="60%" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="sheen-v" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
    </defs>
  )
}

function fillFor(pattern: PatternName, color: string): string {
  switch (pattern) {
    case 'Polka Dot': return 'url(#pat-dots)'
    case 'Stripes': return 'url(#pat-stripes)'
    case 'Floral': return 'url(#pat-floral)'
    case 'Lace': return 'url(#pat-lace)'
    case 'Satin Sheen': return 'url(#pat-satin)'
    default: return color
  }
}

export default function GarmentPreview({ type, color, pattern }: GarmentPreviewProps) {
  const fill = fillFor(pattern, color)

  if (type === 'bra') {
    const leftCup = 'M118,55 C100,25 55,18 32,40 C10,60 10,105 35,128 C55,146 90,146 112,128 C120,120 122,80 118,55 Z'
    const rightCup = 'M122,55 C140,25 185,18 208,40 C230,60 230,105 205,128 C185,146 150,146 128,128 C120,120 118,80 122,55 Z'
    const band = 'M15,130 Q120,162 225,130 L225,151 Q120,183 15,151 Z'
    return (
      <svg viewBox="0 0 240 195" width="100%" height="100%" style={{ maxHeight: 320 }}>
        <GarmentDefs color={color} />
        <line x1="75" y1="28" x2="60" y2="0" stroke={color} strokeWidth="6" strokeLinecap="round" />
        <line x1="165" y1="28" x2="180" y2="0" stroke={color} strokeWidth="6" strokeLinecap="round" />
        <path d={band} fill={fill} stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
        <path d={leftCup} fill={fill} stroke="rgba(0,0,0,0.12)" strokeWidth="1.5" />
        <path d={leftCup} fill="url(#sheen-round)" />
        <path d="M40,60 Q75,78 112,122" stroke="rgba(0,0,0,0.18)" strokeWidth="2" fill="none" />
        <path d={rightCup} fill={fill} stroke="rgba(0,0,0,0.12)" strokeWidth="1.5" />
        <path d={rightCup} fill="url(#sheen-round)" />
        <path d="M200,60 Q165,78 128,122" stroke="rgba(0,0,0,0.18)" strokeWidth="2" fill="none" />
        <path d="M112,128 Q120,112 128,128 L124,141 Z" fill="rgba(0,0,0,0.22)" />
      </svg>
    )
  }

  if (type === 'underwear') {
    const d = 'M30,18 Q100,4 170,18 L166,40 Q172,60 158,78 Q172,100 155,122 Q135,150 100,162 Q65,150 45,122 Q28,100 42,78 Q28,60 34,40 Z'
    return (
      <svg viewBox="0 0 200 175" width="100%" height="100%" style={{ maxHeight: 320 }}>
        <GarmentDefs color={color} />
        <path d={d} fill={fill} stroke="rgba(0,0,0,0.12)" strokeWidth="1.5" />
        <path d={d} fill="url(#sheen-v)" />
        <path d="M30,18 Q100,4 170,18 L167,32 Q100,20 33,32 Z" fill="rgba(0,0,0,0.16)" />
      </svg>
    )
  }

  if (type === 'nighty') {
    const d = 'M82,22 Q100,30 118,22 L132,55 L146,290 L54,290 L68,55 Z'
    return (
      <svg viewBox="0 0 200 300" width="100%" height="100%" style={{ maxHeight: 380 }}>
        <GarmentDefs color={color} />
        <path d="M85,24 L78,4" stroke={color} strokeWidth="4" strokeLinecap="round" />
        <path d="M115,24 L122,4" stroke={color} strokeWidth="4" strokeLinecap="round" />
        <path d={d} fill={fill} stroke="rgba(0,0,0,0.1)" strokeWidth="1.5" />
        <path d={d} fill="url(#sheen-h)" />
        <path d="M68,55 L60,270 M132,55 L140,270" stroke="rgba(0,0,0,0.1)" strokeWidth="1.5" fill="none" />
        <path d="M60,270 Q100,278 140,270" stroke="rgba(255,255,255,0.55)" strokeWidth="2" fill="none" />
      </svg>
    )
  }

  // dress
  const d = 'M78,22 Q100,32 122,22 L136,48 L126,60 L116,52 L108,108 L165,285 L35,285 L92,108 L84,52 L74,60 L64,48 Z'
  return (
    <svg viewBox="0 0 200 300" width="100%" height="100%" style={{ maxHeight: 380 }}>
      <GarmentDefs color={color} />
      <path d="M78,22 L68,0 M122,22 L132,0" stroke={color} strokeWidth="6" strokeLinecap="round" />
      <path d={d} fill={fill} stroke="rgba(0,0,0,0.1)" strokeWidth="1.5" />
      <path d={d} fill="url(#sheen-h)" />
      <path d="M92,108 Q100,114 108,108" stroke="rgba(0,0,0,0.22)" strokeWidth="2" fill="none" />
      <path d="M100,110 L83,283 M100,110 L117,283" stroke="rgba(0,0,0,0.09)" strokeWidth="1.5" fill="none" />
    </svg>
  )
}
