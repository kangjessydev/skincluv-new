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
    <div className="cluv-page cluv-focused-ledger">
      {/* Back Link */}
      <Link to="/profile" className="cluv-link is-muted cluv-flex-row cluv-items-center cluv-gap-1 cluv-mb-3">
        <ArrowLeft size={16} /> Kembali ke Profil
      </Link>

      {/* HEADER */}
      <div className="cluv-mb-6">
        <span className="cluv-badge is-teal cluv-mb-2">
          <ShieldCheck size={14} /> PUSAT KENDALI PRIVASI (UU PDP NO. 27/2022)
        </span>
        <h1 className="cluv-title-page cluv-mt-1 cluv-mb-1">Pengelolaan Data &amp; Hak Privasi</h1>
        <p className="cluv-caption cluv-text-muted">
          Anda memegang kendali penuh atas data pribadi, citra pemindaian wajah, dan keberadaan akun Anda pada platform Skincluv.
        </p>
      </div>

      <div className="cluv-flex-col cluv-gap-5">
        {/* KARTU 1: PORTABILITAS DATA */}
        <div className="cluv-card">
          <div className="cluv-flex-row cluv-items-start cluv-gap-4">
            <div className="cluv-card-icon-wrap is-sm is-blue">
              <Download size={20} />
            </div>
            <div className="cluv-flex-col cluv-gap-1">
              <h3 className="cluv-title-card">
                Unduh Salinan Data Pribadi (<em>Data Portability</em>)
              </h3>
              <p className="cluv-caption cluv-text-muted">
                Ekspor seluruh catatan profil, jenis kulit, status kuota, dan saldo kredit Anda ke dalam berkas standar JSON.
              </p>
            </div>
          </div>
          <hr className="cluv-divider is-compact cluv-my-4" />
          <div className="cluv-flex-row cluv-justify-end">
            <button type="button" className="cluv-btn is-outline is-sm" onClick={handleExportData}>
              <Download size={15} />
              <span>Unduh Data Profil (JSON)</span>
            </button>
          </div>
        </div>

        {/* KARTU 2: HAPUS SCAN WAJAH SAJA */}
        <div className="cluv-card">
          <div className="cluv-flex-row cluv-items-start cluv-gap-4">
            <div className="cluv-card-icon-wrap is-sm is-gold">
              <Trash2 size={20} />
            </div>
            <div className="cluv-flex-col cluv-gap-1">
              <h3 className="cluv-title-card">
                Pembersihan Rekam Jejak Biometrik Wajah
              </h3>
              <p className="cluv-caption cluv-text-muted">
                Musnahkan seluruh foto wajah dan skor pemindaian masa lalu Anda dari basis data operasional. Akun, kuota langganan, dan saldo kredit Anda akan tetap utuh.
              </p>
            </div>
          </div>

          {scansDeletedSuccess && (
            <div className="cluv-alert is-success cluv-mt-4">
              <CheckCircle2 size={16} className="cluv-alert-icon" />
              <div className="cluv-alert-content">
                <p className="cluv-alert-message">
                  Seluruh riwayat pemindaian wajah Anda berhasil dimusnahkan secara bersih.
                </p>
              </div>
            </div>
          )}

          <hr className="cluv-divider is-compact cluv-my-4" />
          <div className="cluv-flex-row cluv-justify-end">
            <button
              type="button"
              className="cluv-btn is-outline is-sm"
              onClick={handleDeleteFaceScans}
              disabled={isDeletingScans}
            >
              {isDeletingScans ? <Loader2 size={15} className="cluv-animate-spin" /> : <Trash2 size={15} />}
              <span>Hapus Rekam Jejak Scan Wajah Saja</span>
            </button>
          </div>
        </div>

        {/* KARTU 3: KETENTUAN HAK PRIVASI */}
        <div className="cluv-card">
          <div className="cluv-flex-row cluv-items-start cluv-gap-4">
            <div className="cluv-card-icon-wrap is-sm">
              <Lock size={20} />
            </div>
            <div className="cluv-flex-col cluv-gap-1">
              <h3 className="cluv-title-card">
                Kebijakan &amp; Yurisdiksi Perlindungan Data
              </h3>
              <p className="cluv-caption cluv-text-muted">
                Pelajari bagaimana kami mengamankan foto wajah di storage tertutup (<em>private bucket</em>) dan mengisolasi data transaksi kas non-PII.
              </p>
            </div>
          </div>
          <hr className="cluv-divider is-compact cluv-my-4" />
          <div className="cluv-flex-row cluv-justify-end">
            <Link to="/privacy" className="cluv-btn is-outline is-sm">
              <Eye size={15} />
              <span>Baca Kebijakan Privasi Lengkap</span>
            </Link>
          </div>
        </div>

        {/* KARTU 4: PENGHAPUSAN AKUN PERMANEN (DANGER ZONE) */}
        <div className="cluv-card is-danger">
          <div className="cluv-flex-row cluv-items-start cluv-gap-4">
            <div className="cluv-card-icon-wrap is-sm is-rose">
              <AlertTriangle size={20} />
            </div>
            <div className="cluv-flex-col cluv-gap-1">
              <h3 className="cluv-title-card cluv-text-rose">
                Pemusnahan Akun Permanen (<em>Right to be Forgotten</em>)
              </h3>
              <p className="cluv-caption cluv-text-muted">
                Menghapus akun Skincluv Anda secara permanen. Seluruh foto wajah, riwayat percakapan AI, profil kulit, saldo kredit, dan kuota pass akan dimusnahkan seketika. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
          </div>
          <hr className="cluv-divider is-compact cluv-my-4" />
          <div className="cluv-flex-row cluv-justify-end">
            <button
              type="button"
              className="cluv-btn is-danger is-sm"
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
        <div className="cluv-modal-overlay">
          <div className="cluv-modal-box is-sm">
            <div className="cluv-modal-header">
              <h2 className="cluv-modal-title cluv-flex-row cluv-items-center cluv-gap-2 cluv-text-rose">
                <AlertTriangle size={18} /> Pemusnahan Akun Permanen
              </h2>
              <button
                type="button"
                className="cluv-modal-close"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeletingAccount}
              >
                ✕
              </button>
            </div>

            <div className="cluv-modal-body cluv-flex-col cluv-gap-4">
              <p className="cluv-caption cluv-text-muted">
                Anda hendak menghapus akun <strong>{user?.email}</strong>. Seluruh riwayat foto wajah, hasil pemindaian, percakapan AI, dan kuota langganan yang tersisa akan <strong>dihapus permanen dan tidak dapat dipulihkan kembali</strong>.
              </p>

              {deleteError && (
                <div className="cluv-alert is-danger">
                  <AlertTriangle size={16} className="cluv-alert-icon" />
                  <div className="cluv-alert-content">
                    <p className="cluv-alert-message">{deleteError}</p>
                  </div>
                </div>
              )}

              <div className="cluv-field">
                <label htmlFor="confirm-delete" className="cluv-label">
                  Ketik <code>DELETE MY ACCOUNT</code> di bawah ini untuk mengonfirmasi:
                </label>
                <input
                  id="confirm-delete"
                  type="text"
                  className="cluv-input"
                  placeholder="DELETE MY ACCOUNT"
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  autoComplete="off"
                  disabled={isDeletingAccount}
                />
              </div>
            </div>

            <div className="cluv-modal-footer">
              <button
                type="button"
                className="cluv-btn is-outline is-sm"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeletingAccount}
              >
                Batalkan
              </button>
              <button
                type="button"
                className="cluv-btn is-danger is-sm"
                onClick={handlePermanentlyDeleteAccount}
                disabled={isDeletingAccount || confirmationInput.trim() !== 'DELETE MY ACCOUNT'}
              >
                {isDeletingAccount ? (
                  <>
                    <Loader2 size={15} className="cluv-animate-spin" />
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
  )
}
