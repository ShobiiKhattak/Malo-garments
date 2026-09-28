/**
 * A short "honk-honk" truck horn, synthesised with Web Audio (no sound file needed).
 * Must be called from a click/submit handler — browsers only allow sound after a user action.
 * Returns a function that cancels the horn (e.g. if placing the order fails).
 */
export function playTruckHorn(delayMs = 0): () => void {
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return () => {}
  let ctx: AudioContext
  try { ctx = new AC() } catch { return () => {} }

  const start = ctx.currentTime + delayMs / 1000
  const out = ctx.createGain()
  out.gain.value = 0.22                               // overall volume (0.1 soft … 0.5 loud)
  const tone = ctx.createBiquadFilter()               // soften the raw buzz into a horn
  tone.type = 'lowpass'
  tone.frequency.value = 1500
  tone.connect(out).connect(ctx.destination)

  // Two honks; each is a slightly dissonant chord (that's what makes it sound like a horn)
  const honk = (at: number, len: number) => {
    const env = ctx.createGain()
    env.gain.setValueAtTime(0, at)
    env.gain.linearRampToValueAtTime(1, at + 0.02)
    env.gain.setValueAtTime(1, at + len - 0.05)
    env.gain.linearRampToValueAtTime(0, at + len)
    env.connect(tone)
    for (const f of [311, 392]) {
      const osc = ctx.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(f, at)
      osc.frequency.linearRampToValueAtTime(f * 0.985, at + len)  // tiny droop, like air running out
      osc.connect(env)
      osc.start(at)
      osc.stop(at + len + 0.02)
    }
  }
  // short honk, then a long one that lasts while the truck drives off (length in seconds)
  honk(start, 0.3)
  honk(start + 0.4, 1.3)

  const closeAt = window.setTimeout(() => { ctx.close().catch(() => {}) }, delayMs + 2300)
  return () => { window.clearTimeout(closeAt); ctx.close().catch(() => {}) }
}
