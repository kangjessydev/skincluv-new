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
              autoComplete="name"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="reg-email" className="label">Email</label>
          <div className="input-wrapper">
            <Mail size={18} className="input-icon" />
            <input
              id="reg-email"
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
          <label htmlFor="reg-password" className="label">Password</label>
          <div className="input-wrapper">
            <Lock size={18} className="input-icon" />
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              className="input input-with-icon input-with-icon-right"
              placeholder="Minimal 8 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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
          <div className="password-strength">
            {[4, 6, 8, 10, 12].map((len) => (
              <div
                key={len}
                className={`strength-bar ${password.length >= len ? 'strength-bar--active' : ''}`}
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block btn-lg"
          disabled={isLoading}
        >
          {isLoading
            ? <Loader2 size={20} className="animate-spin" />
            : '✨ Buat Akun Gratis'}
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
          font-size: 0.875rem;
          line-height: 1.6;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          color: var(--color-text-muted);
          pointer-events: none;
        }

        .input-with-icon {
          padding-left: 44px;
        }

        .input-with-icon-right {
          padding-right: 44px;
        }

        .input-icon-right {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 0;
        }

        .password-strength {
          display: flex;
          gap: 4px;
          margin-top: 6px;
        }

        .strength-bar {
          flex: 1;
          height: 3px;
          border-radius: var(--radius-full);
          background: var(--color-border);
          transition: background var(--transition-fast);
        }

        .strength-bar--active {
          background: var(--gradient-brand);
        }

        .auth-footer-text {
          text-align: center;
          color: var(--color-text-muted);
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  )
}
