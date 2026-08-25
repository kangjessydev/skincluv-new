import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Loader2, Sparkles, KeyRound, Send, AlertCircle, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

/**
 * LoginPage — Ported 100% faithfully from scan-2 UI design.
 * Pure vector icons only (no emojis).
 */
export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isMagicLink, setIsMagicLink] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'Email atau password salah. Coba lagi.'
          : error.message
      )
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
    setGoogleLoading(true)
    setError(null)
    try {
      const origin = window.location.origin
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/`,
        },
      })
      if (error) {
        setError(`Gagal login via Google: ${error.message}`)
        setGoogleLoading(false)
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal terhubung ke Google Auth.')
      setGoogleLoading(false)
    }
  }

  if (magicLinkSent) {
    return (
      <div className="auth-success-box">
        <div className="auth-success-icon-badge">
          <CheckCircle2 size={36} className="text-emerald-500" />
        </div>
        <h2 className="auth-success-title">Cek email kamu</h2>
        <p className="auth-success-desc">
          Kami kirimkan link masuk langsung ke email <strong>{email}</strong>. Klik link tersebut untuk masuk tanpa password.
        </p>
        <button
          className="auth-btn-ghost"
          onClick={() => {
            setMagicLinkSent(false)
            setEmail('')
          }}
        >
          Kirim Ulang Email
        </button>
      </div>
    )
  }

  return (
    <div className="login-card-content">
      {/* HEADER TITLE */}
      <div className="login-header">
        <h2 className="login-title">
          {isMagicLink ? 'Masuk dengan Magic Link' : 'Selamat Datang Kembali'}
        </h2>
        <p className="login-subtitle">
          {isMagicLink
            ? 'Kami kirimkan link verifikasi instan ke email kamu'
            : 'Masuk ke ruang konsultasi kulit pribadi Anda secara instan'}
        </p>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div className="auth-alert-error">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* GOOGLE OAUTH BUTTON (SCAN-2 STYLING) */}
      <div className="google-btn-container">
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading || isLoading}
          className="google-oauth-btn"
        >
          <div className="google-icon-wrapper">
            {googleLoading ? (
              <Loader2 size={18} className="animate-spin text-[#0f6784]" />
            ) : (
              <svg className="google-svg" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#FBBC05" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#34A853" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#4285F4" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
          </div>
          <span className="google-btn-text">Masuk dengan Google</span>
        </button>
      </div>

      {/* DIVIDER */}
      <div className="auth-divider">
        <span>atau masuk dengan email</span>
      </div>

      {/* FORM */}
      <form onSubmit={isMagicLink ? handleMagicLink : handlePasswordLogin} className="auth-form-stack">
        <div className="form-field">
          <label className="field-label">Email</label>
          <div className="input-pill">
            <Mail size={18} className="field-icon" />
            <input
              type="email"
              className="field-input"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
        </div>

        {!isMagicLink && (
          <div className="form-field">
            <label className="field-label">Password</label>
            <div className="input-pill">
              <Lock size={18} className="field-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="field-input field-input-right"
                placeholder="Masukkan password kamu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-password-btn"
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
          className="submit-pill-btn"
          disabled={isLoading || googleLoading}
        >
          {isLoading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : isMagicLink ? (
            <>
              <Send size={18} />
              <span>Kirim Magic Link</span>
            </>
          ) : (
            'Masuk Ke Akun'
          )}
        </button>
      </form>

      {/* MAGIC LINK TOGGLE */}
      <button
        type="button"
        className="magic-link-toggle-btn"
        onClick={() => {
          setIsMagicLink(!isMagicLink)
          setError(null)
        }}
      >
        {isMagicLink ? (
          <>
            <KeyRound size={16} /> <span>Masuk dengan Password biasa</span>
          </>
        ) : (
          <>
            <Sparkles size={16} /> <span>Masuk tanpa Password (Magic Link)</span>
          </>
        )}
      </button>

      {/* FOOTER TEXT */}
      <p className="auth-footer">
        Belum punya akun?{' '}
        <Link to="/register" className="auth-footer-link">
          Daftar Gratis sekarang
        </Link>
      </p>

      <style>{`
        .login-card-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .login-header {
          text-align: center;
        }

        .login-title {
          font-size: 1.5rem;
          font-weight: 900;
          color: #1e293b;
          margin: 0 0 6px 0;
          letter-spacing: -0.02em;
        }

        .login-subtitle {
          font-size: 0.85rem;
          color: #64748b;
          margin: 0;
          line-height: 1.4;
        }

        .auth-alert-error {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 16px;
          color: #dc2626;
          font-size: 0.825rem;
          font-weight: 600;
        }

        .google-btn-container {
          width: 100%;
        }

        .google-oauth-btn {
          width: 100%;
          height: 52px;
          background: #0f6784;
          border: none;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 10px 20px -5px rgba(15, 103, 132, 0.25);
          padding-left: 56px;
          padding-right: 20px;
        }

        .google-oauth-btn:hover:not(:disabled) {
          background: #0a4d63;
          transform: translateY(-1px);
        }

        .google-oauth-btn:active:not(:disabled) {
          transform: scale(0.98);
        }

        .google-oauth-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .google-icon-wrapper {
          position: absolute;
          left: 6px;
          top: 6px;
          bottom: 6px;
          width: 40px;
          background: #ffffff;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .google-svg {
          width: 20px;
          height: 20px;
        }

        .google-btn-text {
          color: #ffffff;
          font-size: 0.85rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          width: 100%;
          text-align: center;
        }

        .auth-divider {
          display: flex;
          align-items: center;
          text-align: center;
          color: #94a3b8;
          font-size: 0.75rem;
          font-weight: 600;
          margin: 2px 0;
        }

        .auth-divider::before,
        .auth-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid #e2e8f0;
        }

        .auth-divider span {
          padding: 0 12px;
        }

        .auth-form-stack {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field-label {
          font-size: 0.775rem;
          font-weight: 800;
          color: #334155;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .input-pill {
          position: relative;
          display: flex;
          align-items: center;
        }

        .field-icon {
          position: absolute;
          left: 16px;
          color: #94a3b8;
          pointer-events: none;
        }

        .field-input {
          width: 100%;
          height: 48px;
          padding-left: 46px;
          padding-right: 16px;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 9999px;
          font-size: 0.875rem;
          color: #1e293b;
          transition: all 0.2s ease;
          outline: none;
        }

        .field-input-right {
          padding-right: 48px;
        }

        .field-input:focus {
          background: #ffffff;
          border-color: #0f6784;
          box-shadow: 0 0 0 4px rgba(15, 103, 132, 0.1);
        }

        .toggle-password-btn {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
        }

        .toggle-password-btn:hover {
          color: #0f6784;
        }

        .submit-pill-btn {
          width: 100%;
          height: 48px;
          background: #0f6784;
          color: #ffffff;
          border: none;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 6px;
          box-shadow: 0 8px 16px -4px rgba(15, 103, 132, 0.25);
        }

        .submit-pill-btn:hover:not(:disabled) {
          background: #0a4d63;
          transform: translateY(-1px);
        }

        .submit-pill-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .magic-link-toggle-btn {
          background: none;
          border: 1px dashed #cbd5e1;
          border-radius: 9999px;
          padding: 10px;
          font-size: 0.775rem;
          font-weight: 700;
          color: #475569;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .magic-link-toggle-btn:hover {
          border-color: #0f6784;
          color: #0f6784;
          background: #f0f9ff;
        }

        .auth-footer {
          text-align: center;
          font-size: 0.825rem;
          color: #64748b;
          margin: 0;
        }

        .auth-footer-link {
          color: #0f6784;
          font-weight: 800;
          text-decoration: none;
        }

        .auth-footer-link:hover {
          text-decoration: underline;
        }

        .auth-success-box {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
        }

        .auth-success-icon-badge {
          width: 64px;
          height: 64px;
          border-radius: 20px;
          background: #ecfdf5;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
        }

        .auth-success-title {
          font-size: 1.25rem;
          font-weight: 900;
          color: #1e293b;
          margin: 0;
        }

        .auth-success-desc {
          font-size: 0.85rem;
          color: #64748b;
          line-height: 1.5;
          margin: 0;
        }

        .auth-btn-ghost {
          background: #f1f5f9;
          color: #334155;
          border: none;
          border-radius: 9999px;
          padding: 10px 24px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          margin-top: 8px;
        }

        .auth-btn-ghost:hover {
          background: #e2e8f0;
        }
      `}</style>
    </div>
  )
}
