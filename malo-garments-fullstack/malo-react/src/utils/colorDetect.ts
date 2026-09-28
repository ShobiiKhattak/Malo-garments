/*
 * Garment colour detection — runs entirely in the browser (canvas), no API needed.
 * Finds the main colours of a product photo while ignoring the plain studio background
 * (sampled from the photo's edges) and down-weighting skin, then names each colour.
 */
import type { Color } from '../types'

type RGB = [number, number, number]
type Lab = [number, number, number]

/* Fashion colour names the store uses. Detected colours get the nearest name (in Lab space). */
const NAMED: [string, string][] = [
  ['Black', '#111111'], ['Charcoal', '#36454f'], ['Grey', '#8e8e8e'], ['Silver', '#c4c4c4'], ['White', '#f7f7f5'],
  ['Ivory', '#f3ecd8'], ['Cream', '#efe3c4'], ['Beige', '#d9c3a0'], ['Nude', '#d7a98c'], ['Tan', '#b88a5b'],
  ['Camel', '#b8864b'], ['Brown', '#6f4a2e'], ['Chocolate', '#3f2a1d'], ['Mustard', '#d4a017'], ['Yellow', '#f2d02b'],
  ['Gold', '#c9a646'], ['Orange', '#ee7d22'], ['Rust', '#a4471f'], ['Peach', '#f6b99c'], ['Coral', '#f0776a'],
  ['Red', '#c8202b'], ['Maroon', '#6e1423'], ['Burgundy', '#7a1f3d'], ['Wine', '#5a1631'], ['Blush Pink', '#f2c4c8'],
  ['Dusty Pink', '#d49a9f'], ['Pink', '#ec8fb0'], ['Hot Pink', '#e0317c'], ['Magenta', '#b5227a'], ['Lilac', '#c9a9dc'],
  ['Lavender', '#b7a6e0'], ['Purple', '#6b3fa0'], ['Plum', '#5c2a4f'], ['Navy', '#1d2a4d'], ['Royal Blue', '#2f55c6'],
  ['Blue', '#3a7bd5'], ['Sky Blue', '#8ec5ec'], ['Powder Blue', '#bcd4e6'], ['Teal', '#127a7a'], ['Turquoise', '#35c0c0'],
  ['Mint', '#a8e0c4'], ['Sea Green', '#3d9c79'], ['Green', '#2e8b3e'], ['Emerald', '#0f6b4a'], ['Olive', '#6b6b2a'],
  ['Khaki', '#a89f6a'], ['Bottle Green', '#1c4a33'], ['Mauve', '#c49a9f'], ['Rose Gold', '#d8a79a'], ['Dusty Blue', '#8fa6b8'],
  ['Ice Blue', '#c3d6de'], ['Teal Blue', '#1f5f73'], ['Sage', '#a3b09a'], ['Pistachio', '#b9cf98'], ['Off White', '#ece9e0'],
  ['Old Rose', '#a8787c'], ['Taupe', '#8b7f78'],
]

const toLab = ([r, g, b]: RGB): Lab => {
  const lin = (c: number) => { c /= 255; return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92 }
  const R = lin(r), G = lin(g), B = lin(b)
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  const x = f((R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047)
  const y = f(R * 0.2126 + G * 0.7152 + B * 0.0722)
  const z = f((R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883)
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)]
}
const dist = (a: Lab, b: Lab) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
const hexToRgb = (hex: string): RGB => { const n = parseInt(hex.replace('#', '').padEnd(6, '0').slice(0, 6), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] }
const rgbToHex = (c: RGB) => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('')
const NAMED_LAB = NAMED.map(([name, hex]) => ({ name, lab: toLab(hexToRgb(hex)) }))

export const colorName = (hex: string) => {
  const lab = toLab(hexToRgb(hex))
  return NAMED_LAB.reduce((best, c) => (dist(c.lab, lab) < dist(best.lab, lab) ? c : best)).name
}

/** True when two hex colours look like the same colour (used to avoid duplicates). */
export const sameColor = (a: string, b: string) => dist(toLab(hexToRgb(a)), toLab(hexToRgb(b))) < 14

const isSkin = ([r, g, b]: RGB) =>
  r > 95 && g > 40 && b > 20 && r > g && g > b && r - g > 15 && r - g < 90 && Math.max(r, g, b) - Math.min(r, g, b) > 15

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const img = new Image()
  if (!src.startsWith('data:')) img.crossOrigin = 'anonymous'
  img.onload = () => resolve(img)
  img.onerror = () => reject(new Error('Image could not be loaded'))
  img.src = src
})

/**
 * Returns the garment's main colours in one photo, most dominant first.
 * `max` limits how many; a colour must cover at least `minShare` of the garment to count.
 */
