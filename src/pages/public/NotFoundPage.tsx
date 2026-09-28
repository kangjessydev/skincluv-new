// src/pages/public/NotFoundPage.tsx
// Halaman 404 (Not Found) yang Ramah Pengguna — Vanilla CSS

import { Link } from 'react-router-dom'
import { Sparkles, Home, HelpCircle, ArrowLeft, Search } from 'lucide-react'

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

      <style>{`
        .not-found-page {
          min-height: calc(100vh - 64px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px var(--space-lg, 24px);
          background: var(--color-surface-bg, #f8fafc);
        }

        .not-found-card {
          background: #ffffff;
          border: 1px solid var(--color-secondary-container, #e2e8f0);
          border-radius: var(--radius-2xl, 20px);
          padding: 48px 32px;
          max-width: 520px;
          width: 100%;
          text-align: center;
          box-shadow: 0 12px 32px rgba(15, 103, 132, 0.05);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .not-found-visual {
          position: relative;
          margin-bottom: 24px;
        }

        .error-code-badge {
          font-family: var(--font-heading, sans-serif);
          font-size: 4.5rem;
          font-weight: 900;
          color: #e0f2fe;
          line-height: 1;
          letter-spacing: -0.04em;
          user-select: none;
        }

        .visual-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #bae6fd;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(2, 132, 199, 0.15);
        }

        .icon-search {
          color: var(--color-primary, #0f6784);
        }

        .not-found-card h1 {
          font-family: var(--font-heading, sans-serif);
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--color-text-main, #0f172a);
          margin: 0 0 10px 0;
        }

        .not-found-desc {
          font-size: 0.9375rem;
          color: var(--color-text-muted, #64748b);
          line-height: 1.6;
          max-width: 420px;
          margin: 0 0 28px 0;
        }

        .not-found-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          justify-content: center;
          margin-bottom: 32px;
        }

        .popular-links-box {
          border-top: 1px solid #f1f5f9;
          padding-top: 20px;
          width: 100%;
        }

        .popular-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }

        .popular-links {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 0.8125rem;
        }

        .popular-links a {
          color: var(--color-primary, #0f6784);
          text-decoration: none;
          font-weight: 600;
        }

        .popular-links a:hover {
          text-decoration: underline;
        }

        .popular-links span {
          color: #cbd5e1;
        }
      `}</style>
    </div>
  )
}
