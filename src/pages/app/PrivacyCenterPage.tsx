// src/pages/app/PrivacyCenterPage.tsx
// Pusat Kendali Privasi & Hak Pemilik Data Pribadi (UU PDP No. 27/2022)
// Mengimplementasikan Invarian 4 (Memory consent) & Invarian 20 (Dual-track deletion)

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ShieldCheck, Download, Trash2, AlertTriangle, ArrowLeft, CheckCircle2, Loader2, Lock, Eye, KeyRound } from 'lucide-react'
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
      const { data, error } = await supabase.rpc('delete_user_face_scans_only', {
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
      const { data, error } = await supabase.rpc('delete_user_account', {
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
    <div className="privacy-center-page animate-fade-in">
      <div className="privacy-center-container">
        {/* HEADER */}
        <header className="privacy-header">
          <Link to="/profile" className="btn-back-link">
            <ArrowLeft size={16} /> Kembali ke Profil
          </Link>
          <span className="privacy-badge"><ShieldCheck size={14} /> PUSAT KENDALI PRIVASI (UU PDP NO. 27/2022)</span>
          <h1>Pengelolaan Data &amp; Hak Privasi</h1>
          <p className="privacy-subtitle">
            Anda memegang kendali penuh atas data pribadi, citra pemindaian wajah, dan keberadaan akun Anda pada platform Skincluv.
          </p>
        </header>

        <div className="privacy-cards-stack">
          {/* KARTU 1: PORTABILITAS DATA */}
          <div className="card privacy-card glass-card">
            <div className="card-header-icon">
              <div className="icon-wrap sky-bg"><Download size={22} /></div>
              <div>
                <h3>Unduh Salinan Data Pribadi (*Data Portability*)</h3>
                <p>Ekspor seluruh catatan profil, jenis kulit, status kuota, dan saldo koin Anda ke dalam berkas standar JSON.</p>
              </div>
            </div>
            <div className="card-actions">
              <button className="btn btn-outline btn-sm" onClick={handleExportData}>
                <Download size={15} />
                <span>Unduh Data Profil (JSON)</span>
              </button>
            </div>
          </div>

          {/* KARTU 2: HAPUS SCAN WAJAH SAJA */}
          <div className="card privacy-card glass-card">
            <div className="card-header-icon">
              <div className="icon-wrap amber-bg"><Trash2 size={22} /></div>
              <div>
                <h3>Pembersihan Rekam Jejak Biometrik Wajah</h3>
                <p>
                  Musnahkan seluruh foto wajah dan skor pemindaian masa lalu Anda dari basis data operasional. Akun, kuota langganan, dan saldo koin Anda akan tetap utuh.
                </p>
              </div>
            </div>

            {scansDeletedSuccess && (
              <div className="alert-success-box animate-fade-in">
                <CheckCircle2 size={16} className="text-success" />
                <span>Seluruh riwayat pemindaian wajah Anda berhasil dimusnahkan secara bersih.</span>
              </div>
            )}

            <div className="card-actions">
              <button
                className="btn btn-outline btn-sm"
                onClick={handleDeleteFaceScans}
                disabled={isDeletingScans}
              >
                {isDeletingScans ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                <span>Hapus Rekam Jejak Scan Wajah Saja</span>
              </button>
            </div>
          </div>

          {/* KARTU 3: KETENTUAN HAK PRIVASI */}
          <div className="card privacy-card glass-card">
            <div className="card-header-icon">
              <div className="icon-wrap teal-bg"><Lock size={22} /></div>
              <div>
                <h3>Kebijakan &amp; Yurisdiksi Perlindungan Data</h3>
                <p>
                  Pelajari bagaimana kami mengamankan foto wajah di storage tertutup (*private bucket*) dan mengisolasi data transaksi kas non-PII.
                </p>
              </div>
            </div>
            <div className="card-actions">
              <Link to="/privacy" className="btn btn-outline btn-sm">
                <Eye size={15} />
                <span>Baca Kebijakan Privasi Lengkap</span>
              </Link>
            </div>
          </div>

          {/* KARTU 4: PENGHAPUSAN AKUN PERMANEN (DANGER ZONE) */}
          <div className="card danger-card glass-card">
            <div className="card-header-icon">
              <div className="icon-wrap rose-bg"><AlertTriangle size={22} /></div>
              <div>
                <h3 className="text-danger">Pemusnahan Akun Permanen (*Right to be Forgotten*)</h3>
                <p>
                  Menghapus akun Skincluv Anda secara permanen. Seluruh foto wajah, riwayat percakapan chatbot, profil kulit, saldo koin, dan kuota pass akan dimusnahkan seketika. Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>
            <div className="card-actions">
              <button
                className="btn btn-danger btn-sm"
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
          <div className="modal-backdrop animate-fade-in">
            <div className="delete-modal-card animate-scale-up">
              <div className="modal-icon-warning">
                <AlertTriangle size={36} />
              </div>
              <h2>Pemusnahan Akun Permanen</h2>
              <p className="modal-warning-text">
                Anda hendak menghapus akun <strong>{user?.email}</strong>. Seluruh riwayat foto wajah, hasil pemindaian, percakapan AI, dan kuota langganan yang tersisa akan <strong>dihapus permanen dan tidak dapat dipulihkan kembali</strong>.
              </p>

              {deleteError && (
                <div className="modal-error-banner">
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="confirmation-input-box">
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

              <div className="modal-buttons-row">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeletingAccount}
                >
                  Batalkan
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
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

      <style>{`
        .privacy-center-page {
          padding-bottom: 60px;
          max-width: 860px;
          margin: 0 auto;
          width: 100%;
        }

        .privacy-header {
          margin-bottom: 32px;
          position: relative;
        }

        .btn-back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: none;
          color: var(--color-primary, #0f6784);
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 0.875rem;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          text-decoration: none;
          margin-bottom: 12px;
        }

        .btn-back-link:hover {
          background: var(--color-surface-container-low, #f1f5f9);
        }

        .privacy-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          color: var(--color-primary, #0f6784);
          background: #e0f2fe;
          border: 1px solid #bae6fd;
          padding: 4px 12px;
          border-radius: var(--radius-full);
          margin-bottom: 8px;
        }

        .privacy-header h1 {
          font-family: var(--font-heading, sans-serif);
          font-size: 2rem;
          font-weight: 800;
          color: var(--color-text-main, #0f172a);
          margin: 4px 0 8px 0;
        }

        .privacy-subtitle {
          color: var(--color-text-muted, #64748b);
          font-size: 0.9375rem;
          line-height: 1.6;
        }

        .privacy-cards-stack {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .privacy-card {
          padding: 24px;
          border-radius: var(--radius-xl, 16px);
          background: #ffffff;
          border: 1px solid var(--color-secondary-container, #e2e8f0);
          box-shadow: var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.02));
        }

        .danger-card {
          padding: 24px;
          border-radius: var(--radius-xl, 16px);
          background: #ffffff;
          border: 1px solid #fecaca;
          border-left: 5px solid #ef4444;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.04);
        }

        .card-header-icon {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 20px;
        }

        .icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sky-bg {
          background: #e0f2fe;
          color: #0284c7;
        }

        .amber-bg {
          background: #fef3c7;
          color: #d97706;
        }

        .teal-bg {
          background: #ccfbf1;
          color: #0f766e;
        }

        .rose-bg {
          background: #ffe4e6;
          color: #e11d48;
        }

        .card-header-icon h3 {
          font-family: var(--font-heading, sans-serif);
          font-size: 1.0625rem;
          font-weight: 800;
          color: var(--color-text-main, #0f172a);
          margin: 0 0 4px 0;
        }

        .text-danger {
          color: #dc2626 !important;
        }

        .card-header-icon p {
          font-size: 0.875rem;
          color: var(--color-text-muted, #64748b);
          line-height: 1.5;
          margin: 0;
        }

        .card-actions {
          display: flex;
          justify-content: flex-end;
          padding-top: 16px;
          border-top: 1px solid #f1f5f9;
        }

        .alert-success-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #dcfce7;
          border: 1px solid #bbf7d0;
          color: #15803d;
          padding: 10px 14px;
          border-radius: var(--radius-md, 8px);
          font-size: 0.8125rem;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .btn-danger {
          background: #ef4444;
          color: #ffffff;
          border: none;
          font-weight: 700;
        }

        .btn-danger:hover {
          background: #dc2626;
        }

        /* MODAL */
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .delete-modal-card {
          background: #ffffff;
          border-radius: var(--radius-2xl, 20px);
          padding: 36px 28px;
          max-width: 480px;
          width: 100%;
          text-align: center;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }

        .modal-icon-warning {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #fee2e2;
          color: #dc2626;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }

        .delete-modal-card h2 {
          font-family: var(--font-heading, sans-serif);
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--color-text-main, #0f172a);
          margin: 0 0 10px 0;
        }

        .modal-warning-text {
          font-size: 0.875rem;
          color: var(--color-text-muted, #64748b);
          line-height: 1.6;
          margin: 0 0 20px 0;
        }

        .modal-error-banner {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 10px 14px;
          border-radius: var(--radius-md, 8px);
          font-size: 0.8125rem;
          margin-bottom: 16px;
        }

        .confirmation-input-box {
          text-align: left;
          margin-bottom: 24px;
        }

        .confirmation-input-box label {
          display: block;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #334155;
          margin-bottom: 8px;
        }

        .confirmation-input-box code {
          background: #f1f5f9;
          color: #dc2626;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .confirmation-input-box input {
          width: 100%;
          padding: 11px 14px;
          border: 1px solid #cbd5e1;
          border-radius: var(--radius-md, 8px);
          font-size: 0.875rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-align: center;
        }

        .confirmation-input-box input:focus {
          outline: none;
          border-color: #ef4444;
          box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
        }

        .modal-buttons-row {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
      `}</style>
    </div>
  )
}
