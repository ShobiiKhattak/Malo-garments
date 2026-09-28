import { useState } from 'react'
import '../../styles/animated-login.css'

interface AnimatedLoginCardProps {
  onSubmit: (email: string, password: string, keepSession: boolean) => Promise<void> | void
  loading?: boolean
  error?: string
  onForgot?: () => void
  onSignUp?: () => void
  brand?: string
  brandAccent?: string
  tagline?: string
  title?: string
  subtitle?: string
  submitLabel?: string
}

/* ── Inline SVG icons ── */
const LogoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.2 3.4L16.6 7.6l-3.4 1.2L12 12.2 10.8 8.8 7.4 7.6l3.4-1.2L12 3z" />
    <path d="M18.5 13.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z" />
    <path d="M6 4.5v3" />
    <path d="M4.5 6h3" />
  </svg>
)

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
    <path d="M3 7l9 6 9-6" />
  </svg>
)

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </svg>
)

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1.8 12S5.5 5.5 12 5.5 22.2 12 22.2 12 18.5 18.5 12 18.5 1.8 12 1.8 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.9 5.7A9.9 9.9 0 0 1 12 5.5c6.5 0 10.2 6.5 10.2 6.5a17 17 0 0 1-3 3.9" />
    <path d="M6.3 6.7A17 17 0 0 0 1.8 12S5.5 18.5 12 18.5a9.7 9.7 0 0 0 4.2-.9" />
    <path d="M3 3l18 18" />
    <path d="M9.5 9.9a3 3 0 0 0 4.2 4.2" />
  </svg>
)

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12.5l5 5L20 6.5" />
  </svg>
)

const ArrowIcon = () => (
  <svg className="nexus-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12h15" />
    <path d="M13 6l6 6-6 6" />
  </svg>
)

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5" />
    <path d="M12 16.2h.01" />
  </svg>
)

export default function AnimatedLoginCard({
  onSubmit,
  loading = false,
  error,
  onForgot,
  onSignUp,
  brand = 'NEXUS',
  brandAccent = 'AUTH',
  tagline = 'Standard Access Environment',
  title = 'Welcome Back',
  subtitle = 'Please enter your credentials to access your account.',
  submitLabel = 'Sign In to Dashboard',
}: AnimatedLoginCardProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [keepSession, setKeepSession] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({})
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const validate = () => {
    const e: { email?: string; password?: string } = {}
    if (!email.trim()) e.email = 'Email address is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address'
    if (!password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault()
    setTouched({ email: true, password: true })
    if (!validate()) return
    onSubmit(email, password, keepSession)
  }

  return (
    <div className="nexus-page">
      <span className="nexus-orb a" />
      <span className="nexus-orb b" />
      <span className="nexus-orb c" />

      <div className="nexus-card">
        {/* Brand */}
        <div className="nexus-brand">
          <div className="nexus-logo">
            <LogoIcon />
          </div>
          <div className="nexus-brand-text">
            <h1>
              {brand}
              <span>{brandAccent}</span>
            </h1>
            <p>{tagline}</p>
          </div>
        </div>

        {/* Headings */}
        <h2 className="nexus-title">{title}</h2>
        <p className="nexus-subtitle">{subtitle}</p>

        {/* Top-level error */}
        {error && (
          <div className="nexus-banner" role="alert">
            <AlertIcon />
            <span>{error}</span>
          </div>
        )}

        <form className="nexus-form" onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="nexus-row">
            <div className="nexus-label-row">
              <span className="nexus-label">Email Address</span>
            </div>
            <div className={`nexus-field${errors.email && touched.email ? ' error' : ''}`}>
              <span className="nexus-field-icon">
                <MailIcon />
              </span>
              <input
                className="nexus-input"
                type="email"
                autoComplete="email"
                placeholder="name@organization.com"
                value={email}
                onChange={e => {
                  setEmail(e.target.value)
                  if (touched.email) setErrors(prev => ({ ...prev, email: undefined }))
                }}
                onBlur={() => setTouched(t => ({ ...t, email: true }))}
              />
            </div>
            {errors.email && touched.email && <div className="nexus-error">{errors.email}</div>}
          </div>

          {/* Password */}
          <div className="nexus-row">
            <div className="nexus-label-row">
              <span className="nexus-label">Password</span>
              <button type="button" className="nexus-forgot" onClick={onForgot}>
                Forgot?
              </button>
            </div>
            <div className={`nexus-field${errors.password && touched.password ? ' error' : ''}`}>
              <span className="nexus-field-icon">
                <LockIcon />
              </span>
              <input
                className="nexus-input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={e => {
                  setPassword(e.target.value)
                  if (touched.password) setErrors(prev => ({ ...prev, password: undefined }))
                }}
                onBlur={() => setTouched(t => ({ ...t, password: true }))}
              />
              <button
                type="button"
                className="nexus-field-btn"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(s => !s)}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {errors.password && touched.password && <div className="nexus-error">{errors.password}</div>}
          </div>

          {/* Keep session */}
          <div className="nexus-row">
            <label className="nexus-check">
              <input
                type="checkbox"
                checked={keepSession}
                onChange={e => setKeepSession(e.target.checked)}
              />
              <span className="nexus-check-box">
                <CheckIcon />
              </span>
              Keep session active
            </label>
          </div>

          {/* Submit */}
          <div className="nexus-row" style={{ marginBottom: 0 }}>
            <button type="submit" className="nexus-submit" disabled={loading}>
              {loading ? <span className="nexus-spinner" /> : null}
              {loading ? 'Signing in…' : submitLabel}
              {!loading && <ArrowIcon />}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="nexus-foot">
          Don't have an account?{' '}
          <button type="button" onClick={onSignUp}>
            Create one
          </button>
        </div>
      </div>
    </div>
  )
}