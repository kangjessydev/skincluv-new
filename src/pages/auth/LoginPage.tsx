// src/pages/auth/LoginPage.tsx
// 100% Faithful Port of Claude's Form Side UI — Pure Vanilla CSS

import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Loader2, AlertCircle, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string })?.from || '/'
  const { user, isLoading: isAuthLoading } = useAuthStore()

  useEffect(() => {
    if (user && !isAuthLoading) {
      navigate(from, { replace: true })
    }
  }, [user, isAuthLoading, from, navigate])

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
      const redirectTarget = from === '/' ? `${origin}/` : `${origin}${from}`
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTarget,
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
        navigate(from, { replace: true })
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
            <Loader2 size={18} className="animate-spin text-primary" />
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
            <div className="label-with-link">
              <label className="input-label">Password</label>
              <Link to="/forgot-password" className="forgot-password-link">
                Lupa kata sandi?
              </Link>
            </div>
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
        Dengan mendaftar atau masuk, Anda menyetujui <Link to="/terms">Syarat Layanan</Link> dan <Link to="/privacy">Kebijakan Privasi</Link>.
      </p>
    </div>
  )
}
