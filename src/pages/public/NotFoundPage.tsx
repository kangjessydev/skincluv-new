// src/pages/public/NotFoundPage.tsx
// Halaman 404 (Not Found) yang Ramah Pengguna — Vanilla CSS

import { Link } from 'react-router-dom'
import { Sparkles, Home, HelpCircle, ArrowLeft, Search } from 'lucide-react'
import '@/styles/public-pages.css'

export default function NotFoundPage() {
  return (
    <div className="not-found-page animate-fade-in">
      <div className="not-found-card">
        <div className="not-found-visual">
          <div className="error-code-badge">404</div>
          <div className="visual-ring">
            <Search size={40} className="icon-search" />
          </div>
        </div>

        <h1>Halaman Tidak Ditemukan</h1>
        <p className="not-found-desc">
          Maaf, halaman yang Anda tuju mungkin telah dipindahkan, tautan salah ketik, atau masa berlakunya telah berakhir.
        </p>

        <div className="not-found-actions">
          <Link to="/" className="btn btn-primary btn-sm">
            <Home size={15} />
            <span>Kembali ke Beranda</span>
          </Link>
          <Link to="/faq" className="btn btn-outline btn-sm">
            <HelpCircle size={15} />
            <span>Pusat Bantuan &amp; FAQ</span>
          </Link>
        </div>

        <div className="popular-links-box">
          <span className="popular-label">Tautan Cepat yang Mungkin Anda Cari:</span>
          <div className="popular-links">
            <Link to="/pricing">Paket Akses</Link>
            <span>•</span>
            <Link to="/contact">Kontak Dukungan</Link>
            <span>•</span>
            <Link to="/terms">Syarat Layanan</Link>
            <span>•</span>
            <Link to="/medical-disclaimer">Penyangkalan Medis</Link>
          </div>
        </div>
      </div>


    </div>
  )
}
