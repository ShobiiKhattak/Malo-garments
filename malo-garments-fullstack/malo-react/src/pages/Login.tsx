import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'
import { loginUser, registerUser, sendOtp, verifyOtp, googleLogin } from '../services/api'
import { showToast } from '../components/ui/Toast'
import '../styles/neon-auth.css'
import type { User } from '../types'

type Mode = 'email' | 'phone-enter' | 'phone-verify'

const MailIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" />
  </svg>
)
const UserIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
  </svg>
)
const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" />
  </svg>
)
const EyeIcon = ({ off }: { off: boolean }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {off
      ? <><path d="M3 3l18 18" /><path d="M10.6 10.6a2 2 0 002.8 2.8" /><path d="M9.5 5.3A10.4 10.4 0 0112 5c5 0 9 4 10 7-.4 1.1-1.1 2.3-2.1 3.4M6.5 6.6C4.6 7.9 3.1 9.8 2 12c1 3 5 7 10 7 1.3 0 2.5-.2 3.6-.7" /></>
      : <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>}
  </svg>
)

interface FieldProps {
  label: string
  name: string
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
  hint?: string
  placeholder?: string
  icon: React.ReactNode
}

// ✅ Defined OUTSIDE component — fixes 1-char input bug
function Field({ label, name, type = 'text', value, onChange, error, hint, placeholder, icon }: FieldProps) {
  return (
    <div className={`neon-field${error ? ' neon-field-error' : ''}`}>
      <label htmlFor={`field-${name}`}>{label}</label>
      <div className="neon-field-row">
        <input id={`field-${name}`} type={type} value={value} onChange={onChange} placeholder={placeholder} autoComplete="off" />
        <span className="neon-field-icon">{icon}</span>
      </div>
      {hint && !error && <div className="neon-field-hint">{hint}</div>}
      {error && <div className="neon-error-text">{error}</div>}
    </div>
  )
}

function PasswordField(props: Omit<FieldProps, 'type' | 'icon'>) {
  const [show, setShow] = useState(false)
  return (
    <div className={`neon-field${props.error ? ' neon-field-error' : ''}`}>
      <label htmlFor={`field-${props.name}`}>{props.label}</label>
      <div className="neon-field-row">
        <input id={`field-${props.name}`} type={show ? 'text' : 'password'} value={props.value} onChange={props.onChange} placeholder={props.placeholder} autoComplete="off" />
        <button type="button" className="neon-field-eye" tabIndex={-1} onClick={() => setShow(s => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
          <EyeIcon off={show} />
        </button>
      </div>
      {props.hint && !props.error && <div className="neon-field-hint">{props.hint}</div>}
      {props.error && <div className="neon-error-text">{props.error}</div>}
    </div>
  )
}

// ✅ Also OUTSIDE the component, for the same reason — a component that gets
// redefined on every render loses focus/cursor position as soon as you type.
function OtpBoxes({ value, onChange, shake }: { value: string; onChange: (v: string) => void; shake: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '')

  const setDigit = (i: number, raw: string) => {
    const clean = raw.replace(/\D/g, '').slice(-1)
    const next = digits.slice()
    next[i] = clean
    onChange(next.join(''))
    if (clean && i < 5) refs.current[i + 1]?.focus()
  }

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus()
  }

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!text) return
    e.preventDefault()
    onChange(text)
    refs.current[Math.min(text.length, 5)]?.focus()
  }

  return (
    <div className={`neon-otp-boxes${shake ? ' neon-otp-shake' : ''}`}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={e => setDigit(i, e.target.value)}
          onKeyDown={e => onKeyDown(i, e)}
          onPaste={onPaste}
          className="neon-otp-box"
        />
      ))}
    </div>
  )
}

