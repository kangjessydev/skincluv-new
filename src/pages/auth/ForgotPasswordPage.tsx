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

      <style>{`
        .auth-form-panel {
          width: 100%;
          max-width: 420px;
          margin: 0 auto;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--color-primary, #0f6784);
          text-decoration: none;
          margin-bottom: 24px;
        }

        .back-link:hover {
          text-decoration: underline;
        }

        .auth-header-group {
          margin-bottom: 24px;
        }

        .auth-eyebrow {
          font-size: 0.6875rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: var(--color-primary, #0f6784);
          margin-bottom: 6px;
        }

        .auth-header-group h1 {
          font-family: var(--font-heading, sans-serif);
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--color-text-main, #0f172a);
          margin: 0 0 8px 0;
        }

        .auth-sub {
          font-size: 0.875rem;
          color: var(--color-text-muted, #64748b);
          line-height: 1.5;
          margin: 0;
        }

        .auth-alert-error {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px 14px;
          border-radius: var(--radius-md, 8px);
          font-size: 0.8125rem;
          margin-bottom: 20px;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--color-text-main, #334155);
        }

        .input-field-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          color: #94a3b8;
        }

        .input-field-wrap input {
          width: 100%;
          padding: 11px 14px 11px 40px;
          border: 1px solid #cbd5e1;
          border-radius: var(--radius-md, 8px);
          font-size: 0.875rem;
          color: #0f172a;
          background: #ffffff;
          transition: all 0.15s ease;
        }

        .input-field-wrap input:focus {
          outline: none;
          border-color: var(--color-primary, #0f6784);
          box-shadow: 0 0 0 2px rgba(15, 103, 132, 0.15);
        }

        .btn-block {
          width: 100%;
          justify-content: center;
        }

        .reset-success-box {
          background: #ffffff;
          border: 1px solid var(--color-secondary-container, #e2e8f0);
          border-radius: var(--radius-xl, 16px);
          padding: 28px 24px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
        }

        .success-icon-wrap {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #dcfce7;
          color: #16a34a;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }

        .reset-success-box h3 {
          font-family: var(--font-heading, sans-serif);
          font-size: 1.125rem;
          font-weight: 800;
          color: var(--color-text-main, #0f172a);
          margin: 0 0 8px 0;
        }

        .reset-success-box p {
          font-size: 0.875rem;
          color: var(--color-text-muted, #64748b);
          line-height: 1.5;
          margin: 0 0 12px 0;
        }

        .spam-hint {
          font-size: 0.75rem !important;
          color: #94a3b8 !important;
        }

        .resend-action-row {
          margin-top: 20px;
        }

        .cooldown-text {
          font-size: 0.8125rem;
          color: #94a3b8;
          font-weight: 600;
        }

        .auth-footer-security {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 28px;
          padding: 10px 14px;
          background: #f8fafc;
          border-radius: var(--radius-md, 8px);
          border: 1px solid #f1f5f9;
          font-size: 0.6875rem;
          color: var(--color-text-muted, #64748b);
          line-height: 1.4;
        }
      `}</style>
    </div>
  )
}
