// src/pages/auth/ResetPasswordPage.tsx
// Halaman Pendaftaran Kata Sandi Baru Resmi Supabase Auth (100% Cluv Micro-Framework)
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
        password: password,
      })

      if (updateError) {
        throw updateError
      }

      setSuccess(true)
      setTimeout(() => {
        navigate('/dashboard', { replace: true })
      }, 2000)
    } catch (err: any) {
      setError(err?.message || 'Gagal memperbarui kata sandi. Coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  if (sessionChecking) {
    return (
      <div className="cluv-flex-col cluv-items-center cluv-text-center cluv-py-6">
        <Loader2 size={32} className="cluv-animate-spin cluv-text-teal cluv-mb-3" />
        <p className="cluv-caption cluv-text-muted">Memeriksa izin sesi pemulihan...</p>
      </div>
    )
  }

  return (
    <div className="cluv-flex-col">
      {/* EDITORIAL HEADER */}
      <div className="cluv-mb-4">
        <h1 className="cluv-title-section cluv-mb-1">
          Atur Kata Sandi Baru
        </h1>
        <p className="cluv-subtitle">
          Buat kata sandi baru yang kuat untuk melindungi akun dan riwayat konsultasi kulit Anda.
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

      {success ? (
        <div className="cluv-flex-col cluv-items-center cluv-text-center cluv-py-4">
          <div className="cluv-card-icon-wrap is-teal cluv-mb-3">
            <CheckCircle2 size={28} className="cluv-text-teal" />
          </div>
          <h2 className="cluv-title-card cluv-mb-2">Kata Sandi Berhasil Diperbarui!</h2>
          <p className="cluv-body cluv-mb-4">
            Kata sandi akun Anda telah diperbarui dengan aman. Mengalihkan Anda ke ruang konsultasi...
          </p>
          <Link to="/" className="cluv-btn is-primary is-block is-md">
            <span>Masuk ke Dashboard</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <form onSubmit={handleUpdatePassword} className="cluv-flex-col cluv-gap-4">
          <div className="cluv-field">
            <label className="cluv-label">Kata Sandi Baru (Min. 8 Karakter)</label>
            <div className="cluv-input-wrap has-leading-icon has-trailing-icon">
              <Lock size={16} className="cluv-input-icon is-leading" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Masukkan kata sandi baru"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="cluv-input"
              />
              <button
                type="button"
                className="cluv-input-icon is-trailing"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Tampilkan sandi"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="cluv-field">
            <label className="cluv-label">Konfirmasi Kata Sandi Baru</label>
            <div className="cluv-input-wrap has-leading-icon has-trailing-icon">
              <Lock size={16} className="cluv-input-icon is-leading" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Ulangi kata sandi baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="cluv-input"
              />
              <button
                type="button"
                className="cluv-input-icon is-trailing"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Tampilkan sandi"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="cluv-btn is-primary is-block is-md cluv-mt-2"
          >
            {isLoading ? <Loader2 size={16} className="cluv-animate-spin" /> : 'Simpan Kata Sandi Baru'}
          </button>
        </form>
      )}
    </div>
  )
}
