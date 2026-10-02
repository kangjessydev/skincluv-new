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
    </div>
  )
}
