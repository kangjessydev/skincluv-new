// src/components/layout/PublicLayout.tsx
// Public Layout Shell for Skincluv — Zero-parser, lightweight, SEO-friendly, mobile-responsive

import { Link, Outlet, useLocation } from 'react-router-dom'
import { Sparkles, ArrowRight, ShieldCheck, HeartHandshake, FileText, HelpCircle, Mail, Info, LogIn, LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export default function PublicLayout() {
  const { user } = useAuthStore()
  const location = useLocation()

  return (
    <div className="public-shell">
      {/* PUBLIC NAVBAR */}
      <header className="public-navbar">
        <div className="public-nav-container">
          <Link to="/" className="public-brand" aria-label="Skincluv Beranda">
            <div className="public-brand-icon">
              <Sparkles size={20} />
            </div>
            <span className="public-brand-text">
              Skin<span className="text-highlight">cluv</span>
            </span>
          </Link>

          <nav className="public-nav-menu" aria-label="Navigasi Utama">
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Beranda</Link>
            <Link to="/pricing" className={location.pathname === '/pricing' ? 'active' : ''}>Paket Akses</Link>
            <Link to="/faq" className={location.pathname === '/faq' ? 'active' : ''}>Pusat Bantuan</Link>
            <Link to="/medical-disclaimer" className={location.pathname === '/medical-disclaimer' ? 'active' : ''}>Penyangkalan Medis</Link>
            <Link to="/contact" className={location.pathname === '/contact' ? 'active' : ''}>Kontak</Link>
          </nav>

          <div className="public-nav-cta">
            {user ? (
              <Link to="/" className="btn btn-primary btn-sm">
                <LayoutDashboard size={15} />
                <span>Dashboard</span>
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline btn-sm">
                  <LogIn size={15} />
                  <span>Masuk</span>
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm hide-mobile">
                  <span>Daftar Gratis</span>
                  <ArrowRight size={14} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* OUTLET KONTEN UTAMA */}
      <main className="public-main-content">
        <Outlet />
      </main>

      {/* PUBLIC COMPREHENSIVE FOOTER */}
      <footer className="public-footer">
        <div className="public-footer-inner">
          <div className="footer-top-grid">
            {/* Kolom 1: Brand & Visi */}
            <div className="footer-col brand-col">
              <div className="footer-brand">
                <div className="public-brand-icon-sm">
                  <Sparkles size={16} />
                </div>
                <span className="footer-brand-title">Skin<span>cluv</span></span>
              </div>
              <p className="footer-bio">
                Platform kecerdasan buatan analitik kosmetik dan edukasi perawatan kulit preventif mandiri. Dirancang untuk transparansi bahan skincare tanpa klaim berlebihan.
              </p>
              <div className="footer-security-pill">
                <ShieldCheck size={14} className="icon-shield" />
                <span>Kepatuhan UU PDP No. 27/2022 • Enkripsi Data Pribadi</span>
              </div>
            </div>

            {/* Kolom 2: Produk & Akses */}
            <div className="footer-col">
              <h4>Layanan & Akses</h4>
              <ul>
                <li><Link to="/pricing">Paket Akses Prepaid 30 Hari</Link></li>
                <li><Link to="/#features">AI Skin Assessment Wajah</Link></li>
                <li><Link to="/#features">Cek Komposisi Kosmetik</Link></li>
                <li><Link to="/#features">Skinsistant AI Chatbot</Link></li>
                <li><Link to="/faq">Sistem Koin Misi Harian</Link></li>
              </ul>
            </div>

            {/* Kolom 3: Regulasi & Hukum */}
            <div className="footer-col">
              <h4>Kepatuhan & Hukum</h4>
              <ul>
                <li><Link to="/medical-disclaimer">Penyangkalan Medis (Non-Terapeutik)</Link></li>
                <li><Link to="/refund-policy">Kebijakan Pengembalian Dana (Tripay)</Link></li>
                <li><Link to="/terms">Syarat &amp; Ketentuan Layanan</Link></li>
                <li><Link to="/privacy">Kebijakan Privasi &amp; Data Biometrik</Link></li>
              </ul>
            </div>

            {/* Kolom 4: Dukungan & Perusahaan */}
            <div className="footer-col">
              <h4>Bantuan & Kontak</h4>
              <ul>
                <li><Link to="/faq">Tanya Jawab (FAQ)</Link></li>
                <li><Link to="/contact">Hubungi Dukungan CS Resmi</Link></li>
                <li><Link to="/about">Tentang Skincluv &amp; Metodologi</Link></li>
                <li><span className="badge-status-online">Sistem Operasional Normal</span></li>
              </ul>
            </div>
          </div>

          <div className="footer-divider" />

          {/* Baris Bawah: Hak Cipta & Non-Therapeutic Demarcation */}
          <div className="footer-bottom">
            <p className="copyright-text">
              &copy; {new Date().getFullYear()} Skincluv. Seluruh hak cipta dilindungi undang-undang Republik Indonesia.
            </p>
            <p className="medical-footnote">
              <strong>Penyangkalan Medis:</strong> Skincluv adalah platform perangkat lunak analitik edukatif independen, bukan fasilitas pelayanan kesehatan, bukan penyedia telemedisin klinis, dan bukan apotek. Hasil observasi algoritmik BUKAN diagnosis medis dan tidak menggantikan pemeriksaan langsung oleh dokter spesialis dermatologi dan venereologi (Sp.DVE/Sp.KK).
            </p>
          </div>
        </div>
      </footer>

      {/* STYLING VANILLA CSS DENGAN DESIGN TOKENS */}
      <style>{`
        .public-shell {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--color-surface-bg, #f8fafc);
          color: var(--color-text-main, #0f172a);
          font-family: var(--font-body, 'Inter', sans-serif);
        }

        /* NAVBAR */
        .public-navbar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--color-secondary-container, #e2e8f0);
          height: 64px;
        }

        .public-nav-container {
          max-width: 1200px;
          height: 100%;
          margin: 0 auto;
          padding: 0 var(--space-lg, 24px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-md, 16px);
        }

        .public-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: var(--color-primary, #0f6784);
        }

        .public-brand-icon {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md, 10px);
          background: linear-gradient(135deg, var(--color-primary, #0f6784), #0284c7);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(15, 103, 132, 0.25);
        }

        .public-brand-text {
          font-family: var(--font-heading, 'Plus Jakarta Sans', sans-serif);
          font-weight: 800;
          font-size: 1.25rem;
          letter-spacing: -0.02em;
        }

        .text-highlight {
          color: #0284c7;
        }

        .public-nav-menu {
          display: none;
          align-items: center;
          gap: 24px;
        }

        @media (min-width: 840px) {
          .public-nav-menu {
            display: flex;
          }
        }

        .public-nav-menu a {
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-text-muted, #64748b);
          transition: color 0.15s ease;
          padding: 6px 0;
        }

        .public-nav-menu a:hover,
        .public-nav-menu a.active {
          color: var(--color-primary, #0f6784);
        }

        .public-nav-cta {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        @media (max-width: 640px) {
          .hide-mobile {
            display: none !important;
          }
        }

        /* MAIN CONTENT */
        .public-main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        /* FOOTER */
        .public-footer {
          background: #ffffff;
          border-top: 1px solid var(--color-secondary-container, #e2e8f0);
          padding: 60px 0 32px;
          margin-top: auto;
        }

        .public-footer-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 var(--space-lg, 24px);
        }

        .footer-top-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 40px;
          margin-bottom: 48px;
        }

        @media (min-width: 768px) {
          .footer-top-grid {
            grid-template-columns: 1.6fr 1fr 1fr 1fr;
            gap: 32px;
          }
        }

        .footer-col h4 {
          font-family: var(--font-heading, sans-serif);
          font-size: 0.875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-main, #0f172a);
          margin: 0 0 16px 0;
        }

        .footer-col ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .footer-col ul a {
          text-decoration: none;
          font-size: 0.8125rem;
          color: var(--color-text-muted, #64748b);
          transition: color 0.15s ease;
        }

        .footer-col ul a:hover {
          color: var(--color-primary, #0f6784);
          text-decoration: underline;
        }

        .footer-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .public-brand-icon-sm {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: var(--color-primary, #0f6784);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .footer-brand-title {
          font-family: var(--font-heading, sans-serif);
          font-weight: 800;
          font-size: 1.125rem;
          color: var(--color-primary, #0f6784);
        }

        .footer-brand-title span {
          color: #0284c7;
        }

        .footer-bio {
          font-size: 0.8125rem;
          color: var(--color-text-muted, #64748b);
          line-height: 1.6;
          margin: 0 0 16px 0;
          max-width: 340px;
        }

        .footer-security-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.6875rem;
          font-weight: 700;
          color: #0369a1;
          background: #e0f2fe;
          border: 1px solid #bae6fd;
          padding: 4px 10px;
          border-radius: var(--radius-full, 9999px);
        }

        .icon-shield {
          color: #0284c7;
        }

        .badge-status-online {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.6875rem;
          font-weight: 700;
          color: #15803d;
          background: #dcfce7;
          border: 1px solid #bbf7d0;
          padding: 4px 8px;
          border-radius: var(--radius-full, 9999px);
        }

        .badge-status-online::before {
          content: '';
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
        }

        .footer-divider {
          height: 1px;
          background: var(--color-secondary-container, #e2e8f0);
          margin-bottom: 24px;
        }

        .footer-bottom {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .copyright-text {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-text-muted, #64748b);
          margin: 0;
        }

        .medical-footnote {
          font-size: 0.6875rem;
          color: #94a3b8;
          line-height: 1.5;
          margin: 0;
        }

        .medical-footnote strong {
          color: var(--color-text-muted, #64748b);
        }
      `}</style>
    </div>
  )
}
