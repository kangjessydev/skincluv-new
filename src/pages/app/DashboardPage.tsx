import { useAuthStore } from '@/store/authStore'
import { Link } from 'react-router-dom'
import { ScanFace, ScanLine, MessageSquareHeart, ChevronRight, Activity, Sun, Crown, Zap, Gift, ShieldAlert, Droplets } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const { profile, activeSkinProfile, subscription } = useAuthStore()
  const [greeting, setGreeting] = useState('Halo')
  const [usageCount, setUsageCount] = useState<number>(0)

  const subTierSlug = (subscription as any)?.subscription_tiers?.slug
  const subTierName = (subscription as any)?.subscription_tiers?.name
  const isPro = subscription?.status === 'active' && (
    subTierSlug === 'premium' || 
    subTierName?.toLowerCase() === 'premium' ||
    subTierName?.toLowerCase() === 'pro'
  )

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Selamat Pagi')
    else if (hour < 15) setGreeting('Selamat Siang')
    else if (hour < 18) setGreeting('Selamat Sore')
    else setGreeting('Selamat Malam')
  }, [])

  useEffect(() => {
    if (!profile?.id) return
    const fetchUsage = async () => {
      const { data } = await supabase
        .from('quota_usage')
        .select('used_count')
        .eq('user_id', profile.id)
        .maybeSingle()
      if (data) setUsageCount(data.used_count || 0)
    }
    fetchUsage()
  }, [profile?.id])

  const maxLimit = isPro ? 3000 : 10
  const usagePercent = Math.min((usageCount / maxLimit) * 100, 100)

  return (
    <div className="dashboard-page animate-fade-in">
      {/* Header Banner */}
      <div className="dashboard-header glass-card">
        <div className="greeting-text">
          <p className="greeting-time">{greeting},</p>
          <h1>{profile?.full_name?.split(' ')[0] ?? 'Skincluver'} ✨</h1>
        </div>
        <div className="weather-widget">
          <Sun size={16} className="icon-amber" />
          <span>UV Index: Sedang</span>
        </div>
      </div>

      {/* Main Responsive Grid Container */}
      <div className="dashboard-grid">
        {/* LEFT COLUMN (Profile, Membership & Daily Context) */}
        <div className="dashboard-col-left">
          {/* Membership Status & Quota Progress Banner */}
          <div className="card-banner glass-card">
            <div className="banner-top">
              {isPro ? (
                <span className="badge-pill badge-gold"><Crown size={14} /> VIP PRO Member</span>
              ) : (
                <span className="badge-pill badge-sky"><Zap size={14} /> Free Member</span>
              )}
              {!isPro && (
                <Link to="/pricing" className="btn btn-primary btn-sm btn-upgrade-dash">
                  <Crown size={14} /> Upgrade PRO
                </Link>
              )}
            </div>

            <div className="dash-usage-block">
              <div className="dash-usage-meta">
                <span>Kuota Analisis Bulan Ini</span>
                <strong>{usageCount} / {maxLimit} Penggunaan</strong>
              </div>
              <div className="dash-progress-bar">
                <div className="dash-progress-fill" style={{ width: `${usagePercent}%` }} />
              </div>
            </div>
          </div>

          {/* Skin Profile Summary Card */}
          {!activeSkinProfile ? (
            <div className="alert-card glass-card">
              <div className="alert-content">
                <h3><ShieldAlert size={18} className="text-sky" /> Belum Punya Profil Kulit?</h3>
                <p>Lengkapi profil kulitmu agar analisis & rekomendasi produk 100% akurat!</p>
              </div>
              <Link to="/profile" className="btn btn-primary btn-sm">Isi Profil</Link>
            </div>
          ) : (
            <div className="skin-summary-card glass-card">
              <div className="summary-header">
                <h3><Activity size={18} className="text-sky" /> Profil Kulit Aktif</h3>
                <Link to="/profile" className="edit-link">Edit Profil</Link>
              </div>
              <div className="summary-tags">
                <span className="tag type-tag">{activeSkinProfile.skin_type.toUpperCase()}</span>
                {activeSkinProfile.skin_concerns.map(c => (
                  <span key={c} className="tag concern-tag">{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Daily Skincare Tips */}
          <div className="tips-card glass-card">
            <div className="tips-title">
              <Droplets size={18} className="text-sky" />
              <h3>Tips Skincare & Hidrasi</h3>
            </div>
            <p>Jangan lupa reapply sunscreen setiap 3 jam sekali, dan pastikan kebutuhan cairan tubuhmu tercukupi hari ini!</p>
          </div>

          {/* Daily Mission Teaser */}
          <div className="mission-teaser-card glass-card">
            <div className="teaser-left">
              <Gift size={22} className="text-sky" />
              <div>
                <h4>Misi Harian & Koin</h4>
                <p>Kumpulkan koin gratis dari tugas harian</p>
              </div>
            </div>
            <Link to="/missions" className="btn btn-outline btn-sm">Buka Misi</Link>
          </div>
        </div>

        {/* RIGHT COLUMN (Core Skincare Action Cards) */}
        <div className="dashboard-col-right">
          <h2 className="section-title">Fitur Konsultasi & Perawatan</h2>
          
          <div className="quick-actions">
            {/* Face Scan */}
            <Link to="/face-scan" className="action-card scan-face glass-card">
              <div className="action-icon icon-bg-sky">
                <ScanFace size={26} />
              </div>
              <div className="action-info">
                <h3>Analisis Kondisi Wajah</h3>
                <p>Deteksi jerawat, kemerahan, & kerutan dari foto selfie</p>
              </div>
              <div className="action-arrow-wrapper">
                <ChevronRight className="action-arrow" />
              </div>
            </Link>

            {/* Ingredient Scan */}
            <Link to="/ingredient-scan" className="action-card scan-ingredient glass-card">
              <div className="action-icon icon-bg-cyan">
                <ScanLine size={26} />
              </div>
              <div className="action-info">
                <h3>Cek Komposisi Bahan</h3>
                <p>Ketahui apakah kandungan produk aman & bebas alergi untuk kulitmu</p>
              </div>
              <div className="action-arrow-wrapper">
                <ChevronRight className="action-arrow" />
              </div>
            </Link>

            {/* Chatbot Specialist */}
            <Link to="/chatbot" className="action-card chatbot-ai glass-card">
              <div className="action-icon icon-bg-blue">
                <MessageSquareHeart size={26} />
              </div>
              <div className="action-info">
                <h3>Konsultasi Skincare Specialist</h3>
                <p>Tanya jawab rutinitas & masalah kulit 24/7 kapan saja</p>
              </div>
              <div className="action-arrow-wrapper">
                <ChevronRight className="action-arrow" />
              </div>
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-page { width: 100%; }

        .dashboard-header {
          display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px;
          padding: var(--space-lg); border-radius: var(--radius-xl); margin-bottom: var(--space-lg);
          background: var(--color-surface-2); border: 1px solid var(--color-border);
          box-shadow: var(--shadow-sm);
        }
        .greeting-time { color: var(--color-text-muted); font-size: 0.8125rem; margin-bottom: 2px; font-weight: 500; }
        .greeting-text h1 { font-size: 1.5rem; margin: 0; color: var(--color-text-primary); }

        .weather-widget {
          display: inline-flex; align-items: center; gap: 6px;
          background: #fef3c7; border: 1px solid rgba(245, 158, 11, 0.3);
          padding: 5px 12px; border-radius: var(--radius-full);
          font-size: 0.75rem; color: #d97706; font-weight: 700;
          white-space: nowrap; flex-shrink: 0;
        }
        .icon-amber { color: #f59e0b; flex-shrink: 0; }

        /* Responsive Grid: Desktop (2 Columns, >=900px) vs Mobile (1 Column, <900px) */
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-lg);
          width: 100%;
        }
        @media (min-width: 900px) {
          .dashboard-grid {
            grid-template-columns: 1fr 1fr;
            align-items: start;
            gap: var(--space-xl);
          }
        }

        .dashboard-col-left, .dashboard-col-right {
          display: flex; flex-direction: column; gap: var(--space-lg); width: 100%;
        }

        .section-title { font-size: 1.125rem; font-weight: 700; color: var(--color-text-primary); margin: 0; }

        /* Membership Banner */
        .card-banner { padding: var(--space-lg); }
        .banner-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .badge-pill {
          font-size: 0.75rem; font-weight: 700; padding: 4px 12px; border-radius: var(--radius-full);
          display: inline-flex; align-items: center; gap: 6px;
        }
        .badge-sky { background: var(--color-brand-100); color: var(--color-brand-600); border: 1px solid var(--color-border-sky); }
        .badge-gold { background: #fef3c7; color: #d97706; border: 1px solid rgba(245, 158, 11, 0.3); }
        .btn-upgrade-dash { font-size: 0.75rem; padding: 4px 12px; text-decoration: none; gap: 4px; }

        .dash-usage-block { margin-top: 4px; }
        .dash-usage-meta { display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--color-text-secondary); margin-bottom: 6px; }
        .dash-progress-bar { width: 100%; height: 8px; background: var(--color-surface-3); border-radius: 4px; overflow: hidden; }
        .dash-progress-fill { height: 100%; background: var(--color-brand-600); border-radius: 4px; transition: width 0.5s ease-out; }

        /* Alert & Skin Profile Cards */
        .alert-card {
          display: flex; justify-content: space-between; align-items: center;
          padding: var(--space-lg); border-color: var(--color-border-sky);
          background: #f0f9ff; gap: 12px;
        }
        .alert-content h3 { font-size: 0.9375rem; margin-bottom: 4px; display: flex; align-items: center; gap: 6px; }
        .alert-content p { font-size: 0.75rem; color: var(--color-text-secondary); margin: 0; }
        .text-sky { color: var(--color-brand-600); flex-shrink: 0; }

        .skin-summary-card { padding: var(--space-lg); }
        .summary-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .summary-header h3 { font-size: 0.9375rem; margin: 0; display: flex; align-items: center; gap: 8px; }
        .edit-link { font-size: 0.75rem; color: var(--color-brand-600); text-decoration: none; font-weight: 600; }
        
        .summary-tags { display: flex; flex-wrap: wrap; gap: 8px; }
        .tag { padding: 4px 12px; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 700; }
        .type-tag { background: var(--color-brand-600); color: white; }
        .concern-tag { background: var(--color-brand-100); border: 1px solid var(--color-border-sky); color: var(--color-brand-700); }

        /* Action Cards */
        .quick-actions { display: flex; flex-direction: column; gap: 12px; }
        .action-card {
          padding: var(--space-md) var(--space-lg); display: flex; align-items: center; gap: var(--space-md);
          text-decoration: none; transition: all 0.2s ease; position: relative;
          background: var(--color-surface-2); border: 1px solid var(--color-border);
        }
        .action-card:hover { transform: translateY(-2px); border-color: var(--color-brand-400); box-shadow: var(--shadow-md); }
        
        .action-icon {
          width: 44px; height: 44px; border-radius: var(--radius-lg);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: white;
        }
        .icon-bg-sky { background: #0284c7; }
        .icon-bg-cyan { background: #0ea5e9; }
        .icon-bg-blue { background: #0284c7; }

        .action-info { flex: 1; min-width: 0; }
        .action-info h3 { font-size: 0.9375rem; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .action-info p { font-size: 0.75rem; color: var(--color-text-secondary); margin: 0; line-height: 1.4; }
        
        .action-arrow-wrapper {
          width: 32px; height: 32px; border-radius: 50%; background: var(--color-surface-1);
          display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0;
        }
        .action-card:hover .action-arrow-wrapper { background: var(--color-brand-100); }
        .action-arrow { color: var(--color-brand-600); }

        /* Tips & Mission Teaser */
        .tips-card { padding: var(--space-lg); background: #f0f9ff; border-color: var(--color-border-sky); }
        .tips-title { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
        .tips-title h3 { font-size: 0.875rem; color: var(--color-brand-700); margin: 0; }
        .tips-card p { font-size: 0.8125rem; color: var(--color-text-secondary); margin: 0; line-height: 1.5; }

        .mission-teaser-card {
          display: flex; justify-content: space-between; align-items: center;
          padding: var(--space-md) var(--space-lg); gap: 12px;
        }
        .teaser-left { display: flex; align-items: center; gap: 12px; }
        .teaser-left h4 { font-size: 0.875rem; margin: 0 0 2px 0; }
        .teaser-left p { font-size: 0.75rem; color: var(--color-text-muted); margin: 0; }
      `}</style>
    </div>
  )
}
