// src/pages/auth/LoginPage.tsx
// Halaman Masuk Akun Skincluv (100% Cluv Micro-Framework)

import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Loader2, AlertCircle, Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string })?.from || '/dashboard'
  const { user, isLoading: isAuthLoading } = useAuthStore()

  useEffect(() => {
    if (user && !isAuthLoading) {
      navigate(from === '/' ? '/dashboard' : from, { replace: true })
    }
  }, [user, isAuthLoading, from, navigate])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError(null)

    try {
      const origin = window.location.origin
      const redirectTarget = from === '/' || from === '/dashboard' ? `${origin}/dashboard` : `${origin}${from}`
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
        navigate(from === '/' ? '/dashboard' : from, { replace: true })
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal masuk ke akun.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="cluv-flex-col">
      {/* EDITORIAL HEADER */}
      <div className="cluv-mb-4">
        <h1 className="cluv-title-section cluv-mb-1">
          Selamat Datang Kembali
        </h1>
        <p className="cluv-subtitle">
          Masuk untuk melanjutkan perjalanan merawat kulit harianmu.
        </p>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div className="cluv-alert is-danger cluv-mb-4">
          <AlertCircle size={16} className="cluv-alert-icon" />
          <div className="cluv-alert-content">
            <span className="cluv-alert-message">{error}</span>
          </div>
        </div>
      )}

      {/* GOOGLE ONE-CLICK ACTION */}
      <button
        onClick={handleGoogleLogin}
        type="button"
        disabled={googleLoading || isLoading}
        className="cluv-btn is-outline is-block is-md"
      >
        {googleLoading ? (
          <Loader2 size={16} className="cluv-animate-spin cluv-text-teal" />
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

      {/* PRIVACY TRUST STRIP */}
      <div className="cluv-trust-strip is-left cluv-my-2">
        <span className="cluv-trust-item">
          <ShieldCheck size={13} className="cluv-trust-icon cluv-text-teal" />
          <span className="cluv-micro">Privasi fotomu terlindungi penuh (UU PDP)</span>
        </span>
      </div>

      {/* DIVIDER */}
      <div className="cluv-divider has-text is-compact">
        <span className="cluv-divider-label">atau dengan email</span>
      </div>

      {/* EMAIL & PASSWORD LOGIN FORM */}
      <form onSubmit={handlePasswordLogin} className="cluv-flex-col cluv-gap-4">
        <div className="cluv-field">
          <label className="cluv-label">Email</label>
          <div className="cluv-input-wrap has-leading-icon">
            <Mail size={16} className="cluv-input-icon is-leading" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="cluv-input"
              required
            />
          </div>
        </div>

        <div className="cluv-field">
          <div className="cluv-flex-between cluv-items-center">
            <label className="cluv-label">Password</label>
            <Link to="/forgot-password" className="cluv-link cluv-caption">
              Lupa kata sandi?
            </Link>
          </div>
          <div className="cluv-input-wrap has-leading-icon has-trailing-icon">
            <Lock size={16} className="cluv-input-icon is-leading" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password kamu"
              className="cluv-input"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="cluv-input-icon is-trailing"
              aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || googleLoading}
          className="cluv-btn is-primary is-block is-md cluv-mt-2"
        >
          {isLoading ? <Loader2 size={16} className="cluv-animate-spin" /> : 'Masuk Ke Akun'}
        </button>
      </form>

      {/* REGISTER LINK */}
      <p className="cluv-caption cluv-text-center cluv-mt-4">
        Belum punya akun?{' '}
        <Link to="/register" className="cluv-link">
          Daftar gratis sekarang
        </Link>
      </p>

      {/* LEGAL DISCLAIMER FOOTER */}
      <p className="cluv-micro cluv-text-center cluv-text-muted cluv-mt-3">
        Dengan mendaftar atau masuk, Anda menyetujui{' '}
        <Link to="/terms" className="cluv-link is-muted is-underline">
          Syarat Layanan
        </Link>{' '}
        dan{' '}
        <Link to="/privacy" className="cluv-link is-muted is-underline">
          Kebijakan Privasi
        </Link>
        .
      </p>
    </div>
  )
}
