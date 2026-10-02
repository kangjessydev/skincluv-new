// src/components/layout/PublicLayout.tsx
// Public Layout Shell for Skincluv — Zero-parser, lightweight, SEO-friendly, mobile-responsive

import { Link, Outlet, useLocation } from 'react-router-dom'
import { Sparkles, ArrowRight, ShieldCheck, HeartHandshake, FileText, HelpCircle, Mail, Info, LogIn, LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import '@/styles/public-layout.css'

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
                <li><Link to="/faq">Sistem AI Credits &amp; Misi</Link></li>
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


    </div>
  )
}
