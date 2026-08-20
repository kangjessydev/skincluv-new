import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registered, setRegistered] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password minimal 8 karakter.')
      return
    }

    setIsLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setRegistered(true)
    }
    setIsLoading(false)
  }

  const handleGoogleRegister = async () => {
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

  if (registered) {
    return (
      <div className="auth-success animate-fade-in">
        <div className="auth-success-icon">🎉</div>
        <h2>Akun berhasil dibuat!</h2>
        <p>
          Cek email kamu di <strong>{email}</strong> untuk konfirmasi akun.
          Setelah dikonfirmasi, kamu bisa langsung masuk.
        </p>
        <Link to="/login" className="btn btn-primary">
          Masuk Sekarang
        </Link>
      </div>
    )
  }

  return (
    <div className="register-form">
      <div className="auth-form-header">
        <h2>Buat Akun</h2>
        <p className="auth-form-subtitle">Mulai perjalanan kulit sehat kamu</p>
      </div>

      {error && (
        <div className="auth-error animate-fade-in">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Google 1-Click Register Button */}
      <button
        type="button"
        className="btn btn-outline btn-block btn-google-auth"
        onClick={handleGoogleRegister}
      >
        <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
        <span>Daftar dengan Google</span>
      </button>

      <div className="auth-divider">
        <span>atau dengan email</span>
      </div>

      <form onSubmit={handleRegister} className="auth-form">
        <div className="form-group">
          <label htmlFor="fullName" className="label">Nama Lengkap</label>
          <div className="input-wrapper">
            <User size={18} className="input-icon" />
            <input
              id="fullName"
              type="text"
              className="input input-with-icon"
              placeholder="Nama kamu"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
        </div>

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

        <div className="form-group">
          <label htmlFor="password" className="label">Password</label>
          <div className="input-wrapper">
            <Lock size={18} className="input-icon" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className="input input-with-icon input-with-icon-right"
              placeholder="Minimal 8 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
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

        <button
          type="submit"
          className="btn btn-primary btn-block btn-lg"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Daftar Akun'}
        </button>
      </form>

      <p className="auth-footer-text">
        Sudah punya akun?{' '}
        <Link to="/login">Masuk di sini</Link>
      </p>

      <style>{`
        .register-form {
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
