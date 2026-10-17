// src/pages/auth/RegisterPage.tsx
// Halaman Pendaftaran Akun Skincluv (100% Cluv Micro-Framework)

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
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

    try {
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
    } catch (err: any) {
      setError(err?.message || 'Gagal mendaftar akun.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleRegister = async () => {
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
        setError(`Gagal daftar via Google: ${error.message}`)
        setGoogleLoading(false)
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal terhubung ke Google Auth.')
      setGoogleLoading(false)
    }
  }

  if (registered) {
    return (
      <div className="cluv-flex-col cluv-items-center cluv-text-center cluv-py-4">
        <div className="cluv-card-icon-wrap is-teal cluv-mb-3">
          <CheckCircle2 size={28} className="cluv-text-teal" />
        </div>
        <h1 className="cluv-title-section cluv-mb-2">Akun Berhasil Dibuat</h1>
        <p className="cluv-body cluv-mb-5">
          Kami telah mengirimkan tautan konfirmasi ke <strong>{email}</strong>. Silakan periksa kotak masuk atau folder spam Anda untuk mengaktifkan akun.
        </p>
        <Link to="/login" className="cluv-btn is-primary is-block is-md">
          Masuk Sekarang
        </Link>
      </div>
    )
  }

  return (
    <div className="cluv-flex-col">
      {/* EDITORIAL HEADER */}
      <div className="cluv-mb-4">
        <h1 className="cluv-title-section cluv-mb-1">
          Mulai Cerita Kulitmu
        </h1>
        <p className="cluv-subtitle">
          Daftar gratis untuk mulai membaca formula skincare dan memahami kondisi kulitmu tanpa rasa cemas.
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

      {/* GOOGLE ACTION */}
      <button
        onClick={handleGoogleRegister}
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
        <span>Daftar dengan Google</span>
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

      {/* FORM FIELDS */}
      <form onSubmit={handleRegister} className="cluv-flex-col cluv-gap-4">
        <div className="cluv-field">
          <label className="cluv-label">Nama Lengkap</label>
          <div className="cluv-input-wrap has-leading-icon">
            <User size={16} className="cluv-input-icon is-leading" />
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nama lengkap Anda"
              className="cluv-input"
              required
            />
          </div>
        </div>

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
          <label className="cluv-label">Password</label>
          <div className="cluv-input-wrap has-leading-icon has-trailing-icon">
            <Lock size={16} className="cluv-input-icon is-leading" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
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
          {isLoading ? <Loader2 size={16} className="cluv-animate-spin" /> : 'Buat Akun Baru'}
        </button>
      </form>

      {/* LOGIN LINK */}
      <p className="cluv-caption cluv-text-center cluv-mt-4">
        Sudah punya akun?{' '}
        <Link to="/login" className="cluv-link">
          Masuk di sini
        </Link>
      </p>

      {/* LEGAL DISCLAIMER FOOTER */}
      <p className="cluv-micro cluv-text-center cluv-text-muted cluv-mt-3">
        Dengan mendaftar, Anda menyetujui{' '}
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
