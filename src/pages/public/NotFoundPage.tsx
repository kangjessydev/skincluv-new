// src/pages/public/NotFoundPage.tsx
// Halaman 404 (Not Found) Ramah Pengguna (100% Cluv Micro-Framework Standard)

import { Link } from 'react-router-dom'
import { Home, HelpCircle, Search } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="cluv-page is-centered cluv-surface-public">
      <section className="cluv-section">
        <div className="cluv-container is-narrow">
          <div className="cluv-card cluv-text-center cluv-items-center cluv-py-7">
            {/* 404 VISUAL CUE */}
            <div className="cluv-status-cue">
              <div className="cluv-status-cue-number">404</div>
              <div className="cluv-status-cue-badge">
                <Search size={30} />
              </div>
            </div>

            <h1 className="cluv-title-section cluv-mb-2">Halaman Tidak Ditemukan</h1>
            <p className="cluv-lead cluv-max-w-xs cluv-mb-5">
              Maaf, tautan yang kamu tuju mungkin salah ketik, telah dipindahkan, atau masa berlakunya telah berakhir.
            </p>

            <div className="cluv-btn-group is-center cluv-mb-6">
              <Link to="/" className="cluv-btn is-primary is-md">
                <Home size={16} />
                <span>Kembali ke Beranda</span>
              </Link>
              <Link to="/faq" className="cluv-btn is-secondary is-md">
                <HelpCircle size={16} />
                <span>Pusat Bantuan &amp; FAQ</span>
              </Link>
            </div>

            <div className="cluv-pt-5 cluv-w-full cluv-border-t">
              <span className="cluv-caption cluv-text-muted cluv-font-bold cluv-block cluv-mb-3">
                Tautan Cepat yang Mungkin Kamu Cari:
              </span>
              <div className="cluv-flex-row cluv-flex-wrap cluv-gap-2 cluv-items-center cluv-justify-center cluv-caption">
                <Link to="/paket" className="cluv-link">Paket Akses</Link>
                <span className="cluv-text-muted">•</span>
                <Link to="/about" className="cluv-link">Tentang Skincluv</Link>
                <span className="cluv-text-muted">•</span>
                <Link to="/contact" className="cluv-link">Kontak Dukungan</Link>
                <span className="cluv-text-muted">•</span>
                <Link to="/terms" className="cluv-link">Syarat Layanan</Link>
                <span className="cluv-text-muted">•</span>
                <Link to="/medical-disclaimer" className="cluv-link">Penyangkalan Medis</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
