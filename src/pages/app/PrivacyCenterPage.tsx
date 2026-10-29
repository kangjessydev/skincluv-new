// src/pages/app/PrivacyCenterPage.tsx
// Pusat Kendali Privasi & Hak Pemilik Data Pribadi (UU PDP No. 27/2022)
// Mengimplementasikan Invarian 4 (Memory consent) & Invarian 20 (Dual-track deletion)

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ShieldCheck, Download, Trash2, AlertTriangle, ArrowLeft, CheckCircle2, Lock, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Button, Badge, BottomSheet, Toast } from '@/components/ui'

export default function PrivacyCenterPage() {
  const navigate = useNavigate()
  const { user, profile, activeSkinProfile, subscription, coinBalance, reset } = useAuthStore()

  // State Feedback Toast Resmi
  const [toast, setToast] = useState<{ type: 'success' | 'error'; title: string; message: string } | null>(null)

  // State Lembaran Modal Kebijakan Privasi (Khusus Mobile)
  const [showPrivacyDocSheet, setShowPrivacyDocSheet] = useState(false)

  // State untuk Hapus Scan Wajah Saja (Modal / Bottom Sheet)
  const [showDeleteScansModal, setShowDeleteScansModal] = useState(false)
  const [isDeletingScans, setIsDeletingScans] = useState(false)

  // State untuk Hapus Akun Permanen (Modal / Bottom Sheet)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [confirmationInput, setConfirmationInput] = useState('')
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // 1. Ekspor Data Pribadi (Data Portability)
  const handleExportData = () => {
    try {
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

      setToast({
        type: 'success',
        title: 'Berhasil Diunduh',
        message: 'Salinan data profil dan hak privasi telah disimpan sebagai berkas JSON.'
      })
    } catch {
      setToast({
        type: 'error',
        title: 'Gagal Mengunduh',
        message: 'Gagal mengekspor berkas data profil Anda. Silakan coba lagi.'
      })
    }
  }

  // 2. Eksekusi Hapus Scan Wajah Saja
  const executeDeleteFaceScans = async () => {
    if (!user?.id) return
    setIsDeletingScans(true)

    try {
      const { error } = await supabase.rpc('delete_user_face_scans_only', {
        p_user_id: user.id
      })

      if (error) throw error

      setShowDeleteScansModal(false)
      setToast({
        type: 'success',
        title: 'Foto Wajah Dimusnahkan',
        message: 'Seluruh rekam jejak foto wajah dan analitik visual telah dibersihkan secara permanen.'
      })
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Gagal Menghapus Scan',
        message: err?.message || 'Terjadi kesalahan sistem saat memproses pemusnahan foto.'
      })
    } finally {
      setIsDeletingScans(false)
    }
  }

  // 3. Hapus Seluruh Akun Permanen (Dual-Track Deletion)
  const handlePermanentlyDeleteAccount = async () => {
    if (!user?.id) return

    const targetEmail = (user.email || '').trim().toLowerCase()
    if (confirmationInput.trim().toLowerCase() !== targetEmail) {
      setDeleteError(`Harap ketik email akun Anda (${user.email}) secara tepat untuk konfirmasi.`)
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
            </button>

            {/* Row 2: Hapus Scan Wajah Saja */}
            <button
              type="button"
              className="cluv-menu-row"
              onClick={() => setShowDeleteScansModal(true)}
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
              {isDeletingScans && (
                <div className="cluv-menu-row-trailing">
                  <span className="cluv-spinner is-sm" />
                </div>
              )}
            </button>

            {/* Row 3: Kebijakan Privasi Lengkap (Membuka lembaran modal di mobile) */}
            <button
              type="button"
              className="cluv-menu-row"
              onClick={() => setShowPrivacyDocSheet(true)}
            >
              <div className="cluv-menu-row-main">
                <div className="cluv-menu-row-icon is-teal">
                  <Lock size={17} />
                </div>
                <div className="cluv-flex-col">
                  <span className="cluv-menu-row-title">Kebijakan Privasi Lengkap</span>
                  <p className="cluv-menu-row-desc">Kepatuhan UU PDP &amp; proteksi data</p>
                </div>
              </div>
            </button>
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

          <hr className="cluv-divider is-compact cluv-my-4" />
          <div className="cluv-flex-row cluv-justify-end">
            <Button
              variant="outline"
              size="sm"
              iconLeft={<Trash2 size={15} />}
              loading={isDeletingScans}
              onClick={() => setShowDeleteScansModal(true)}
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

      {/* ===================== BOTTOM SHEET RESMI: DOKUMEN KEBIJAKAN PRIVASI MOBILE ===================== */}
      <BottomSheet
        isOpen={showPrivacyDocSheet}
        onClose={() => setShowPrivacyDocSheet(false)}
        title={
          <div className="cluv-flex-row cluv-items-center cluv-gap-2.5">
            <div className="cluv-card-icon-wrap is-sm is-teal">
              <Lock size={16} />
            </div>
            <span>Kebijakan Privasi Skincluv</span>
          </div>
        }
        subtitle="Kepatuhan UU Pelindungan Data Pribadi (UU PDP No. 27/2022)"
      >
        <div
          className="cluv-flex-col cluv-gap-4 cluv-py-2"
          style={{
            fontSize: '0.8125rem',
            lineHeight: 1.6,
            color: 'var(--cluv-neutral-700, #334155)',
            maxHeight: '68vh',
            overflowY: 'auto'
          }}
        >
          <div>
            <h4 className="cluv-font-bold cluv-text-dark cluv-m-0 cluv-mb-1" style={{ fontSize: '0.875rem' }}>
              1. Jenis Data Pribadi yang Dikumpulkan
            </h4>
            <p className="cluv-m-0 cluv-mb-2 cluv-text-muted">
              Skincluv mengumpulkan data secara terbatas untuk keperluan operasional dan analitik kosmetik:
            </p>
            <ul className="cluv-flex-col cluv-gap-1.5 cluv-m-0" style={{ paddingLeft: '18px' }}>
              <li><strong>Data Pribadi Umum:</strong> Alamat email akun, nama tampilan profil, dan preferensi tipe kulit pengguna.</li>
              <li><strong>Data Pribadi Spesifik (Biometrik):</strong> Citra foto wajah untuk observasi visual kondisi kulit (Pasal 4 ayat 2 UU PDP No. 27/2022).</li>
              <li><strong>Data Transaksi:</strong> Nomor referensi transaksi dari Tripay Payment Gateway (kami tidak menyimpan nomor kartu/PIN perbankan).</li>
              <li><strong>Data Telemetri:</strong> Alamat IP dan jenis peramban demi pencegahan penyalahgunaan API.</li>
            </ul>
          </div>

          <div>
            <h4 className="cluv-font-bold cluv-text-dark cluv-m-0 cluv-mb-1" style={{ fontSize: '0.875rem' }}>
              2. Dasar Hukum &amp; Tujuan Pemrosesan
            </h4>
            <p className="cluv-m-0 cluv-mb-2 cluv-text-muted">
              Pemrosesan dilakukan berdasarkan persetujuan eksplisit (<em>explicit consent</em>) untuk:
            </p>
            <ul className="cluv-flex-col cluv-gap-1.5 cluv-m-0" style={{ paddingLeft: '18px' }}>
              <li>Mengekstraksi indikator visual kulit (kelembaban, kemerahan, sebum, dan pori-pori) melalui visi komputer.</li>
              <li>Memberikan edukasi komposisi skincare non-terapeutik yang relevan dengan tipe kulit.</li>
              <li>Mengelola kuota langganan AI dan riwayat grafik tren perkembangan kulit 28 hari.</li>
            </ul>
          </div>

          <div>
            <h4 className="cluv-font-bold cluv-text-dark cluv-m-0 cluv-mb-1" style={{ fontSize: '0.875rem' }}>
              3. Keamanan, Enkripsi, &amp; Penyimpanan
            </h4>
            <ul className="cluv-flex-col cluv-gap-1.5 cluv-m-0" style={{ paddingLeft: '18px' }}>
              <li><strong>Enkripsi:</strong> TLS 1.3 in-transit dan enkripsi AES-256 at-rest.</li>
              <li><strong>Private Storage:</strong> Foto wajah disimpan di cloud storage tertutup tanpa URL publik permanen, hanya dapat diakses melalui URL bertanda tangan kriptografis berbatas waktu (maksimal 60 menit).</li>
              <li><strong>Row Level Security (RLS):</strong> Akses data terkunci di level database hanya untuk akun pemiliknya.</li>
            </ul>
          </div>

          <div>
            <h4 className="cluv-font-bold cluv-text-dark cluv-m-0 cluv-mb-1" style={{ fontSize: '0.875rem' }}>
              4. Pihak Ketiga &amp; Pemroses AI
            </h4>
            <ul className="cluv-flex-col cluv-gap-1.5 cluv-m-0" style={{ paddingLeft: '18px' }}>
              <li><strong>Model AI (Google Cloud Vertex / OpenRouter):</strong> Data diproses seketika untuk inferensi dan tidak digunakan untuk melatih model publik.</li>
              <li><strong>Gerbang Pembayaran (Tripay):</strong> Untuk verifikasi transaksi perbankan dan QRIS.</li>
              <li><strong>Pencarian Dermatologi (Tavily):</strong> Kueri bahan disanitasi dari kata ganti orang pertama demi privasi.</li>
            </ul>
          </div>

          <div>
            <h4 className="cluv-font-bold cluv-text-dark cluv-m-0 cluv-mb-1" style={{ fontSize: '0.875rem' }}>
              5. Hak-Hak Pemilik Data (UU PDP No. 27/2022)
            </h4>
            <ul className="cluv-flex-col cluv-gap-1.5 cluv-m-0" style={{ paddingLeft: '18px' }}>
              <li><strong>Hak Akses &amp; Portabilitas:</strong> Hak mengunduh salinan data pribadi (format JSON).</li>
              <li><strong>Hak Penarikan Persetujuan:</strong> Mematikan memori AI memicu penghapusan riwayat percakapan.</li>
              <li><strong>Hak Penghapusan Mandiri:</strong> Hak memusnahkan riwayat scan atau seluruh akun kapan saja.</li>
            </ul>
          </div>

          <div>
            <h4 className="cluv-font-bold cluv-text-dark cluv-m-0 cluv-mb-1" style={{ fontSize: '0.875rem' }}>
              6. Siklus Penghapusan &amp; Retensi (Dual-Track)
            </h4>
            <ul className="cluv-flex-col cluv-gap-1.5 cluv-m-0" style={{ paddingLeft: '18px' }}>
              <li><strong>Data Biometrik:</strong> Foto wajah dan data analitik dimusnahkan secara menyeluruh seketika dari sistem aktif.</li>
              <li><strong>Catatan Transaksi Finansial:</strong> Invoice kas dipertahankan untuk pembukuan pajak dengan melepaskan identitas personal pengguna (diset menjadi <code>NULL</code>).</li>
              <li><strong>Cadangan Terenkripsi:</strong> Snapshot cadangan otomatis terhapus dalam siklus maksimal 30 hari.</li>
            </ul>
          </div>

          <div>
            <h4 className="cluv-font-bold cluv-text-dark cluv-m-0 cluv-mb-1" style={{ fontSize: '0.875rem' }}>
              7. Kontak Petugas Pelindungan Data (DPO)
            </h4>
            <p className="cluv-m-0 cluv-mb-1 cluv-text-muted">
              Pertanyaan atau permohonan hak atas data pribadi dapat dialamatkan ke:
            </p>
            <p className="cluv-m-0">
              Email: <code>privacy@skincluv.com</code> / <code>support@skincluv.com</code>
            </p>
            <p className="cluv-m-0 cluv-caption cluv-text-muted">
              Waktu respons maksimal 3 &times; 24 jam kerja sesuai ketentuan UU PDP.
            </p>
          </div>
        </div>
      </BottomSheet>

      {/* ===================== BOTTOM SHEET RESMI: HAPUS SCAN WAJAH ===================== */}
      <BottomSheet
        isOpen={showDeleteScansModal}
        onClose={() => !isDeletingScans && setShowDeleteScansModal(false)}
        title={
          <div className="cluv-flex-row cluv-items-center cluv-gap-2.5">
            <div className="cluv-card-icon-wrap is-sm is-rose">
              <Trash2 size={16} />
            </div>
            <span>Hapus Rekam Jejak Wajah?</span>
          </div>
        }
      >
        <div className="cluv-flex-col cluv-gap-3 cluv-pt-1">
          <p className="cluv-m-0 cluv-font-bold cluv-text-dark" style={{ fontSize: '0.875rem' }}>
            Apakah Anda yakin ingin memusnahkan seluruh rekam jejak foto dan pemindaian wajah Anda?
          </p>
          <p className="cluv-m-0 cluv-text-muted" style={{ fontSize: '0.78125rem', lineHeight: '1.45' }}>
            Tindakan ini tidak dapat dibatalkan. Seluruh berkas foto wajah fisik di penyimpanan aman dan riwayat analitik visual akan dihapus bersih. Akun, kuota langganan, dan saldo AI Credits Anda tetap utuh.
          </p>

          <div className="cluv-pt-1 cluv-w-full">
            <Button
              variant="danger"
              size="sm"
              block
              loading={isDeletingScans}
              onClick={executeDeleteFaceScans}
            >
              Hapus Seluruh Foto Wajah
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* ===================== BOTTOM SHEET RESMI: HAPUS AKUN PERMANEN ===================== */}
      <BottomSheet
        isOpen={showDeleteModal}
        onClose={() => !isDeletingAccount && setShowDeleteModal(false)}
        title={
          <div className="cluv-flex-row cluv-items-center cluv-gap-2.5 cluv-text-rose">
            <div className="cluv-card-icon-wrap is-sm is-rose">
              <AlertTriangle size={16} />
            </div>
            <span>Pemusnahan Akun Permanen</span>
          </div>
        }
      >
        <div className="cluv-flex-col cluv-gap-3 cluv-pt-1">
          <p className="cluv-m-0 cluv-text-muted" style={{ fontSize: '0.8125rem', lineHeight: '1.45' }}>
            Anda hendak menghapus akun <strong>{user?.email}</strong>. Seluruh riwayat foto wajah, hasil pemindaian, percakapan AI, dan kuota langganan yang tersisa akan <strong>dihapus permanen dan tidak dapat dipulihkan</strong>.
          </p>

          {deleteError && (
            <div className="cluv-alert is-danger is-sm">
              <AlertTriangle size={15} className="cluv-alert-icon" />
              <div className="cluv-alert-content">
                <p className="cluv-alert-message">{deleteError}</p>
              </div>
            </div>
          )}

          <div className="cluv-field cluv-m-0">
            <label htmlFor="confirm-delete" className="cluv-label" style={{ fontSize: '0.78125rem' }}>
              Ketik email Anda untuk konfirmasi:
            </label>
            <input
              id="confirm-delete"
              type="email"
              className="cluv-input"
              placeholder={user?.email || 'email@contoh.com'}
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              autoComplete="off"
              disabled={isDeletingAccount}
              style={{ height: '38px', fontSize: '0.8125rem' }}
            />
          </div>

          <div className="cluv-pt-1 cluv-w-full">
            <Button
              variant="danger"
              size="sm"
              block
              loading={isDeletingAccount}
              disabled={confirmationInput.trim().toLowerCase() !== (user?.email || '').trim().toLowerCase()}
              onClick={handlePermanentlyDeleteAccount}
            >
              Hapus Akun Permanen
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* ===================== FLOATING TOAST NOTIFICATION ===================== */}
      <Toast
        isOpen={!!toast}
        onClose={() => setToast(null)}
        variant={toast?.type}
        title={toast?.title}
        message={toast?.message}
        duration={4000}
      />
    </div>
  )
}