export default function Login() {
  const [mode, setMode] = useState<Mode>('email')
  const [tab, setTab] = useState<'login' | 'signup'>('login')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const { loginUser: loginCtx } = useAuth()
  const navigate = useNavigate()

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [signupForm, setSignupForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [phone, setPhone] = useState('')
  const [phoneName, setPhoneName] = useState('')
  const [otp, setOtp] = useState('')
  const [otpShake, setOtpShake] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown(c => c - 1), 1000)
    return () => clearInterval(t)
  }, [cooldown > 0])

  const finishLogin = (user: User, token: string) => {
    if (rememberMe) localStorage.setItem('malo_keep_session', 'true')
    else localStorage.removeItem('malo_keep_session')
    loginCtx(user, token)
    setSuccess(true)
    showToast(`Welcome${user.name ? `, ${user.name}` : ''}!`, 'success')
    setTimeout(() => navigate('/account'), 650)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    const errs: Record<string, string> = {}
    if (!loginForm.email) errs.email = 'Required'
    if (!loginForm.password) errs.password = 'Required'
    if (Object.keys(errs).length) return setErrors(errs)
    setLoading(true)
    try {
      const r = await loginUser({ email: loginForm.email, password: loginForm.password })
      finishLogin(r.user, r.token)
    } catch (err: any) {
      setErrors({ email: err.response?.data?.error || 'Invalid email or password' })
    } finally { setLoading(false) }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    const errs: Record<string, string> = {}
    if (!signupForm.name) errs.name = 'Required'
    if (!signupForm.email) errs.email = 'Required'
    if (!signupForm.password || signupForm.password.length < 6) errs.password = 'Min 6 characters'
    if (signupForm.password !== signupForm.confirm) errs.confirm = 'Passwords do not match'
    if (Object.keys(errs).length) return setErrors(errs)
    setLoading(true)
    try {
      const r = await registerUser({ name: signupForm.name, email: signupForm.email, phone: signupForm.phone, password: signupForm.password })
      finishLogin(r.user, r.token)
    } catch (err: any) {
      setErrors({ email: err.response?.data?.error || 'Registration failed' })
    } finally { setLoading(false) }
  }

  const requestOtp = async () => {
    if (!phone.trim()) { setErrors({ phone: 'Enter your phone number' }); return false }
    setErrors({})
    setLoading(true)
    try {
      const r = await sendOtp(phone)
      showToast(r.devOtp ? `Dev mode — your code is ${r.devOtp}` : 'Verification code sent via SMS.', 'info')
      setCooldown(60)
      return true
    } catch (err: any) {
      setErrors({ phone: err.response?.data?.error || 'Could not send code' })
      return false
    } finally { setLoading(false) }
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setOtp('')
    if (await requestOtp()) setMode('phone-verify')
  }

  const handleResendOtp = () => { if (cooldown === 0) requestOtp() }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== 6) return
    setErrors({})
    setLoading(true)
    try {
      const r = await verifyOtp({ phone, code: otp, name: phoneName })
      finishLogin(r.user, r.token)
    } catch (err: any) {
      setOtpShake(true)
      setTimeout(() => setOtpShake(false), 450)
      setErrors({ otp: err.response?.data?.error || 'Invalid code' })
      setOtp('')
    } finally { setLoading(false) }
  }

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) return
    setLoading(true)
    try {
      const r = await googleLogin(credentialResponse.credential)
      finishLogin(r.user, r.token)
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Google sign-in failed', 'error')
    } finally { setLoading(false) }
  }

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  const welcome = success
    ? { key: 'success', title: "You're In!", sub: 'Redirecting you to your account…' }
    : mode !== 'email'
    ? { key: 'phone', title: "Verify It's You!", sub: "We'll text a 6-digit code to confirm your number." }
    : tab === 'signup'
    ? { key: 'signup', title: 'Join Us!', sub: 'Create an account to start shopping with Malo Garments.' }
    : { key: 'login', title: 'Welcome Back!', sub: 'Hope you and your family have a great day.' }

  return (
    <div className="neon-page" style={{ paddingTop: 'var(--navbar-height)' }}>
      <div className="neon-card">
        <div className="neon-diagonal-bg" key={`bg-${welcome.key}`} />

        <div className="neon-form-side">
          {success ? (
            <div className="neon-anim" key="success">
              <div className="neon-success-icon">✓</div>
              <h2 className="neon-heading">You're In!</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Taking you to your account…</p>
            </div>
          ) : mode === 'email' ? (
            <>
              <div className="neon-brand">Malo Garments</div>
              {tab === 'login' ? (
                <form onSubmit={handleLogin} key="login" className="neon-anim">
                  <h2 className="neon-heading">Login</h2>
                  <Field label="Email" name="email" type="email" icon={<MailIcon />} placeholder="you@example.com" value={loginForm.email} onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))} error={errors.email} />
                  <PasswordField label="Password" name="password" placeholder="••••••••" value={loginForm.password} onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))} error={errors.password} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', marginBottom: 4, cursor: 'pointer' }}>
                    <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} style={{ accentColor: '#C97B7B' }} />
                    Remember Me
                  </label>
                  <button type="submit" className="neon-btn" disabled={loading}>{loading && <span className="neon-btn-spinner" />}{loading ? 'Logging in...' : 'Login'}</button>
                  <div className="neon-switch">Don't have an account? <button type="button" onClick={() => { setTab('signup'); setErrors({}) }}>Sign Up</button></div>

                  <div className="neon-divider">Or continue with</div>
                  <div className="neon-social-row">
                    <button type="button" className="neon-social-btn" onClick={() => { setErrors({}); setMode('phone-enter') }}>
                      <PhoneIcon /> Phone
                    </button>
                    {googleClientId ? (
                      <div className="neon-google-wrap">
                        <GoogleOAuthProvider clientId={googleClientId}>
                          <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => showToast('Google sign-in failed', 'error')} type="icon" shape="circle" size="medium" />
                        </GoogleOAuthProvider>
                      </div>
                    ) : (
                      <div className="neon-google-disabled">Google not configured</div>
                    )}
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSignup} key="signup" className="neon-anim">
                  <h2 className="neon-heading">Sign Up</h2>
                  <Field label="Full Name" name="name" icon={<UserIcon />} placeholder="Your full name" value={signupForm.name} onChange={e => setSignupForm(f => ({ ...f, name: e.target.value }))} error={errors.name} />
                  <Field label="Email" name="email" type="email" icon={<MailIcon />} placeholder="you@example.com" value={signupForm.email} onChange={e => setSignupForm(f => ({ ...f, email: e.target.value }))} error={errors.email} />
                  <Field label="Phone Number" name="phone" icon={<PhoneIcon />} placeholder="03XX-XXXXXXX" value={signupForm.phone} onChange={e => setSignupForm(f => ({ ...f, phone: e.target.value }))} error={errors.phone} />
                  <PasswordField label="Password" name="password" placeholder="At least 6 characters" value={signupForm.password} onChange={e => setSignupForm(f => ({ ...f, password: e.target.value }))} error={errors.password} />
                  <PasswordField label="Confirm Password" name="confirm" placeholder="Re-enter your password" value={signupForm.confirm} onChange={e => setSignupForm(f => ({ ...f, confirm: e.target.value }))} error={errors.confirm} />
                  <button type="submit" className="neon-btn" disabled={loading}>{loading && <span className="neon-btn-spinner" />}{loading ? 'Creating...' : 'Sign Up'}</button>
                  <div className="neon-switch">Already have an account? <button type="button" onClick={() => { setTab('login'); setErrors({}) }}>Login</button></div>

                  <div className="neon-divider">Or sign up with</div>
                  <div className="neon-social-row">
                    <button type="button" className="neon-social-btn" onClick={() => { setErrors({}); setMode('phone-enter') }}>
                      <PhoneIcon /> Phone
                    </button>
                    {googleClientId ? (
                      <div className="neon-google-wrap">
                        <GoogleOAuthProvider clientId={googleClientId}>
                          <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => showToast('Google sign-in failed', 'error')} type="icon" shape="circle" size="medium" />
                        </GoogleOAuthProvider>
                      </div>
                    ) : (
                      <div className="neon-google-disabled">Google not configured</div>
                    )}
                  </div>
                </form>
              )}
            </>
          ) : mode === 'phone-enter' ? (
            <form onSubmit={handleSendOtp} key="phone-enter" className="neon-anim">
              <button type="button" className="neon-back" onClick={() => setMode('email')}>← Back</button>
              <h2 className="neon-heading">Log in with Phone</h2>
              <Field label="Phone Number" name="phone" type="tel" icon={<PhoneIcon />} placeholder="03XX-XXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} error={errors.phone} />
              <Field label="Your Name (optional)" name="phoneName" icon={<UserIcon />} placeholder="Only needed for a new account" value={phoneName} onChange={e => setPhoneName(e.target.value)} />
              <button type="submit" className="neon-btn" disabled={loading}>{loading && <span className="neon-btn-spinner" />}{loading ? 'Sending...' : 'Send Code'}</button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} key="phone-verify" className="neon-anim">
              <button type="button" className="neon-back" onClick={() => setMode('phone-enter')}>← Change number</button>
              <h2 className="neon-heading">Enter Code</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginTop: -14, marginBottom: 6 }}>Sent to <strong style={{ color: '#fdf6f0' }}>{phone}</strong></p>
              <OtpBoxes value={otp} onChange={setOtp} shake={otpShake} />
              {errors.otp && <div className="neon-error-text" style={{ marginBottom: 12 }}>{errors.otp}</div>}
              <button type="submit" className="neon-btn" disabled={loading || otp.length !== 6}>{loading && <span className="neon-btn-spinner" />}{loading ? 'Verifying...' : 'Verify & Continue'}</button>
              <div className="neon-resend">
                {cooldown > 0 ? <span>Resend code in {cooldown}s</span> : <button type="button" onClick={handleResendOtp}>Resend code</button>}
              </div>
            </form>
          )}
        </div>

        <div className="neon-welcome-side" key={welcome.key}>
          <h3 className="neon-welcome-title">{welcome.title}</h3>
          <p className="neon-welcome-sub">{welcome.sub}</p>
        </div>
      </div>
    </div>
  )
}
