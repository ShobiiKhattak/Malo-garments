import Reveal from './Reveal'

export default function SectionTitle({ children, sub }: { children: string; sub?: string }) {
  return (
    <Reveal className="sec-title-wrap">
      <span className="sec-dot" />
      <h2 className="sec-title">{children}</h2>
      {sub && <p className="sec-sub">{sub}</p>}
    </Reveal>
  )
}
