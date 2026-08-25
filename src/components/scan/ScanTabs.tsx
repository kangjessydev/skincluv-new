// src/components/scan/ScanTabs.tsx
// 100% Faithful Port of scan-2 ScanTabs switcher component

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
    <div className="w-full mb-4">
      <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60 backdrop-blur-md">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <NavLink
              key={tab.id}
              to={tab.path}
              className={({ isActive }) =>
                `flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 font-bold text-xs ${
                  isActive
                    ? 'bg-white text-[#0f6784] shadow-sm border border-slate-100'
                    : 'text-slate-500 hover:text-slate-800'
                }`
              }
            >
              <Icon size={18} />
              <span className="uppercase tracking-wider text-[11px]">{tab.label}</span>
            </NavLink>
          )
        })}
      </div>
    </div>
  )
}
