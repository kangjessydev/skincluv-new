// src/components/layout/AuthLayout.tsx
// Split-Screen Editorial Auth Layout — 100% Cluv Micro-Framework

import { Outlet, Link } from 'react-router-dom'
import { Sparkles, Heart } from 'lucide-react'

export default function AuthLayout() {
  return (
    <div className="cluv-page cluv-surface-public cluv-auth-shell">
      <div className="cluv-auth-split">
        {/* SISI KIRI: Visual Editorial Showcase (Desktop Only) */}
        <div className="cluv-auth-showcase">
          <img
            src="/images/skincare-routine-warmth.jpg"
            alt="Meja Rias Skincluv"
            className="cluv-auth-showcase-bg"
          />
          <div className="cluv-auth-showcase-overlay" />

          <div className="cluv-auth-showcase-content">
            {/* Top Brand Logo */}
            <div>
              <Link to="/" className="cluv-auth-brand-logo" title="Kembali ke Beranda Skincluv">
                <span className="cluv-auth-brand-icon">
                  <Sparkles size={18} />
                </span>
                <span className="cluv-auth-brand-name is-white">
                  SKINCLUV
                </span>
              </Link>
            </div>

            {/* Center Floating Companion Quote Card */}
            <div className="cluv-auth-showcase-card cluv-animate-fade">
              <div className="cluv-badge is-teal cluv-mb-3">
                <span className="cluv-dot is-pulse" />
                <span>Teman Setia Meja Riasmu</span>
              </div>
              <p className="cluv-auth-showcase-quote">
                “Merawat kulit bukan tentang mengejar kesempurnaan instan, melainkan mendengarkan apa yang kulitmu butuhkan setiap hari.”
              </p>
              <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                <span className="cluv-badge is-rose">
                  <Heart size={12} className="cluv-text-rose" />
                  <span>28 Hari Regenerasi Alami</span>
                </span>
              </div>
            </div>

            {/* Bottom PDP Compliance Micro Note */}
            <div>
              <p className="cluv-micro cluv-text-white-muted">
                Ruang perawatan kulit mandiri berbasis AI • Dilindungi UU PDP No. 27/2022
              </p>
            </div>
          </div>
        </div>

        {/* SISI KANAN: Auth Main Pane */}
        <div className="cluv-auth-main">
          {/* Mobile Canopy Visual (Hanya di layar <= 960px) */}
          <div className="cluv-auth-mobile-canopy">
            <img
              src="/images/skincare-routine-warmth.jpg"
              alt="Meja Rias Skincluv"
              className="cluv-auth-mobile-canopy-bg"
            />
            <div className="cluv-auth-mobile-canopy-overlay" />
            <div className="cluv-auth-mobile-canopy-content">
              <Link to="/" className="cluv-auth-brand-logo" title="Skincluv Beranda">
                <span className="cluv-auth-brand-icon">
                  <Sparkles size={18} />
                </span>
                <span className="cluv-auth-brand-name is-white">
                  SKINCLUV
                </span>
              </Link>
              <div className="cluv-badge is-teal">
                <span className="cluv-dot is-pulse" />
                <span>Teman Setia Meja Riasmu</span>
              </div>
            </div>
          </div>

          {/* Form Wrap (Sheet Curve on Mobile, Frameless on Desktop) */}
          <div className="cluv-auth-form-wrap">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
