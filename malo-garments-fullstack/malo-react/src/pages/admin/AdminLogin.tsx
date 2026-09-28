import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { adminLogin } from '../../services/api'
import '../../styles/neon-auth.css'

const UserIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
  </svg>
)
const EyeIcon = ({ off }: { off: boolean }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {off
      ? <><path d="M3 3l18 18" /><path d="M10.6 10.6a2 2 0 002.8 2.8" /><path d="M9.5 5.3A10.4 10.4 0 0112 5c5 0 9 4 10 7-.4 1.1-1.1 2.3-2.1 3.4M6.5 6.6C4.6 7.9 3.1 9.8 2 12c1 3 5 7 10 7 1.3 0 2.5-.2 3.6-.7" /></>
      : <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>}
  </svg>
)

export default function AdminLogin() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { loginAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const r = await adminLogin(form)
      loginAdmin(r.admin, r.token)
      navigate((location.state as { from?: string } | null)?.from || '/admin/dashboard')
    } catch { setError('Invalid username or password.') }
    finally { setLoading(false) }
  }

  return (
    <div className="neon-page">
      <div className="neon-card">
        <div className="neon-diagonal-bg" />

        <div className="neon-form-side">
          <div className="neon-brand">Malo Garments</div>
          <form onSubmit={handleSubmit} className="neon-anim">
            <h2 className="neon-heading">Admin Login</h2>
            {error && <div className="neon-error-text" style={{ marginTop: -12, marginBottom: 16 }}>{error}</div>}
            <div className="neon-field">
              <label htmlFor="admin-username">Username</label>
              <div className="neon-field-row">
                <input id="admin-username" type="text" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} autoComplete="off" />
                <span className="neon-field-icon"><UserIcon /></span>
              </div>
            </div>
            <div className="neon-field">
              <label htmlFor="admin-password">Password</label>
              <div className="neon-field-row">
                <input id="admin-password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} autoComplete="off" />
                <button type="button" className="neon-field-eye" tabIndex={-1} onClick={() => setShowPassword(s => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  <EyeIcon off={showPassword} />
                </button>
              </div>
            </div>
            <button type="submit" className="neon-btn" disabled={loading}>
              {loading && <span className="neon-btn-spinner" />}{loading ? 'Logging in...' : 'Log In'}
            </button>
            <div className="neon-switch" style={{ marginTop: 22 }}>Demo — Username: <strong style={{ color: '#fdf6f0' }}>admin</strong> · Password: <strong style={{ color: '#fdf6f0' }}>admin123</strong></div>
          </form>
        </div>

        <div className="neon-welcome-side">
          <h3 className="neon-welcome-title">Admin Access</h3>
          <p className="neon-welcome-sub">Manage products, orders and customers from one dashboard.</p>
        </div>
      </div>
    </div>
  )
}
