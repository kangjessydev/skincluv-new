import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isMagicLink, setIsMagicLink] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Email atau password salah. Coba lagi.'
        : error.message)
    }
    setIsLoading(false)
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    })

    if (error) {
      setError(error.message)
    } else {
      setMagicLinkSent(true)
    }
    setIsLoading(false)
  }

  if (magicLinkSent) {
    return (
      <div className="auth-success animate-fade-in">
        <div className="auth-success-icon">📬</div>
        <h2>Cek email kamu!</h2>
        <p>Kami kirimkan magic link ke <strong>{email}</strong>. Klik link-nya untuk masuk langsung.</p>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => { setMagicLinkSent(false); setEmail('') }}
        >
          Kirim ulang
        </button>
      </div>
    )
  }

  return (
    <div className="login-form">
      <div className="auth-form-header">
        <h2>{isMagicLink ? 'Masuk dengan Magic Link' : 'Selamat Datang!'}</h2>
        <p className="auth-form-subtitle">
          {isMagicLink
            ? 'Kami kirimkan link verifikasi langsung ke email kamu'
            : 'Masuk ke akun Skincluv kamu'}
        </p>
      </div>

      {error && (
        <div className="auth-error animate-fade-in">
          <span>⚠️</span> {error}
        </div>
      )}

      <form onSubmit={isMagicLink ? handleMagicLink : handlePasswordLogin} className="auth-form">
        <div className="form-group">
          <label htmlFor="email" className="label">Email</label>
          <div className="input-wrapper">
            <Mail size={18} className="input-icon" />
            <input
              id="email"
              type="email"
              className="input input-with-icon"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
        </div>

        {!isMagicLink && (
          <div className="form-group">
            <label htmlFor="password" className="label">Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="input input-with-icon input-with-icon-right"
                placeholder="Password kamu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="input-icon-right"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-block btn-lg"
          disabled={isLoading}
        >
          {isLoading
            ? <Loader2 size={20} className="animate-spin" />
            : isMagicLink ? '✉️ Kirim Magic Link' : 'Masuk'}
        </button>
      </form>

      <div className="auth-divider">
        <span>atau</span>
      </div>

      <button
        className="btn btn-secondary btn-block"
        onClick={() => { setIsMagicLink(!isMagicLink); setError(null) }}
      >
        {isMagicLink ? '🔑 Masuk dengan Password' : '✨ Masuk Tanpa Password (Magic Link)'}
      </button>

      <p className="auth-footer-text">
        Belum punya akun?{' '}
        <Link to="/register">Daftar sekarang</Link>
      </p>

      <style>{`
        .login-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .auth-form-header h2 {
          font-size: 1.5rem;
          margin-bottom: 4px;
        }

        .auth-form-subtitle {
          color: var(--color-text-muted);
          font-size: 0.875rem;
        }

        .auth-error {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: 12px var(--space-md);
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: var(--radius-md);
          color: #fca5a5;
          font-size: 0.875rem;
        }

        .auth-success {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-md);
        }

        .auth-success-icon {
          font-size: 48px;
        }

        .auth-success h2 {
          font-size: 1.25rem;
        }

        .auth-success p {
          color: var(--color-text-muted);
          line-height: 1.5;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .auth-divider {
          display: flex;
          align-items: center;
          text-align: center;
          color: var(--color-text-muted);
          font-size: 0.75rem;
          margin: 4px 0;
        }

        .auth-divider::before,
        .auth-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid var(--color-secondary-container);
        }

        .auth-divider span {
          padding: 0 var(--space-md);
        }

        .auth-footer-text {
          text-align: center;
          font-size: 0.875rem;
          color: var(--color-text-muted);
          margin-top: 4px;
        }

        .auth-footer-text a {
          color: var(--color-primary);
          font-weight: 600;
        }
      `}</style>
    </div>
  )
}
