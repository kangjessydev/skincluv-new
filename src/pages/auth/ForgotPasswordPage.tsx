// src/pages/auth/ForgotPasswordPage.tsx
// Halaman Permintaan Reset Password Resmi Supabase Auth
// Kepatuhan: Invarian 21 & Anti-Enumeration Security Checklist (ChatGPT Audit)

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError('Harap masukkan alamat email Anda.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const origin = window.location.origin
      const redirectUrl = `${origin}/auth/callback?type=recovery`

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl
      })

      if (resetError) {
        // Jangan membocorkan apakah email terdaftar atau tidak ke penyerang
        console.warn('Supabase reset error:', resetError.message)
      }

      // Selalu tampilkan status sukses generik untuk proteksi User Enumeration
      setSubmitted(true)
      setCooldown(60)

      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err: any) {
      setError('Terjadi kendala saat mengirim instruksi. Periksa koneksi Anda.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-form-panel animate-fade-in">
      <Link to="/login" className="back-link">
        <ArrowLeft size={16} /> Kembali ke Halaman Masuk
      </Link>

      <div className="auth-header-group">
        <div className="auth-eyebrow">PEMULIHAN AKUN</div>
        <h1>Lupa Kata Sandi?</h1>
        <p className="auth-sub">
          Masukkan alamat email yang terdaftar pada akun Skincluv Anda. Kami akan mengirimkan tautan pemulihan kata sandi yang aman.
        </p>
      </div>

      {error && (
        <div className="auth-alert-error">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {submitted ? (
        <div className="reset-success-box animate-fade-in">
          <div className="success-icon-wrap">
            <CheckCircle2 size={36} />
          </div>
          <h3>Instruksi Telah Dikirim</h3>
          <p>
            Jika alamat email <strong>{email}</strong> terdaftar di sistem kami, Anda akan menerima pesan berisi tautan pemulihan kata sandi dalam beberapa menit.
          </p>
          <p className="spam-hint">
            Tidak menemukan email? Periksa folder <em>Spam</em> atau <em>Promosi</em> di kotak masuk Anda.
          </p>

          <div className="resend-action-row">
            {cooldown > 0 ? (
              <span className="cooldown-text">Kirim ulang tersedia dalam {cooldown} detik</span>
            ) : (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleResetRequest}
                disabled={isLoading}
              >
                Kirim Ulang Tautan
              </button>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleResetRequest} className="auth-form">
          <div className="form-group">
            <label htmlFor="reset-email">Alamat Email Terdaftar</label>
            <div className="input-field-wrap">
              <Mail size={16} className="input-icon" />
              <input
                id="reset-email"
                type="email"
                required
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary btn-block mt-3"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Kirim Tautan Pemulihan'}
          </button>
        </form>
      )}

      <div className="auth-footer-security">
        <ShieldCheck size={14} className="text-primary" />
        <span>Tautan pemulihan dilindungi enkripsi kriptografis dan kedaluwarsa dalam 1 jam.</span>
      </div>
    </div>
  )
}
