// src/pages/auth/AuthCallbackPage.tsx
// Endpoint Terpadu Callback Supabase Auth (Email Verification & Password Recovery)
// Kepatuhan: Invarian 21 (Zero-Leakage URL Token Sanitization)

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    async function processAuthCallback() {
      try {
        // Ambil query parameter
        const type = searchParams.get('type')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        if (error) {
          throw new Error(errorDescription || 'Terjadi kesalahan pada tautan autentikasi.')
        }

        // ---- INVARIAN 21: TOKEN SANITIZATION ----
        // Segera bersihkan parameter sensitif (?code=... #access_token=...) dari address bar
        // untuk mencegah kebocoran sesi melalui HTTP Referrer atau telemetri.
        try {
          if (window.history && window.history.replaceState) {
            window.history.replaceState({}, document.title, window.location.pathname)
          }
        } catch (sanitizeErr) {
          console.warn('Gagal membersihkan parameter URL:', sanitizeErr)
        }

        // Ambil dan pastikan sesi Supabase aktif dari pertukaran kode PKCE
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          throw sessionError
        }

        setStatus('success')

        // Arahkan sesuai intent callback
        setTimeout(() => {
          if (type === 'recovery') {
            // Pengguna sedang dalam alur pemulihan kata sandi
            navigate('/reset-password', { replace: true })
          } else {
            // Konfirmasi pendaftaran akun atau OAuth exchange
            navigate('/dashboard', { replace: true })
          }
        }, 1200)
      } catch (err: any) {
        console.error('Auth callback failure:', err)
        setStatus('error')
        setErrorMessage(err?.message || 'Tautan konfirmasi tidak valid atau telah kedaluwarsa.')
      }
    }

    processAuthCallback()
  }, [navigate, searchParams])

  return (
    <div className="cluv-flex-col cluv-items-center cluv-text-center cluv-py-6">
      {status === 'processing' && (
        <>
          <Loader2 size={40} className="cluv-animate-spin cluv-text-teal cluv-mb-3" />
          <h2 className="cluv-title-card cluv-mb-1">Memverifikasi Kredensial...</h2>
          <p className="cluv-body cluv-text-muted">Mohon tunggu sebentar, kami sedang mengamankan sesi akun Skincluv Anda.</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="cluv-card-icon-wrap is-teal cluv-mb-3">
            <CheckCircle2 size={28} className="cluv-text-teal" />
          </div>
          <h2 className="cluv-title-card cluv-mb-1">Verifikasi Berhasil!</h2>
          <p className="cluv-body cluv-text-muted">Sesi Anda telah terotentikasi secara aman. Mengalihkan ke ruang akun...</p>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="cluv-card-icon-wrap is-rose cluv-mb-3">
            <AlertCircle size={28} className="cluv-text-rose" />
          </div>
          <h2 className="cluv-title-card cluv-mb-1">Tautan Tidak Valid</h2>
          <p className="cluv-body cluv-text-muted cluv-mb-4">{errorMessage}</p>
          <button
            className="cluv-btn is-primary is-md"
            onClick={() => navigate('/login', { replace: true })}
          >
            <span>Kembali ke Halaman Masuk</span>
            <ArrowRight size={16} />
          </button>
        </>
      )}
    </div>
  )
}
