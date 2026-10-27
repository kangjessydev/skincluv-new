// src/pages/auth/ForgotPasswordPage.tsx
// Halaman Permintaan Reset Password Resmi Supabase Auth (100% Cluv Micro-Framework)
// Kepatuhan: Invarian 21 & Anti-Enumeration Security Checklist

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
        redirectTo: redirectUrl,
      })

      if (resetError) {
        // Jangan membocorkan status pendaftaran email ke penyerang (Anti-Enumeration)
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
    } catch {
      setError('Terjadi kendala saat mengirim instruksi. Periksa koneksi Anda.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="cluv-flex-col">
      {/* NAV BACK LINK */}
      <div className="cluv-mb-3">
        <Link to="/login" className="cluv-link cluv-caption cluv-flex-row cluv-items-center cluv-gap-1">
          <ArrowLeft size={14} />
          <span>Kembali ke Halaman Masuk</span>
        </Link>
      </div>

      {/* EDITORIAL HEADER */}
      <div className="cluv-mb-4">
        <h1 className="cluv-title-section cluv-mb-1">
          Lupa Kata Sandi?
        </h1>
        <p className="cluv-subtitle">
          Masukkan alamat email akun Skincluv Anda. Kami akan mengirimkan tautan pemulihan kata sandi yang aman.
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

      {submitted ? (
        <div className="cluv-flex-col cluv-items-center cluv-text-center cluv-py-2">
          <div className="cluv-card-icon-wrap is-teal cluv-mb-3">
            <CheckCircle2 size={28} className="cluv-text-teal" />
          </div>
          <h2 className="cluv-title-card cluv-mb-2">Instruksi Telah Dikirim</h2>
          <p className="cluv-body cluv-mb-3">
            Jika alamat email <strong>{email}</strong> terdaftar di sistem kami, Anda akan menerima tautan pemulihan kata sandi dalam beberapa menit.
          </p>

          <div className="cluv-card-note cluv-mb-4 cluv-text-left">
            <p className="cluv-micro cluv-text-muted">
              💡 Tidak menemukan email? Periksa folder <em>Spam</em> atau tab <em>Promosi</em> di kotak masuk Anda.
            </p>
          </div>

          {cooldown > 0 ? (
            <p className="cluv-micro cluv-text-muted">
              Kirim ulang tersedia dalam {cooldown} detik
            </p>
          ) : (
            <button
              type="button"
              className="cluv-btn is-outline is-sm"
              onClick={handleResetRequest}
              disabled={isLoading}
            >
              Kirim Ulang Tautan
            </button>
          )}
        </div>
      ) : (
        <form onSubmit={handleResetRequest} className="cluv-flex-col cluv-gap-4">
          <div className="cluv-field">
            <label className="cluv-label">Alamat Email Terdaftar</label>
            <div className="cluv-input-wrap has-leading-icon">
              <Mail size={16} className="cluv-input-icon is-leading" />
              <input
                type="email"
                required
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="cluv-input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="cluv-btn is-primary is-block is-md cluv-mt-2"
          >
            {isLoading ? <Loader2 size={16} className="cluv-animate-spin" /> : 'Kirim Tautan Pemulihan'}
          </button>
        </form>
      )}

      {/* FOOTER SECURITY */}
      <div className="cluv-trust-strip is-left cluv-mt-5">
        <span className="cluv-trust-item">
          <ShieldCheck size={13} className="cluv-trust-icon cluv-text-teal" />
          <span className="cluv-micro">Tautan pemulihan dilindungi enkripsi kriptografis (kedaluwarsa 1 jam)</span>
        </span>
      </div>
    </div>
  )
}
