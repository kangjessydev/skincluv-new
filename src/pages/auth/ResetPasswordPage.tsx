// src/pages/auth/ResetPasswordPage.tsx
// Halaman Pendaftaran Kata Sandi Baru Resmi Supabase Auth
// Kepatuhan: Invarian 21 & Validasi Kompleksitas Sandi

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [sessionChecking, setSessionChecking] = useState(true)

  useEffect(() => {
    async function checkRecoverySession() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          // Tidak ada sesi recovery aktif
          setError('Sesi pemulihan tidak ditemukan atau telah kedaluwarsa. Silakan ajukan permohonan reset sandi kembali.')
        }
      } catch (err) {
        setError('Gagal memverifikasi sesi pemulihan.')
      } finally {
        setSessionChecking(false)
      }
    }

    checkRecoverySession()
  }, [])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 8) {
      setError('Kata sandi baru harus terdiri dari minimal 8 karakter.')
      return
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok. Harap periksa kembali.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) {
        throw updateError
      }

      setSuccess(true)
      setTimeout(() => {
        navigate('/', { replace: true })
      }, 2000)
    } catch (err: any) {
      setError(err?.message || 'Gagal memperbarui kata sandi. Coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  if (sessionChecking) {
    return (
      <div className="auth-form-panel text-center py-5">
        <Loader2 size={32} className="animate-spin text-primary mx-auto mb-2" />
        <p className="text-muted">Memeriksa izin sesi pemulihan...</p>
      </div>
    )
  }

  return (
    <div className="auth-form-panel animate-fade-in">
      <div className="auth-header-group">
        <div className="auth-eyebrow">KEAMANAN AKUN</div>
        <h1>Atur Kata Sandi Baru</h1>
        <p className="auth-sub">
          Buat kata sandi baru yang kuat untuk melindungi akun dan riwayat konsultasi kulit Anda.
        </p>
      </div>

      {error && (
        <div className="auth-alert-error">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success ? (
        <div className="reset-success-box animate-fade-in">
          <div className="success-icon-wrap">
            <CheckCircle2 size={36} />
          </div>
          <h3>Kata Sandi Berhasil Diperbarui!</h3>
          <p>
            Kata sandi akun Anda telah diperbarui dengan aman. Mengalihkan Anda ke ruang konsultasi...
          </p>
          <div className="mt-3">
            <Link to="/" className="btn btn-primary btn-sm">
              <span>Masuk ke Dashboard</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleUpdatePassword} className="auth-form">
          <div className="form-group">
            <label htmlFor="new-password">Kata Sandi Baru (Min. 8 Karakter)</label>
            <div className="input-field-wrap">
              <Lock size={16} className="input-icon" />
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Masukkan kata sandi baru"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Tampilkan sandi"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirm-password">Konfirmasi Kata Sandi Baru</label>
            <div className="input-field-wrap">
              <Lock size={16} className="input-icon" />
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Ulangi kata sandi baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary btn-block mt-3"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Simpan Kata Sandi Baru'}
          </button>
        </form>
      )}

      <style>{`
        .auth-form-panel {
          width: 100%;
          max-width: 420px;
          margin: 0 auto;
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
          padding: 11px 40px 11px 40px;
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

        .toggle-password-btn {
          position: absolute;
          right: 12px;
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
        }

        .toggle-password-btn:hover {
          color: #475569;
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
      `}</style>
    </div>
  )
}
