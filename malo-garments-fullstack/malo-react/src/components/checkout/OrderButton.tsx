/** Animated "Place order" button: a delivery truck loads the parcel and drives off, then a tick. */
export type OrderButtonState = 'idle' | 'driving' | 'done'

/** How long the truck animation runs before the success tick (keep in sync with checkout.css). */
export const ORDER_ANIM_MS = 3300
/** When the loaded truck pulls away (52% of the truck keyframes) — the horn plays here. */
export const HORN_AT_MS = 1550

export default function OrderButton({ state, label }: { state: OrderButtonState; label: string }) {
  return (
    <button type="submit" className={`ob ${state}`} disabled={state !== 'idle'} aria-live="polite">
      <span className="ob-label">{label}</span>
      <span className="ob-done" aria-hidden={state !== 'done'}>
        Order placed
        <svg viewBox="0 0 14 12" aria-hidden="true"><polyline points="1.5 6.5 5 10 12.5 1.5" /></svg>
      </span>
      {state !== 'idle' && <span className="sr-only">Placing your order…</span>}

      <span className="ob-road" aria-hidden="true" />
      <span className="ob-truck" aria-hidden="true">
        <span className="ob-back"><span className="ob-box" /></span>
        <span className="ob-front"><span className="ob-window" /></span>
        <span className="ob-light" />
        <span className="ob-wheel w1" /><span className="ob-wheel w2" />
      </span>
    </button>
  )
}
