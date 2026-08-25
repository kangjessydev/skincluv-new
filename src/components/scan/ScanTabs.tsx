// src/components/scan/ScanTabs.tsx
// 100% Faithful Port of scan-2 ScanTabs switcher — PURE VANILLA CSS (Zero Tailwind)

import { NavLink } from 'react-router-dom'
import { ScanFace, FlaskConical } from 'lucide-react'

export default function ScanTabs() {
  const tabs = [
    {
      id: 'face',
      label: 'Face Scan',
      path: '/face-scan',
      icon: ScanFace,
    },
    {
      id: 'ingredient',
      label: 'Ingredients',
      path: '/ingredient-scan',
      icon: FlaskConical,
    },
  ]

  return (
    <div className="scan2-scantabs-wrapper">
      <div className="scan2-scantabs-inner">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <NavLink
              key={tab.id}
              to={tab.path}
              className={({ isActive }) =>
                `scantab-link-item ${isActive ? 'scantab-active' : ''}`
              }
            >
              <Icon size={18} className="scantab-icon" />
              <span className="scantab-label-text">{tab.label}</span>
            </NavLink>
          )
        })}
      </div>

      <style>{`
        .scan2-scantabs-wrapper {
          width: 100%;
          margin-bottom: 16px;
        }

        .scan2-scantabs-inner {
          display: flex;
          background: rgba(241, 245, 249, 0.8);
          padding: 6px;
          border-radius: 18px;
          border: 1px solid rgba(226, 232, 240, 0.7);
          backdrop-filter: blur(12px);
          gap: 4px;
        }

        .scantab-link-item {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: 14px;
          font-weight: 800;
          font-size: 0.75rem;
          color: #64748b;
          text-decoration: none;
          transition: all 0.25s ease;
        }

        .scantab-link-item:hover {
          color: #1e293b;
        }

        .scantab-link-item.scantab-active {
          background: #ffffff;
          color: #0f6784;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          border: 1px solid #f1f5f9;
        }

        .scantab-label-text {
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 0.7rem;
        }
      `}</style>
    </div>
  )
}
