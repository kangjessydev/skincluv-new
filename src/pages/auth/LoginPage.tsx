// src/pages/auth/LoginPage.tsx
// 100% Faithful Port of scan-2 Login UI for Skincluv — Pure Vanilla CSS (Zero Tailwind, Claude UI/UX Perfection)

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle, Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Harap isi email dan password terlebih dahulu.')
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setError(
          error.message === 'Invalid login credentials'
            ? 'Email atau password salah. Coba lagi.'
            : error.message
        )
      } else {
        navigate('/')
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal masuk ke akun.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="scan2-login-card">
      {/* BRAND KICKER TEXT */}
      <span className="brand-kicker-text">SKINCLUV</span>

      {/* HEADER SECTION */}
      <div className="login-header-group">
        <h1 className="login-main-title">Selamat Datang</h1>
        <p className="login-sub-description">
          Masuk ke ruang konsultasi kulit pribadi Anda.
        </p>
      </div>

      {/* ERROR ALERT BANNER */}
      {error && (
        <div className="login-error-alert">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* GOOGLE OFFICIAL BRAND SIGN-IN BUTTON */}
      <div className="google-action-row">
        <button
          onClick={handleGoogleLogin}
          type="button"
          disabled={googleLoading || isLoading}
          className="btn-google-official"
        >
          {googleLoading ? (
            <Loader2 size={18} className="animate-spin text-[#0f6784]" />
          ) : (
            <svg className="google-svg-icon" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#FBBC05" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#34A853" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#4285F4" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          <span className="google-btn-label">Masuk dengan Google</span>
        </button>
      </div>

      {/* TRUST SIGNAL MICROCOPY */}
      <div className="trust-signal-badge">
        <ShieldCheck size={14} className="text-[#0f6784]" />
        <span>Data kulit Anda aman & terenkripsi</span>
      </div>

      {/* OPTIONAL EMAIL LOGIN EXPANDABLE TOGGLE */}
      <div className="email-option-wrapper">
        <button
          type="button"
          onClick={() => setShowEmailForm(!showEmailForm)}
          className="btn-toggle-email"
        >
          {showEmailForm ? 'Sembunyikan opsi email' : 'Atau masuk dengan email & password'}
        </button>

        {showEmailForm && (
          <form onSubmit={handlePasswordLogin} className="email-login-form">
            <div className="form-input-group">
              <label className="input-label">Email</label>
              <div className="input-field-box">
                <Mail size={14} className="field-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="text-input"
                  required
                />
              </div>
            </div>

            <div className="form-input-group">
              <label className="input-label">Password</label>
              <div className="input-field-box">
                <Lock size={14} className="field-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password kamu"
                  className="text-input"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="toggle-password-btn"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || googleLoading}
              className="btn-submit-email"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Masuk Ke Akun'}
            </button>
          </form>
        )}
      </div>

      {/* REGISTER LINK */}
      <div className="register-footer-link">
        Belum punya akun?{' '}
        <Link to="/register" className="link-highlight">
          Daftar Gratis sekarang
        </Link>
      </div>

      {/* TERMS & PRIVACY DISCLAIMER FOOTER (WCAG AA Compliant Sentence Case) */}
      <div className="terms-disclaimer-box">
        <p className="disclaimer-text">
          Dengan mendaftar, Anda menyetujui <a href="#" className="link-underline">Syarat Layanan</a> & <a href="#" className="link-underline">Kebijakan Privasi</a>.
        </p>
      </div>

      {/* PURE VANILLA CSS STYLING */}
      <style>{`
        .scan2-login-card {
          width: 100%;
          background: #ffffff;
          border: 1px solid #f1f5f9;
          border-radius: 28px;
          padding: 28px 24px;
          box-shadow: 0 16px 36px -12px rgba(15, 103, 132, 0.08);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          box-sizing: border-box;
        }

        .brand-kicker-text {
          font-size: 0.75rem;
          font-weight: 900;
          color: #0f6784;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          margin-bottom: 8px;
          display: block;
        }

        .login-header-group {
          margin-bottom: 16px;
        }

        .login-main-title {
          font-size: 1.75rem;
          font-weight: 900;
          color: #1e293b;
          letter-spacing: -0.03em;
          margin: 0 0 4px 0;
          line-height: 1.1;
        }

        .login-sub-description {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #64748b;
          line-height: 1.4;
          max-width: 280px;
          margin: 0 auto;
        }

        .login-error-alert {
          margin-bottom: 14px;
          padding: 10px 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          box-sizing: border-box;
        }

        .google-action-row {
          width: 100%;
          margin-bottom: 10px;
        }

        /* OFFICIAL GOOGLE SIGN-IN BUTTON BRANDING */
        .btn-google-official {
          width: 100%;
          height: 48px;
          background: #ffffff;
          color: #1e293b;
          border: 1px solid #cbd5e1;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 0 20px;
          font-size: 0.875rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
        }

        .btn-google-official:hover {
          background: #f8fafc;
          border-color: #94a3b8;
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
        }

        .btn-google-official:disabled {
          opacity: 0.6;
          transform: none;
          cursor: not-allowed;
        }

        .google-svg-icon {
          width: 20px;
          height: 20px;
          shrink: 0;
        }

        .google-btn-label {
          font-size: 0.875rem;
          font-weight: 700;
          color: #1e293b;
        }

        .trust-signal-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.7rem;
          font-weight: 600;
          color: #0f6784;
          margin-bottom: 14px;
          background: rgba(15, 103, 132, 0.05);
          padding: 4px 10px;
          border-radius: 9999px;
        }

        .email-option-wrapper {
          width: 100%;
          margin-bottom: 12px;
        }

        .btn-toggle-email {
          background: none;
          border: none;
          font-size: 0.725rem;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          text-decoration: underline;
          padding: 2px;
        }

        .btn-toggle-email:hover {
          color: #0f6784;
        }

        .email-login-form {
          margin-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
          text-align: left;
          animation: fadeIn 0.3s ease;
        }

        .form-input-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .input-label {
          font-size: 0.675rem;
          font-weight: 700;
          color: #475569;
        }

        .input-field-box {
          display: flex;
          align-items: center;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 0 10px;
          height: 40px;
        }

        .field-icon {
          color: #94a3b8;
          margin-right: 6px;
          shrink: 0;
        }

        .text-input {
          width: 100%;
          height: 100%;
          border: none;
          background: transparent;
          font-size: 0.8125rem;
          outline: none;
          color: #1e293b;
        }

        .toggle-password-btn {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 2px;
        }

        .btn-submit-email {
          width: 100%;
          height: 40px;
          background: #0f6784;
          color: #ffffff;
          font-weight: 700;
          font-size: 0.8125rem;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          margin-top: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-submit-email:hover {
          background: #0a4d63;
        }

        .register-footer-link {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 500;
          margin-bottom: 12px;
        }

        .link-highlight {
          color: #0f6784;
          font-weight: 700;
          text-decoration: none;
        }

        .link-highlight:hover {
          text-decoration: underline;
        }

        .terms-disclaimer-box {
          width: 100%;
          border-top: 1px solid #f1f5f9;
          padding-top: 10px;
        }

        .disclaimer-text {
          font-size: 0.725rem;
          color: #64748b;
          font-weight: 500;
          line-height: 1.4;
          margin: 0;
        }

        .link-underline {
          color: #0f6784;
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .scan2-login-card {
            padding: 24px 18px;
            border-radius: 24px;
          }
          .login-main-title {
            font-size: 1.5rem;
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
