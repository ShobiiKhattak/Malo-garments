import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { showToast } from '../components/ui/Toast'
import Reveal from '../components/home/Reveal'
import InfoHero from '../components/info/InfoHero'
import { sendContactMessage } from '../services/api'
import { STORE } from '../data/homeContent'
import { POLICIES } from '../data/policies'

interface ContactForm { name: string; email: string; phone: string; subject: string; message: string }
const EMPTY: ContactForm = { name: '', email: '', phone: '', subject: '', message: '' }
const TOPICS = ['Order question', 'Exchange / return', 'Size help', 'Payment', 'Other']
const MAX = 1000
const LANDLINE = (STORE as { landline?: string }).landline  // optional in homeContent.ts

/** Mon–Sat 10:00–21:00 Pakistan time. */
function useOpenNow() {
  const calc = () => {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', weekday: 'short', hour: 'numeric', hour12: false }).formatToParts(new Date())
    const day = parts.find(p => p.type === 'weekday')?.value
    const hour = Number(parts.find(p => p.type === 'hour')?.value)
    return day !== 'Sun' && hour >= 10 && hour < 21
  }
  const [open, setOpen] = useState(calc)
  useEffect(() => { const t = setInterval(() => setOpen(calc()), 60_000); return () => clearInterval(t) }, [])
  return open
}

export default function Contact() {
  const [form, setForm] = useState<ContactForm>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const openNow = useOpenNow()
  const set = (k: keyof ContactForm, v: string) => setForm(f => ({ ...f, [k]: v }))
  const waLink = (text = STORE.whatsappMessage) => `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(text)}`

  useEffect(() => { document.title = `Contact Us — ${STORE.name}` }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return showToast('Please fill in your name, email and message.', 'error')
    setLoading(true)
    try {
      await sendContactMessage(form)
      setSent(true)
      setForm(EMPTY)
    } catch (err: any) {
      // Email not set up on the server (or it failed) — hand the message to WhatsApp so it is never lost.
      if (err.response?.data?.whatsapp) {
        showToast('Opening WhatsApp so your message reaches us right away…', 'info')
        window.open(waLink(`Hi, I'm ${form.name} (${form.email}).\n${form.subject ? form.subject + ': ' : ''}${form.message}`), '_blank', 'noopener')
      } else {
        showToast(err.response?.data?.error || 'Could not send your message. Please try WhatsApp.', 'error')
      }
    } finally { setLoading(false) }
  }

  const quick = [
    { icon: '💬', title: 'WhatsApp', value: STORE.phone, sub: 'Fastest reply', href: waLink(), cls: 'wa' },
    { icon: '📞', title: 'Call us', value: STORE.phone, sub: LANDLINE ? `Landline ${LANDLINE}` : 'Mon – Sat', href: `tel:${STORE.phone.replace(/\s/g, '')}`, cls: 'call' },
    { icon: '✉️', title: 'Email', value: STORE.email, sub: 'Reply within 24 hours', href: `mailto:${STORE.email}`, cls: 'mail' },
    { icon: '📍', title: 'Visit', value: STORE.address, sub: STORE.hours, href: `https://maps.google.com/?q=${encodeURIComponent(STORE.name + ' ' + STORE.address)}`, cls: 'map' },
  ]

  return (
    <div className="ip ct">
      <InfoHero icon="💌" kicker="We'd love to hear from you" title="Contact Us" crumb="Contact"
        intro="Questions about an order, sizing or an exchange? Our team is happy to help.">
        <span className={`ct-status rise ${openNow ? 'on' : ''}`} style={{ ['--d' as string]: 520 }}>
          <i />{openNow ? 'Open now — we usually reply within a few hours' : `Closed now — we reply from 10 AM (${STORE.hours.split(':')[0]})`}
        </span>
      </InfoHero>

      <div className="container">
        <div className="ct-quick">
          {quick.map((c, i) => (
            <Reveal key={c.title} delay={i * 90}>
              <a className={`ct-card ${c.cls}`} href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
                <span className="ct-card-ico" aria-hidden="true">{c.icon}</span>
                <small>{c.title}</small>
                <b>{c.value}</b>
                {c.sub && <span>{c.sub}</span>}
                <i className="ct-card-go" aria-hidden="true">→</i>
              </a>
            </Reveal>
          ))}
        </div>

        <div className="ct-main">
          <Reveal variant="left">
            <div className="ct-form-card">
              {sent ? (
                <div className="ct-sent">
                  <div className="ct-sent-ico">✓</div>
                  <h3>Message sent!</h3>
                  <p>Thank you — we have received your message and will reply by email within 24 hours.</p>
                  <button className="btn btn-outline" onClick={() => setSent(false)}>Send another message</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  <h3>Send us a message</h3>
                  <p className="ct-lead">Fill in the form and we will get back to you by email.</p>

                  <div className="ct-topics" role="group" aria-label="Topic">
                    {TOPICS.map(t => (
                      <button type="button" key={t} className={form.subject === t ? 'on' : ''} onClick={() => set('subject', form.subject === t ? '' : t)}>{t}</button>
                    ))}
                  </div>

                  <div className="ct-row">
                    <div className="cf"><input id="cf-name" value={form.name} onChange={e => set('name', e.target.value)} placeholder=" " autoComplete="name" required /><label htmlFor="cf-name">Your name *</label></div>
                    <div className="cf"><input id="cf-email" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder=" " autoComplete="email" required /><label htmlFor="cf-email">Email *</label></div>
                  </div>
                  <div className="cf"><input id="cf-phone" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder=" " autoComplete="tel" /><label htmlFor="cf-phone">Phone (optional)</label></div>
                  <div className="cf">
                    <textarea id="cf-msg" rows={5} maxLength={MAX} value={form.message} onChange={e => set('message', e.target.value)} placeholder=" " required />
                    <label htmlFor="cf-msg">How can we help? *</label>
                    <span className="cf-count">{form.message.length}/{MAX}</span>
                  </div>
                  <button type="submit" className="btn btn-primary btn-lg btn-block ct-send" disabled={loading}>
                    {loading ? <span className="ct-spin" /> : null}{loading ? 'Sending…' : 'Send message'}
                  </button>
                </form>
              )}
            </div>
          </Reveal>

          <Reveal variant="right" delay={120}>
            <div className="ct-side">
              <h3>Quick answers</h3>
              {(POLICIES.faq.faq || []).slice(0, 4).map(f => (
                <details key={f.q} className="ct-faq">
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
              <Link to="/faq" className="ct-more">See all FAQs →</Link>
              <div className="ct-policies">
                <Link to="/shipping">🚚 Shipping</Link>
                <Link to="/returns">🔁 Returns</Link>
                <Link to="/privacy">🔒 Privacy</Link>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  )
}
