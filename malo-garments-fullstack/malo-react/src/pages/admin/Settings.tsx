import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getAdminMe, updateAdminMe } from '../../services/api'
import { showToast } from '../../components/ui/Toast'

/** Random 16-character password (letters + numbers + symbols), from the browser's secure generator. */
function generatePassword(len = 16) {
  const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '!@#$%&*?']
  const all = sets.join('')
  const rnd = (n: number) => crypto.getRandomValues(new Uint32Array(1))[0] % n
  const chars = sets.map(s => s[rnd(s.length)])                 // at least one of each kind
  while (chars.length < len) chars.push(all[rnd(all.length)])
  for (let i = chars.length - 1; i > 0; i--) { const j = rnd(i + 1); [chars[i], chars[j]] = [chars[j], chars[i]] }
  return chars.join('')
}

function strength(p: string) {
  let s = 0
  if (p.length >= 10) s++
  if (p.length >= 14) s++
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++
  if (/\d/.test(p)) s++
  if (/[^a-zA-Z0-9]/.test(p)) s++
  return Math.min(4, s)
}
const LEVELS = ['Too weak', 'Weak', 'Okay', 'Strong', 'Very strong']
const COLORS = ['#d9534f', '#e8873a', '#e0b23a', '#5cb85c', '#2e8b57']

export default function Settings() {
  const qc = useQueryClient()
  const { data: me } = useQuery({ queryKey: ['adminMe'], queryFn: getAdminMe })
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (me) { setName(me.name || ''); setEmail(me.email || '') } }, [me])

  const lvl = strength(next)
  const mismatch = !!confirm && next !== confirm

  const generate = () => {
    const p = generatePassword()
    setNext(p); setConfirm(p); setShow(true)
    navigator.clipboard?.writeText(p).then(() => showToast('Strong password generated and copied — save it somewhere safe!', 'success')).catch(() => {})
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!current) return showToast('Enter your current password to save changes.', 'error')
    if (next && (next.length < 10 || !/[a-zA-Z]/.test(next) || !/\d/.test(next))) return showToast('New password: at least 10 characters with letters and numbers.', 'error')
    if (next !== confirm) return showToast('The two new passwords do not match.', 'error')
    setSaving(true)
    try {
      const r = await updateAdminMe({ currentPassword: current, name, email, newPassword: next || undefined })
      try { localStorage.setItem('malo_admin_user', JSON.stringify(r.admin)) } catch { /* storage unavailable */ }
      qc.invalidateQueries({ queryKey: ['adminMe'] })
      showToast(r.passwordChanged ? 'Saved! Use your new password next time you log in.' : 'Account details saved.', 'success')
      setCurrent(''); setNext(''); setConfirm('')
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Could not save. Please try again.', 'error')
    } finally { setSaving(false) }
  }

  return (
    <div className="admin-card" style={{ maxWidth: 640 }}>
      <div className="admin-card-header"><h3>Account settings</h3></div>
      <form onSubmit={save} autoComplete="off">
        <div className="form-group">
          <label className="form-label">Your name</label>
          <input className="form-input" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Login email</label>
          <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
          <small style={{ color: 'var(--text-muted)' }}>You can log in with this email or with the username <b>{me?.username}</b>.</small>
        </div>

        <h4 style={{ margin: 'var(--sp-xl) 0 var(--sp-md)' }}>Change password</h4>
        <div className="form-group">
          <label className="form-label">New password <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(leave empty to keep the current one)</span></label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="form-input" type={show ? 'text' : 'password'} value={next} onChange={e => setNext(e.target.value)} autoComplete="new-password" style={{ flex: 1, minWidth: 0 }} />
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setShow(s => !s)}>{show ? 'Hide' : 'Show'}</button>
          </div>
          {next && (
            <div style={{ marginTop: 8 }}>
              <div style={{ height: 6, borderRadius: 6, background: 'var(--border-light)', overflow: 'hidden' }}>
                <div style={{ width: `${(lvl + 1) * 20}%`, height: '100%', background: COLORS[lvl], transition: 'width 0.3s, background 0.3s' }} />
              </div>
              <small style={{ color: COLORS[lvl], fontWeight: 600 }}>{LEVELS[lvl]}</small>
            </div>
          )}
          <button type="button" className="btn btn-sm btn-secondary" style={{ marginTop: 10 }} onClick={generate}>🔐 Generate strong password</button>
        </div>
        <div className="form-group">
          <label className="form-label">Confirm new password</label>
          <input className="form-input" type={show ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" />
          {mismatch && <small style={{ color: 'var(--error)' }}>Passwords do not match.</small>}
        </div>

        <div className="form-group" style={{ marginTop: 'var(--sp-xl)', paddingTop: 'var(--sp-lg)', borderTop: '1px solid var(--border-light)' }}>
          <label className="form-label">Current password * <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(needed to save any change)</span></label>
          <input className="form-input" type="password" value={current} onChange={e => setCurrent(e.target.value)} autoComplete="current-password" required />
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving || mismatch}>{saving ? 'Saving…' : 'Save changes'}</button>
      </form>
    </div>
  )
}
