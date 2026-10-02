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
            navigate('/', { replace: true })
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
    <div className="callback-container animate-fade-in">
      <div className="callback-card">
        {status === 'processing' && (
          <>
            <Loader2 size={44} className="animate-spin text-primary mx-auto mb-3" />
            <h2>Memverifikasi Kredensial...</h2>
            <p>Mohon tunggu sebentar, kami sedang mengamankan sesi akun Skincluv Anda.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="callback-icon-success">
              <CheckCircle2 size={44} />
            </div>
            <h2>Verifikasi Berhasil!</h2>
            <p>Sesi Anda telah terotentikasi secara aman. Mengalihkan ke ruang akun...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="callback-icon-error">
              <AlertCircle size={44} />
            </div>
            <h2>Tautan Tidak Valid</h2>
            <p>{errorMessage}</p>
            <button
              className="btn btn-primary btn-sm mt-3"
              onClick={() => navigate('/login', { replace: true })}
            >
              <span>Kembali ke Halaman Masuk</span>
              <ArrowRight size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
