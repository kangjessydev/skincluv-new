import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  Cpu,
  Target,
  CreditCard,
  Package,
  ShieldCheck,
  ArrowRight,
  Activity,
  BookOpen,
  FlaskConical,
  BarChart3,
  Users,
  BookMarked,
  Layers,
  Server,
  CheckCircle2,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export default function AdminDashboardPage() {
  const { userRoles, isAdmin } = useAuthStore()

  const isSuper = useMemo(() => {
    return userRoles.includes('super_admin') || userRoles.includes('admin') || (!userRoles.length && isAdmin)
  }, [userRoles, isAdmin])

  const canSeeBusiness = useMemo(() => {
    return isSuper || userRoles.includes('business_lead')
  }, [isSuper, userRoles])

  const canSeeUsers = useMemo(() => {
    return isSuper || userRoles.includes('business_lead') || userRoles.includes('support_agent')
  }, [isSuper, userRoles])

  const canSeeConfig = useMemo(() => {
    return isSuper || userRoles.includes('tech_lead')
  }, [isSuper, userRoles])

  const canSeeAiBrain = useMemo(() => {
    return isSuper || userRoles.includes('tech_lead') || userRoles.includes('clinical_reviewer')
  }, [isSuper, userRoles])

  return (
    <div className="admin-page-container">
      {/* Page Header */}
      <div className="admin-page-header">
        <div className="admin-page-header-title">
          <div className="cluv-flex cluv-items-center cluv-gap-2 cluv-mb-1">
            <span className="cluv-badge is-sm is-teal">Control Center</span>
            <span className="cluv-badge is-sm is-purple">Skincluv OS</span>
          </div>
          <h1 className="cluv-title-section" style={{ margin: 0 }}>
            Admin Overview
          </h1>
          <p className="cluv-subtitle cluv-mt-1">
            Pusat kendali operasional Skincluv: riset pasar teragregasi, unit economics, transaksi pembayaran, CRM, konfigurasi AI, dan observabilitas sistem.
          </p>
        </div>
      </div>

      {/* Section 1: Bisnis, Transaksi & Riset Pasar */}
      {(canSeeBusiness || canSeeUsers) && (
        <>
          <div className="admin-section-block">
            <h2 className="admin-section-title">
              Bisnis, Finansial & Riset Pasar
            </h2>
            <p className="admin-section-desc">
              Pantau omzet transaksi, unit economics model AI, matriks korelasi pasar, dan manajemen pengguna.
            </p>
          </div>

          <div className="admin-overview-grid">
            {canSeeBusiness && (
              <>
                <Link to="/admin/market-intelligence" className="cluv-card is-interactive cluv-hover-lift admin-overview-card">
                  <div className="admin-overview-card-body">
                    <div className="cluv-card-icon-wrap is-blue">
                      <BarChart3 size={20} />
                    </div>
                    <h3 className="admin-overview-card-title">
                      Tren & Riset Pasar
                    </h3>
                    <p className="admin-overview-card-desc">
                      Demografi jenis kulit, top 10 keluhan terbanyak, dan matriks korelasi kebutuhan vs produk kosmetik (100% anonim).
                    </p>
                  </div>
                  <div className="admin-overview-card-cta is-blue">
                    <span>Lihat Riset Pasar</span>
                    <ArrowRight size={14} />
                  </div>
                </Link>

                <Link to="/admin/transactions" className="cluv-card is-interactive cluv-hover-lift admin-overview-card">
                  <div className="admin-overview-card-body">
                    <div className="cluv-card-icon-wrap">
                      <CreditCard size={20} />
                    </div>
                    <h3 className="admin-overview-card-title">
                      Riwayat Transaksi
                    </h3>
                    <p className="admin-overview-card-desc">
                      Catatan invoice pembayaran langganan Tripay, status lunas, nominal omzet, dan rincian transaksi user.
                    </p>
                  </div>
                  <div className="admin-overview-card-cta">
                    <span>Buka Transaksi</span>
                    <ArrowRight size={14} />
                  </div>
                </Link>

                <Link to="/admin/financials" className="cluv-card is-interactive cluv-hover-lift admin-overview-card">
                  <div className="admin-overview-card-body">
                    <div className="cluv-card-icon-wrap is-gold">
                      <BarChart3 size={20} />
                    </div>
                    <h3 className="admin-overview-card-title">
                      Unit Economics AI
                    </h3>
                    <p className="admin-overview-card-desc">
                      Kalkulasi gross profit margin, perbandingan omzet vs biaya token LLM, dan simulator diskon promo.
                    </p>
                  </div>
                  <div className="admin-overview-card-cta is-gold">
                    <span>Analisis Finansial</span>
                    <ArrowRight size={14} />
                  </div>
                </Link>
              </>
            )}

            {canSeeUsers && (
              <Link to="/admin/users" className="cluv-card is-interactive cluv-hover-lift admin-overview-card">
                <div className="admin-overview-card-body">
                  <div className="cluv-card-icon-wrap is-rose">
                    <Users size={20} />
                  </div>
                  <h3 className="admin-overview-card-title">
                    Manajemen Pengguna
                  </h3>
                  <p className="admin-overview-card-desc">
                    Daftar akun pelanggan, tier membership aktif, saldo credits, dan aksi cepat CS untuk top-up koin.
                  </p>
                </div>
                <div className="admin-overview-card-cta is-rose">
                  <span>Kelola Pengguna</span>
                  <ArrowRight size={14} />
                </div>
              </Link>
            )}
          </div>
        </>
      )}

      {/* Section 2: Konfigurasi Sistem */}
      {canSeeConfig && (
        <>
          <div className="admin-section-block">
            <h2 className="admin-section-title">
              Konfigurasi Sistem AI & Operasional
            </h2>
            <p className="admin-section-desc">
              Atur parameter operasional, model LLM, prompt engineering, gamifikasi, dan paket.
            </p>
          </div>

          <div className="admin-overview-grid">
            <Link to="/admin/prompts" className="cluv-card is-interactive cluv-hover-lift admin-overview-card">
              <div className="admin-overview-card-body">
                <div className="cluv-card-icon-wrap is-blue">
                  <FileText size={20} />
                </div>
                <h3 className="admin-overview-card-title">
                  Prompt & Fitur AI
                </h3>
                <p className="admin-overview-card-desc">
                  Atur system prompt aktif, riwayat versi prompt, dan catatan kalibrasi per fitur AI.
                </p>
              </div>
              <div className="admin-overview-card-cta is-blue">
                <span>Kelola Prompt</span>
                <ArrowRight size={14} />
              </div>
            </Link>

            <Link to="/admin/models" className="cluv-card is-interactive cluv-hover-lift admin-overview-card">
              <div className="admin-overview-card-body">
                <div className="cluv-card-icon-wrap">
                  <Cpu size={20} />
                </div>
                <h3 className="admin-overview-card-title">
                  Model & API Key
                </h3>
                <p className="admin-overview-card-desc">
                  Konfigurasi model LLM (Gemini, Claude, GPT) dan simpan API key secara terenkripsi ke Vault.
                </p>
              </div>
              <div className="admin-overview-card-cta">
                <span>Kelola Model</span>
                <ArrowRight size={14} />
              </div>
            </Link>

            <Link to="/admin/missions" className="cluv-card is-interactive cluv-hover-lift admin-overview-card">
              <div className="admin-overview-card-body">
                <div className="cluv-card-icon-wrap is-gold">
                  <Target size={20} />
                </div>
                <h3 className="admin-overview-card-title">
                  Misi Glow
                </h3>
                <p className="admin-overview-card-desc">
                  Kelola misi harian, mingguan, target count, cooldown, dan reward koin/credit pengguna.
                </p>
              </div>
              <div className="admin-overview-card-cta is-gold">
                <span>Kelola Misi</span>
                <ArrowRight size={14} />
              </div>
            </Link>

            <Link to="/admin/pricing" className="cluv-card is-interactive cluv-hover-lift admin-overview-card">
              <div className="admin-overview-card-body">
                <div className="cluv-card-icon-wrap is-purple">
                  <Layers size={20} />
                </div>
                <h3 className="admin-overview-card-title">
                  Paket & Kuota
                </h3>
                <p className="admin-overview-card-desc">
                  Atur harga paket membership (Free, Glow, Pro) dan matriks kuota bulanan tiap fitur AI.
                </p>
              </div>
              <div className="admin-overview-card-cta is-purple">
                <span>Kelola Paket</span>
                <ArrowRight size={14} />
              </div>
            </Link>

            <Link to="/admin/products" className="cluv-card is-interactive cluv-hover-lift admin-overview-card">
              <div className="admin-overview-card-body">
                <div className="cluv-card-icon-wrap is-rose">
                  <Package size={20} />
                </div>
                <h3 className="admin-overview-card-title">
                  Produk Rekomendasi
                </h3>
                <p className="admin-overview-card-desc">
                  Katalog produk skincare untuk rekomendasi engine AI di Scan Wajah dan Skinsistant.
                </p>
              </div>
              <div className="admin-overview-card-cta is-rose">
                <span>Kelola Produk</span>
                <ArrowRight size={14} />
              </div>
            </Link>

            <div className="cluv-card admin-overview-card">
              <div className="admin-overview-card-body">
                <div className="cluv-card-icon-wrap is-purple">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="admin-overview-card-title">
                  Keamanan RBAC & Vault
                </h3>
                <p className="admin-overview-card-desc">
                  Sistem diamankan dengan PostgreSQL RLS level-database dan Supabase Vault enkripsi AEAD.
                </p>
              </div>
              <div className="admin-overview-card-cta is-emerald">
                <CheckCircle2 size={15} />
                <span>Sistem Aktif & Terlindungi</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Section 3: AI Brain & Knowledge Hub */}
      {canSeeAiBrain && (
        <>
          <div className="admin-section-block">
            <h2 className="admin-section-title">
              AI Knowledge & Training Hub (Autonomous Data Flywheel)
            </h2>
            <p className="admin-section-desc">
              Basis data pengetahuan kosmetik, formula semantic cache, memori klinis pasien, dan fine-tuning training center.
            </p>
          </div>

          <div className="admin-overview-grid">
            <Link to="/admin/knowledge/handbook" className="cluv-card is-interactive cluv-hover-lift admin-overview-card">
              <div className="admin-overview-card-body">
                <div className="cluv-card-icon-wrap is-blue">
                  <BookMarked size={20} />
                </div>
                <h3 className="admin-overview-card-title">
                  Buku Panduan Fitur (Handbook)
                </h3>
                <p className="admin-overview-card-desc">
                  Ontologi resmi produk internal untuk mencegah Skinsistant halusinasi fitur dan batasan layanan (RFC 013).
                </p>
              </div>
              <div className="admin-overview-card-cta is-blue">
                <span>Kelola Panduan Fitur</span>
                <ArrowRight size={14} />
              </div>
            </Link>

            <Link to="/admin/knowledge/ingredients" className="cluv-card is-interactive cluv-hover-lift admin-overview-card">
              <div className="admin-overview-card-body">
                <div className="cluv-card-icon-wrap">
                  <BookOpen size={20} />
                </div>
                <h3 className="admin-overview-card-title">
                  Kamus Bahan AI (Knowledge Base)
                </h3>
                <p className="admin-overview-card-desc">
                  Ensiklopedia bahan skincare terstandar yang secara otomatis dipelajari dan diperkaya oleh AI dari setiap scan pengguna.
                </p>
              </div>
              <div className="admin-overview-card-cta">
                <span>Buka Kamus Bahan</span>
                <ArrowRight size={14} />
              </div>
            </Link>

            <Link to="/admin/knowledge/formulas" className="cluv-card is-interactive cluv-hover-lift admin-overview-card">
              <div className="admin-overview-card-body">
                <div className="cluv-card-icon-wrap is-rose">
                  <FlaskConical size={20} />
                </div>
                <h3 className="admin-overview-card-title">
                  Formula & Semantic Cache
                </h3>
                <p className="admin-overview-card-desc">
                  Big data formula produk yang menghemat ribuan token AI dan menghadirkan respons scan secepat kilat (&lt;0.3 detik).
                </p>
              </div>
              <div className="admin-overview-card-cta is-rose">
                <span>Lihat Formula Cache</span>
                <ArrowRight size={14} />
              </div>
            </Link>

            <Link to="/admin/logs" className="cluv-card is-interactive cluv-hover-lift admin-overview-card">
              <div className="admin-overview-card-body">
                <div className="cluv-card-icon-wrap is-gold">
                  <Activity size={20} />
                </div>
                <h3 className="admin-overview-card-title">
                  Log Metrik & Observabilitas
                </h3>
                <p className="admin-overview-card-desc">
                  Telemetri performa latensi, jumlah token yang digunakan, status eksekusi, serta feedback kepuasan user.
                </p>
              </div>
              <div className="admin-overview-card-cta is-gold">
                <span>Lihat Metrik & Log</span>
                <ArrowRight size={14} />
              </div>
            </Link>
          </div>
        </>
      )}

      {/* Section 4: Tata Kelola & Observabilitas Sistem */}
      {isSuper && (
        <>
          <div className="admin-section-block">
            <h2 className="admin-section-title">
              Tata Kelola & Observabilitas Sistem
            </h2>
            <p className="admin-section-desc">
              Pusat audit tata kelola platform, jejak aktivitas staf, dan monitoring status kesehatan backend.
            </p>
          </div>

          <div className="admin-overview-grid">
            <Link to="/admin/audit-logs" className="cluv-card is-interactive cluv-hover-lift admin-overview-card">
              <div className="admin-overview-card-body">
                <div className="cluv-card-icon-wrap is-purple">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="admin-overview-card-title">
                  Audit Log Tata Kelola
                </h3>
                <p className="admin-overview-card-desc">
                  Jejak audit aktivitas staf admin, perubahan konfigurasi, dan kepatuhan privasi data pengguna (UU PDP).
                </p>
              </div>
              <div className="admin-overview-card-cta is-purple">
                <span>Lihat Log Audit</span>
                <ArrowRight size={14} />
              </div>
            </Link>

            <Link to="/admin/system-health" className="cluv-card is-interactive cluv-hover-lift admin-overview-card">
              <div className="admin-overview-card-body">
                <div className="cluv-card-icon-wrap">
                  <Server size={20} />
                </div>
                <h3 className="admin-overview-card-title">
                  Status & Kesehatan Sistem
                </h3>
                <p className="admin-overview-card-desc">
                  Pemantauan real-time status database Supabase, edge functions, cron jobs, dan metrik latensi infrastruktur.
                </p>
              </div>
              <div className="admin-overview-card-cta">
                <span>Periksa Kesehatan Sistem</span>
                <ArrowRight size={14} />
              </div>
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
