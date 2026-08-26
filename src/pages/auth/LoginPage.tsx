// src/pages/auth/LoginPage.tsx
// 100% Faithful Port of Claude's Form Side UI — Pure Vanilla CSS

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle, Mail, Lock, Eye, EyeOff } from 'lucide-react'
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
    <div className="login-form-container">
      {/* KEMBALI LINK */}
      <Link to="/" className="kembali">
        &#8592; Kembali
      </Link>

      {/* HEADER GROUP */}
      <div className="group">
        <div className="eyebrow">SKINCLUV</div>
        <h1>Selamat datang</h1>
        <p className="sub">Masuk ke ruang konsultasi kulit pribadi Anda.</p>
      </div>

      {/* ERROR ALERT BANNER */}
      {error && (
        <div className="login-error-alert">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* GOOGLE ACTION GROUP */}
      <div className="group">
        <button
          onClick={handleGoogleLogin}
          type="button"
          disabled={googleLoading || isLoading}
          className="btn-google"
        >
          {googleLoading ? (
            <Loader2 size={18} className="animate-spin text-[#0B4F5C]" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.87 2.7-6.62z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z" />
              <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33z" />
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
            </svg>
          )}
          <span>Masuk dengan Google</span>
        </button>

        <div className="trust">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          <span>Data kulit Anda aman dan terenkripsi</span>
        </div>
      </div>

      {/* EMAIL EXPANDABLE TOGGLE */}
      <button
        type="button"
        onClick={() => setShowEmailForm(!showEmailForm)}
        className="email-link"
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

      {/* REGISTER LINK */}
      <p className="link-row">
        Belum punya akun? <Link to="/register">Daftar gratis sekarang</Link>
      </p>

      {/* LEGAL DISCLAIMER FOOTER */}
      <p className="legal">
        Dengan mendaftar, Anda menyetujui <a href="#">Syarat Layanan</a> dan <a href="#">Kebijakan Privasi</a>.
      </p>

      {/* PURE VANILLA CSS STYLING FROM CLAUDE */}
      <style>{`
        .login-form-container {
          width: 100%;
          display: flex;
          flex-direction: column;
        }

        .kembali {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: var(--teal-800, #0B4F5C);
          text-decoration: none;
          margin-bottom: 32px;
          width: fit-content;
          transition: opacity 0.2s ease;
        }

        .kembali:hover {
          opacity: 0.75;
        }

        .group {
          margin-bottom: 24px;
        }

        .eyebrow {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.12em;
          color: var(--teal-700, #126575);
          margin-bottom: 8px;
          text-transform: uppercase;
        }

        h1 {
          font-family: 'Fraunces', serif;
          font-size: 32px;
          font-weight: 500;
          line-height: 1.2;
          color: var(--ink, #1A2B2B);
          margin: 0 0 8px 0;
        }

        .sub {
          font-size: 15px;
          color: var(--ink-soft, #5C6B6B);
          line-height: 1.5;
          margin: 0;
        }

        .login-error-alert {
          margin-bottom: 20px;
          padding: 10px 14px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-google {
          width: 100%;
          height: 52px;
          border-radius: 12px;
          border: 1px solid var(--line, rgba(10, 62, 72, 0.12));
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 15px;
          font-weight: 600;
          color: var(--ink, #1A2B2B);
          cursor: pointer;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .btn-google:hover {
          border-color: var(--teal-700, #126575);
          box-shadow: 0 0 0 3px rgba(11, 79, 92, 0.08);
        }

        .btn-google:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .trust {
          margin-top: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 500;
          color: var(--teal-800, #0B4F5C);
          background: var(--teal-100, #DCEEEA);
          border-radius: 10px;
          padding: 9px 12px;
        }

        .email-link {
          display: block;
          text-align: center;
          font-size: 14px;
          color: var(--ink-soft, #5C6B6B);
          text-decoration: underline;
          margin-bottom: 20px;
          background: none;
          border: none;
          cursor: pointer;
          width: 100%;
        }

        .email-link:hover {
          color: var(--teal-800, #0B4F5C);
        }

        .email-login-form {
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
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
          font-size: 12px;
          font-weight: 600;
          color: var(--ink-soft, #5C6B6B);
        }

        .input-field-box {
          display: flex;
          align-items: center;
          background: #f8fafc;
          border: 1px solid var(--line, rgba(10, 62, 72, 0.12));
          border-radius: 10px;
          padding: 0 12px;
          height: 44px;
        }

        .field-icon {
          color: var(--ink-soft, #5C6B6B);
          margin-right: 8px;
          shrink: 0;
        }

        .text-input {
          width: 100%;
          height: 100%;
          border: none;
          background: transparent;
          font-size: 14px;
          outline: none;
          color: var(--ink, #1A2B2B);
        }

        .toggle-password-btn {
          background: none;
          border: none;
          color: var(--ink-soft, #5C6B6B);
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 4px;
        }

        .btn-submit-email {
          width: 100%;
          height: 44px;
          background: var(--teal-800, #0B4F5C);
          color: #ffffff;
          font-weight: 600;
          font-size: 14px;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          margin-top: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-submit-email:hover {
          background: var(--teal-900, #0A3E48);
        }

        .link-row {
          text-align: center;
          font-size: 14px;
          color: var(--ink-soft, #5C6B6B);
          margin: 0 0 20px 0;
        }

        .link-row a {
          color: var(--teal-800, #0B4F5C);
          font-weight: 600;
          text-decoration: none;
        }

        .link-row a:hover {
          text-decoration: underline;
        }

        .legal {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid var(--line, rgba(10, 62, 72, 0.12));
          font-size: 12.5px;
          line-height: 1.6;
          color: var(--ink-soft, #5C6B6B);
          text-align: center;
        }

        .legal a {
          color: var(--teal-800, #0B4F5C);
          font-weight: 500;
          text-decoration: none;
        }

        .legal a:hover {
          text-decoration: underline;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
