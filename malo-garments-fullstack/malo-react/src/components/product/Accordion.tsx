import type { ReactNode } from 'react'

interface Props {
  id: string
  title: string
  open: boolean
  onToggle: (id: string) => void
  children: ReactNode
}

/** Smooth-height accordion row with a + / − icon. */
export default function Accordion({ id, title, open, onToggle, children }: Props) {
  return (
    <div className={`acc ${open ? 'open' : ''}`} id={`acc-${id}`}>
      <button className="acc-head" aria-expanded={open} onClick={() => onToggle(id)}>
        <span>{title}</span>
        <i className="acc-ico" />
      </button>
      <div className="acc-body"><div className="acc-inner">{children}</div></div>
    </div>
  )
}
