// src/pages/app/PrivacyCenterPage.tsx
// Pusat Kendali Privasi & Hak Pemilik Data Pribadi (UU PDP No. 27/2022)
// Mengimplementasikan Invarian 4 (Memory consent) & Invarian 20 (Dual-track deletion)

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ShieldCheck, Download, Trash2, AlertTriangle, ArrowLeft, CheckCircle2, Lock, Eye, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Button, Badge } from '@/components/ui'

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
    <div className="cluv-canvas-focused cluv-animate-fade">
      {/* Back Link (Desktop only; di mobile sudah ada tombol kembali di topbar) */}
      <Link to="/profile" className="cluv-hide-mobile cluv-link is-muted cluv-flex-row cluv-items-center cluv-gap-1 cluv-mb-3">
        <ArrowLeft size={16} /> Kembali ke Profil
      </Link>

      {/* HEADER (Desktop only; di mobile judul sudah di topbar) */}
      <div className="cluv-hide-mobile cluv-mb-6">
        <Badge variant="teal" icon={<ShieldCheck size={14} />} className="cluv-mb-2">
          PUSAT KENDALI PRIVASI (UU PDP NO. 27/2022)
        </Badge>
        <h1 className="cluv-title-page cluv-mt-1 cluv-mb-1">Pengelolaan Data &amp; Hak Privasi</h1>
        <p className="cluv-caption cluv-text-muted">
          Anda memegang kendali penuh atas data pribadi, citra pemindaian wajah, dan keberadaan akun Anda pada platform Skincluv.
        </p>
      </div>

      {/* ===================== MOBILE INSET GROUPED LIST (Standar Native App) ===================== */}
      <div className="cluv-hide-desktop cluv-flex-col cluv-gap-4">
        {scansDeletedSuccess && (
          <div className="cluv-alert is-success">
            <CheckCircle2 size={16} className="cluv-alert-icon" />
            <div className="cluv-alert-content">
              <p className="cluv-alert-message">
                Seluruh riwayat pemindaian wajah Anda berhasil dimusnahkan.
              </p>
            </div>
          </div>
        )}

        {/* Grup 1: Hak Data Pribadi */}
        <div>
          <div className="cluv-menu-group-label">Hak Data Pribadi (UU PDP)</div>
          <div className="cluv-menu-group">
            {/* Row 1: Unduh Salinan Data */}
            <button
              type="button"
              className="cluv-menu-row"
              onClick={handleExportData}
            >
              <div className="cluv-menu-row-main">
                <div className="cluv-menu-row-icon is-blue">
                  <Download size={17} />
                </div>
                <div className="cluv-flex-col">
                  <span className="cluv-menu-row-title">Unduh Salinan Data (JSON)</span>
                  <p className="cluv-menu-row-desc">Ekspor profil, jenis kulit, dan saldo kredit</p>
                </div>
              </div>
              <div className="cluv-menu-row-trailing">
                <ChevronRight size={18} className="cluv-menu-row-chevron" />
              </div>
            </button>

            {/* Row 2: Hapus Scan Wajah Saja */}
            <button
              type="button"
              className="cluv-menu-row"
              onClick={handleDeleteFaceScans}
              disabled={isDeletingScans}
            >
              <div className="cluv-menu-row-main">
                <div className="cluv-menu-row-icon is-gold">
                  <Trash2 size={17} />
                </div>
                <div className="cluv-flex-col">
                  <span className="cluv-menu-row-title">Hapus Data Scan Wajah Saja</span>
                  <p className="cluv-menu-row-desc">Musnahkan foto biometrik, akun tetap aktif</p>
                </div>
              </div>
              <div className="cluv-menu-row-trailing">
                {isDeletingScans ? (
                  <span className="cluv-spinner is-sm" />
                ) : (
                  <ChevronRight size={18} className="cluv-menu-row-chevron" />
                )}
              </div>
            </button>

            {/* Row 3: Kebijakan Privasi Lengkap */}
            <Link to="/privacy" className="cluv-menu-row">
              <div className="cluv-menu-row-main">
                <div className="cluv-menu-row-icon is-teal">
                  <Lock size={17} />
                </div>
                <div className="cluv-flex-col">
                  <span className="cluv-menu-row-title">Kebijakan Privasi Lengkap</span>
                  <p className="cluv-menu-row-desc">Kepatuhan UU PDP &amp; proteksi data</p>
                </div>
              </div>
              <div className="cluv-menu-row-trailing">
                <ChevronRight size={18} className="cluv-menu-row-chevron" />
              </div>
            </Link>
          </div>
        </div>

        {/* Grup 2: Zona Kritis (Danger Zone) */}
        <div>
          <div className="cluv-menu-group-label cluv-text-rose">Zona Kritis</div>
          <div className="cluv-menu-group">
            <button
              type="button"
              className="cluv-menu-row is-danger"
              onClick={() => {
                setConfirmationInput('')
                setDeleteError(null)
                setShowDeleteModal(true)
              }}
            >
              <div className="cluv-menu-row-main">
                <div className="cluv-menu-row-icon is-rose">
                  <AlertTriangle size={17} />
                </div>
                <div className="cluv-flex-col">
                  <span className="cluv-menu-row-title">Hapus Akun Saya Permanen</span>
                  <p className="cluv-menu-row-desc">Musnahkan akun, kuota &amp; seluruh data</p>
                </div>
              </div>
              <div className="cluv-menu-row-trailing">
                <ChevronRight size={18} className="cluv-menu-row-chevron" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ===================== DESKTOP DETAILED CARDS ===================== */}
      <div className="cluv-hide-mobile cluv-flex-col cluv-gap-5">
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
            <Button
              variant="outline"
              size="sm"
              iconLeft={<Download size={15} />}
              onClick={handleExportData}
            >
              Unduh Data Profil (JSON)
            </Button>
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
            <Button
              variant="outline"
              size="sm"
              iconLeft={<Trash2 size={15} />}
              loading={isDeletingScans}
              onClick={handleDeleteFaceScans}
            >
              Hapus Rekam Jejak Scan Wajah Saja
            </Button>
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
            <Button
              variant="outline"
              size="sm"
              iconLeft={<Eye size={15} />}
              to="/privacy"
            >
              Baca Kebijakan Privasi Lengkap
            </Button>
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
            <Button
              variant="danger"
              size="sm"
              iconLeft={<Trash2 size={15} />}
              onClick={() => {
                setConfirmationInput('')
                setDeleteError(null)
                setShowDeleteModal(true)
              }}
            >
              Hapus Akun Saya Secara Permanen
            </Button>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeletingAccount}
              >
                Batalkan
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={isDeletingAccount}
                disabled={confirmationInput.trim() !== 'DELETE MY ACCOUNT'}
                onClick={handlePermanentlyDeleteAccount}
              >
                Konfirmasi Hapus Akun
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
