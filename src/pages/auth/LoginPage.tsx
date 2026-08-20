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

  const handleGoogleLogin = async () => {
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    })
    if (error) {
      setError(error.message)
    }
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
            ? 'Kami kirimkan link langsung ke email kamu'
            : 'Masuk ke akun Skincluv kamu'}
        </p>
      </div>

      {error && (
        <div className="auth-error animate-fade-in">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Google 1-Click Login Button */}
      <button
        type="button"
        className="btn btn-outline btn-block btn-google-auth"
        onClick={handleGoogleLogin}
      >
        <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
        <span>Masuk dengan Google</span>
      </button>

      <div className="auth-divider">
        <span>atau dengan email</span>
      </div>

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

      <button
        className="btn btn-ghost btn-block btn-sm"
        onClick={() => { setIsMagicLink(!isMagicLink); setError(null) }}
      >
        {isMagicLink ? '🔑 Masuk dengan Password' : '✨ Masuk dengan Magic Link'}
      </button>

      <p className="auth-footer-text">
        Belum punya akun?{' '}
        <Link to="/register">Daftar sekarang</Link>
      </p>

      <style>{`
        .login-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .auth-form-header h2 {
          font-size: 1.5rem;
          margin-bottom: 4px;
        }

        .auth-form-subtitle {
          color: var(--color-text-muted);
          font-size: 0.875rem;
        }

        .btn-google-auth {
          display: flex; align-items: center; justify-content: center; gap: 10px;
          background: white; border: 1px solid var(--color-secondary-container); color: var(--color-text-main);
          font-weight: 600; font-size: 0.9375rem; padding: 12px; border-radius: var(--radius-xl);
          box-shadow: var(--shadow-sm); transition: all 0.2s;
        }
        .btn-google-auth:hover {
          background: var(--color-surface-container-low); border-color: var(--color-primary-container);
        }
        .google-icon { flex-shrink: 0; }

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
