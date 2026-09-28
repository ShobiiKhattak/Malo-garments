import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

/** Animated page hero shared by the info pages (policies, FAQ, contact). */
export default function InfoHero({ icon, kicker, title, intro, crumb, children }: {
  icon: string; kicker: string; title: string; intro: string; crumb: string; children?: ReactNode
}) {
  return (
    <section className="ih">
      <span className="ih-blob b1" /><span className="ih-blob b2" /><span className="ih-blob b3" />
      <div className="ih-inner">
        <nav className="ih-crumb rise" style={{ ['--d' as string]: 0 }}><Link to="/">Home</Link><i>/</i><span>{crumb}</span></nav>
        <div className="ih-icon rise" style={{ ['--d' as string]: 80 }} aria-hidden="true">{icon}</div>
        <span className="ih-kicker rise" style={{ ['--d' as string]: 160 }}>{kicker}</span>
        <h1 className="ih-title" aria-label={title}>
          {title.split(' ').map((w, i) => (
            <span key={i} className="ih-word" style={{ ['--d' as string]: 220 + i * 90 }} aria-hidden="true">{w}&nbsp;</span>
          ))}
        </h1>
        <p className="ih-intro rise" style={{ ['--d' as string]: 420 }}>{intro}</p>
        {children}
      </div>
    </section>
  )
}
