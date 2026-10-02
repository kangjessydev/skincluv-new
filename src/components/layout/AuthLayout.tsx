// src/components/layout/AuthLayout.tsx
// 100% Full-Screen Edge-to-Edge & Mobile Stacked Responsive Auth Layout — Pure Vanilla CSS

import { Outlet } from 'react-router-dom'
import '@/styles/auth.css'

export default function AuthLayout() {
  return (
    <div className="claude-auth-root">
      <div className="frame">
        {/* TOP / LEFT — Brand Visual Panel */}
        <div className="visual">
          <div className="scan-field" />
          <svg className="rings" viewBox="0 0 340 340">
            <circle className="core" cx="230" cy="230" r="14" />
            <circle cx="230" cy="230" r="50" />
            <circle cx="230" cy="230" r="90" />
            <circle cx="230" cy="230" r="130" />
            <circle cx="230" cy="230" r="170" />
          </svg>
          <div className="visual-top">
            <div className="brand-mark">SKINCLUV</div>
          </div>
          <div className="visual-body">
            <p className="visual-quote">Kulit Anda punya <span>cerita</span>. Kami bantu membacanya.</p>
            <br />
            <p className="visual-caption">Konsultasi personal berbasis analisis AI, dirancang khusus untuk kondisi kulit Anda.</p>
          </div>
        </div>

        {/* BOTTOM / RIGHT — Form Side Outlet */}
        <div className="form-side">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
