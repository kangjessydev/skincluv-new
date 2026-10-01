// src/pages/app/PrivacyCenterPage.tsx
// Pusat Kendali Privasi & Hak Pemilik Data Pribadi (UU PDP No. 27/2022)
// Mengimplementasikan Invarian 4 (Memory consent) & Invarian 20 (Dual-track deletion)

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ShieldCheck, Download, Trash2, AlertTriangle, ArrowLeft, CheckCircle2, Loader2, Lock, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export default function PrivacyCenterPage() {
  const navigate = useNavigate()
  const { user, profile, activeSkinProfile, subscription, coinBalance, reset } = useAuthStore()

  // State untuk Hapus Scan Wajah Saja
  const [isDeletingScans, setIsDeletingScans] = useState(false)
  const [scansDeletedSuccess, setScansDeletedSuccess] = useState(false)

  // State untuk Hapus Akun Permanen
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [confirmationInput, setConfirmationInput] = useState('')
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // 1. Ekspor Data Pribadi (Data Portability)
  const handleExportData = () => {
    const exportPayload = {
      user_id: user?.id,
      email: user?.email,
      profile: profile,
      skin_profile: activeSkinProfile,
      subscription: subscription,
      credits: coinBalance?.balance ?? 0,
      exported_at: new Date().toISOString(),
      compliance: 'UU Pelindungan Data Pribadi No. 27/2022'
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `skincluv-data-${user?.id?.slice(0, 8)}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  // 2. Hapus Scan Wajah Saja
  const handleDeleteFaceScans = async () => {
    if (!user?.id) return
    const confirmed = window.confirm('Apakah Anda yakin ingin memusnahkan seluruh rekam jejak foto dan pemindaian wajah Anda? Tindakan ini tidak dapat dibatalkan.')
    if (!confirmed) return

    setIsDeletingScans(true)
    setScansDeletedSuccess(false)

    try {
      const { error } = await supabase.rpc('delete_user_face_scans_only', {
        p_user_id: user.id
      })

      if (error) throw error

      setScansDeletedSuccess(true)
      setTimeout(() => setScansDeletedSuccess(false), 4000)
    } catch (err: any) {
      alert(`Gagal menghapus rekam jejak scan: ${err?.message || 'Terjadi kesalahan sistem'}`)
    } finally {
      setIsDeletingScans(false)
    }
  }

  // 3. Hapus Seluruh Akun Permanen (Dual-Track Deletion)
  const handlePermanentlyDeleteAccount = async () => {
    if (!user?.id) return

    if (confirmationInput.trim() !== 'DELETE MY ACCOUNT') {
      setDeleteError('Harap ketik konfirmasi DELETE MY ACCOUNT secara tepat dengan huruf besar.')
      return
    }

    setIsDeletingAccount(true)
    setDeleteError(null)

    try {
      const { error } = await supabase.rpc('delete_user_account', {
        p_user_id: user.id,
        p_confirmation: 'DELETE MY ACCOUNT'
      })

      if (error) throw error

      // Keluar dari sesi dan bersihkan state
      await supabase.auth.signOut()
      reset()

      alert('Akun dan seluruh data biometrik Anda telah dimusnahkan secara permanen dari sistem Skincluv.')
      navigate('/', { replace: true })
    } catch (err: any) {
      setDeleteError(`Gagal memproses penghapusan akun: ${err?.message || 'Terjadi kesalahan sistem'}`)
      setIsDeletingAccount(false)
    }
  }

  return (
    <div className="v0-page-container animate-fade-in">
      <div className="v0-profile-form-container">
        {/* Back Link */}
        <div style={{ marginBottom: '16px' }}>
          <Link to="/profile" className="v0-back-link">
            <ArrowLeft size={16} /> Kembali ke Profil
          </Link>
        </div>

        {/* HEADER */}
        <div className="v0-profile-form-header" style={{ marginBottom: '28px', textAlign: 'left' }}>
          <span className="v0-celebrate-badge" style={{ marginBottom: '8px' }}>
            <ShieldCheck size={14} /> PUSAT KENDALI PRIVASI (UU PDP NO. 27/2022)
          </span>
          <h1 className="v0-profile-form-main-title">Pengelolaan Data &amp; Hak Privasi</h1>
          <p className="v0-profile-form-main-sub">
            Anda memegang kendali penuh atas data pribadi, citra pemindaian wajah, dan keberadaan akun Anda pada platform Skincluv.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* KARTU 1: PORTABILITAS DATA */}
          <div className="v0-profile-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
              <div className="v0-icon-wrap sky"><Download size={22} /></div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-ink)', margin: '0 0 4px' }}>
                  Unduh Salinan Data Pribadi (<em>Data Portability</em>)
                </h3>
                <p style={{ fontSize: '0.84375rem', color: 'var(--color-ink-soft)', lineHeight: 1.5, margin: 0 }}>
                  Ekspor seluruh catatan profil, jenis kulit, status kuota, dan saldo kredit Anda ke dalam berkas standar JSON.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--color-border-soft)' }}>
              <button type="button" className="v0-btn-secondary" onClick={handleExportData}>
                <Download size={15} />
                <span>Unduh Data Profil (JSON)</span>
              </button>
            </div>
          </div>

          {/* KARTU 2: HAPUS SCAN WAJAH SAJA */}
          <div className="v0-profile-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
              <div className="v0-icon-wrap amber"><Trash2 size={22} /></div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-ink)', margin: '0 0 4px' }}>
                  Pembersihan Rekam Jejak Biometrik Wajah
                </h3>
                <p style={{ fontSize: '0.84375rem', color: 'var(--color-ink-soft)', lineHeight: 1.5, margin: 0 }}>
                  Musnahkan seluruh foto wajah dan skor pemindaian masa lalu Anda dari basis data operasional. Akun, kuota langganan, dan saldo kredit Anda akan tetap utuh.
                </p>
              </div>
            </div>

            {scansDeletedSuccess && (
              <div className="v0-profile-message success animate-fade-in" style={{ marginBottom: '16px' }}>
                <CheckCircle2 size={16} />
                <span>Seluruh riwayat pemindaian wajah Anda berhasil dimusnahkan secara bersih.</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--color-border-soft)' }}>
              <button
                type="button"
                className="v0-btn-secondary"
                onClick={handleDeleteFaceScans}
                disabled={isDeletingScans}
              >
                {isDeletingScans ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                <span>Hapus Rekam Jejak Scan Wajah Saja</span>
              </button>
            </div>
          </div>

          {/* KARTU 3: KETENTUAN HAK PRIVASI */}
          <div className="v0-profile-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
              <div className="v0-icon-wrap teal"><Lock size={22} /></div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-ink)', margin: '0 0 4px' }}>
                  Kebijakan &amp; Yurisdiksi Perlindungan Data
                </h3>
                <p style={{ fontSize: '0.84375rem', color: 'var(--color-ink-soft)', lineHeight: 1.5, margin: 0 }}>
                  Pelajari bagaimana kami mengamankan foto wajah di storage tertutup (<em>private bucket</em>) dan mengisolasi data transaksi kas non-PII.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--color-border-soft)' }}>
              <Link to="/privacy" className="v0-btn-secondary">
                <Eye size={15} />
                <span>Baca Kebijakan Privasi Lengkap</span>
              </Link>
            </div>
          </div>

          {/* KARTU 4: PENGHAPUSAN AKUN PERMANEN (DANGER ZONE) */}
          <div className="v0-card-danger">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
              <div className="v0-icon-wrap rose"><AlertTriangle size={22} /></div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-status-alert)', margin: '0 0 4px' }}>
                  Pemusnahan Akun Permanen (<em>Right to be Forgotten</em>)
                </h3>
                <p style={{ fontSize: '0.84375rem', color: 'var(--color-ink-soft)', lineHeight: 1.5, margin: 0 }}>
                  Menghapus akun Skincluv Anda secara permanen. Seluruh foto wajah, riwayat percakapan AI, profil kulit, saldo kredit, dan kuota pass akan dimusnahkan seketika. Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid rgba(239, 68, 68, 0.15)' }}>
              <button
                type="button"
                className="v0-btn-danger"
                onClick={() => {
                  setConfirmationInput('')
                  setDeleteError(null)
                  setShowDeleteModal(true)
                }}
              >
                <Trash2 size={15} />
                <span>Hapus Akun Saya Secara Permanen</span>
              </button>
            </div>
          </div>
        </div>

        {/* MODAL KONFIRMASI GANDA PENGHAPUSAN AKUN */}
        {showDeleteModal && (
          <div className="v0-modal-backdrop animate-fade-in">
            <div className="v0-modal-card animate-scale-up">
              <div className="v0-modal-icon-alert">
                <AlertTriangle size={28} />
              </div>
              <h2 className="v0-modal-title">Pemusnahan Akun Permanen</h2>
              <p className="v0-modal-desc">
                Anda hendak menghapus akun <strong>{user?.email}</strong>. Seluruh riwayat foto wajah, hasil pemindaian, percakapan AI, dan kuota langganan yang tersisa akan <strong>dihapus permanen dan tidak dapat dipulihkan kembali</strong>.
              </p>

              {deleteError && (
                <div className="v0-modal-error-banner">
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="v0-modal-input-group">
                <label htmlFor="confirm-delete">
                  Ketik <code>DELETE MY ACCOUNT</code> di bawah ini untuk mengonfirmasi:
                </label>
                <input
                  id="confirm-delete"
                  type="text"
                  placeholder="DELETE MY ACCOUNT"
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  autoComplete="off"
                  disabled={isDeletingAccount}
                />
              </div>

              <div className="v0-modal-footer-btns">
                <button
                  type="button"
                  className="v0-btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeletingAccount}
                >
                  Batalkan
                </button>
                <button
                  type="button"
                  className="v0-btn-danger"
                  onClick={handlePermanentlyDeleteAccount}
                  disabled={isDeletingAccount || confirmationInput.trim() !== 'DELETE MY ACCOUNT'}
                >
                  {isDeletingAccount ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Memusnahkan Data...</span>
                    </>
                  ) : (
                    <span>Konfirmasi Hapus Akun</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
