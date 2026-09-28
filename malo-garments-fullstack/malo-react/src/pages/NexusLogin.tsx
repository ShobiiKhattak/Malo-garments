import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { loginUser } from '../services/api'
import { showToast } from '../components/ui/Toast'
import AnimatedLoginCard from '../components/ui/AnimatedLoginCard'

/**
 * NexusLogin — dark, animated sign-in page built on <AnimatedLoginCard />.
 * Wired to the real auth API (loginUser) and AuthContext.
 */
export default function NexusLogin() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { loginUser: loginCtx } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (email: string, password: string, keepSession: boolean) => {
    setError('')
    setLoading(true)
    try {
      const r = await loginUser({ email, password })
      loginCtx(r.user, r.token)
      if (keepSession) localStorage.setItem('malo_keep_session', 'true')
      else localStorage.removeItem('malo_keep_session')
      showToast(`Welcome back, ${r.user.name}!`, 'success')
      navigate('/account')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatedLoginCard
      onSubmit={handleSubmit}
      loading={loading}
      error={error || undefined}
      onForgot={() => showToast('Password reset link sent to your email.', 'info')}
      onSignUp={() => navigate('/login')}
    />
  )
}