export async function detectColors(src: string, max = 2, minShare = 0.22): Promise<Color[]> {
  const img = await loadImage(src)
  const S = 72
  const scale = S / Math.max(img.naturalWidth, img.naturalHeight)
  const w = Math.max(1, Math.round(img.naturalWidth * scale)), h = Math.max(1, Math.round(img.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0, w, h)
  const data = ctx.getImageData(0, 0, w, h).data // throws for cross-origin images without CORS

  const px = (x: number, y: number): RGB | null => { const i = (y * w + x) * 4; return data[i + 3] < 128 ? null : [data[i], data[i + 1], data[i + 2]] }

  // 1. Background = colours that fill the photo's outer frame.
  const edge = Math.max(1, Math.round(Math.min(w, h) * 0.06))
  const bgBuckets = new Map<string, { n: number; lab: Lab }>()
  let edgeCount = 0
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (x >= edge && x < w - edge && y >= edge && y < h - edge) continue
    const c = px(x, y); if (!c) continue
    edgeCount++
    const key = c.map(v => v >> 5).join(',')
    const b = bgBuckets.get(key) || { n: 0, lab: toLab(c) }
    b.n++; bgBuckets.set(key, b)
  }
  const background = [...bgBuckets.values()].filter(b => b.n / edgeCount > 0.12).map(b => b.lab)

  // 2. Collect garment pixels: centre of the photo weighs most (the garment), the room around it
  //    barely counts, and skin is down-weighted.
  const samples: { lab: Lab; rgb: RGB; w: number; skin: boolean }[] = []
  let total = 0
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const c = px(x, y); if (!c) continue
    const lab = toLab(c)
    if (background.some(bg => dist(bg, lab) < 16)) continue
    const inCore = x > w * 0.28 && x < w * 0.72 && y > h * 0.2 && y < h * 0.95
    const dx = (x - w / 2) / (w / 2), dy = (y - h * 0.58) / (h / 2)
    const skin = isSkin(c)
    const weight = (inCore ? 1 - Math.min(1, Math.hypot(dx, dy)) * 0.4 : 0.08) * (skin ? 0.3 : 1)
    samples.push({ lab, rgb: c, w: weight, skin }); total += weight
  }
  if (!total) return []

  // 3. Every pixel votes for its nearest named colour. Voting (instead of averaging) keeps a pink
  //    fabric pink — averages of pink + green pixels cancel out to a false grey.
  const votes = new Map<string, { w: number; r: number; g: number; b: number; skin: number; lab: Lab }>()
  for (const s of samples) {
    const nm = NAMED_LAB.reduce((best, c) => (dist(c.lab, s.lab) < dist(best.lab, s.lab) ? c : best))
    const v = votes.get(nm.name) || { w: 0, r: 0, g: 0, b: 0, skin: 0, lab: nm.lab }
    v.w += s.w; v.r += s.rgb[0] * s.w; v.g += s.rgb[1] * s.w; v.b += s.rgb[2] * s.w
    if (s.skin) v.skin += s.w
    votes.set(nm.name, v)
  }

  // 4. Light and shadowed parts of one fabric vote for neighbouring shades (Black/Charcoal,
  //    Grey/Silver…): fold each smaller shade into a bigger one that differs mostly in lightness.
  const cd = (a: Lab, b: Lab) => Math.hypot((a[0] - b[0]) * 0.45, a[1] - b[1], a[2] - b[2])
  const clusters: { name: string; w: number; r: number; g: number; b: number; skin: number; lab: Lab }[] = []
  for (const [name, v] of [...votes.entries()].sort((a, b) => b[1].w - a[1].w)) {
    const home = clusters.find(c => cd(c.lab, v.lab) < 14)
    if (home) { home.w += v.w; home.r += v.r; home.g += v.g; home.b += v.b; home.skin += v.skin }
    else clusters.push({ name, ...v })
  }

  const out: Color[] = []
  for (const c of clusters.sort((a, b) => b.w - a.w)) {
    if (out.length >= max || c.w / total < minShare) break
    // A mostly-skin colour only counts when it IS the garment (e.g. a nude bra) — i.e. the top colour.
    if (out.length > 0 && c.skin / c.w > 0.5) continue
    const hex = rgbToHex([c.r / c.w, c.g / c.w, c.b / c.w])
    const name = c.name
    if (!out.some(o => o.name === name || sameColor(o.hex, hex))) out.push({ name, hex })
  }
  return out
}

/** Adds colours that are not already in the list (by name or look). Blank rows are dropped. */
export const mergeColors = (current: Color[], found: Color[]) => {
  const list = current.filter(c => c.name.trim())
  for (const f of found)
    if (!list.some(c => c.name.toLowerCase() === f.name.toLowerCase() || (c.hex && sameColor(c.hex, f.hex)))) list.push(f)
  return list
}
