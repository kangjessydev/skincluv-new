import { useAuthStore } from '@/store/authStore'
import { Link, useNavigate } from 'react-router-dom'
import { ScanFace, ScanLine, MessageSquareHeart, ChevronRight, Activity, Sun, Crown, Zap, Gift, ShieldAlert, Droplets, Check, Info, Star, GlassWater, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { isActivePremium } from '@/utils/subscriptionHelpers'

export default function DashboardPage() {
  const { profile, activeSkinProfile, subscription } = useAuthStore()
  const navigate = useNavigate()
  const [greeting, setGreeting] = useState('Good Morning')
  const [usageCount, setUsageCount] = useState<number>(0)

  const userName = profile?.full_name?.split(' ')[0] || 'Sarah'

  const isPro = isActivePremium(subscription)

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good Morning')
    else if (hour < 15) setGreeting('Good Afternoon')
    else if (hour < 18) setGreeting('Good Afternoon')
    else setGreeting('Good Evening')
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

  return (
    <div className="dashboard-stich animate-fade-in">
      {/* 1. Header Greeting Section */}
      <section className="dashboard-greeting-sec">
        <h1 className="greeting-title">{greeting}, {userName}</h1>
        <p className="greeting-sub">Your skin is looking hydrated today. Let's keep up the routine.</p>
      </section>

      {/* 2. Welcome & Quick Scan Actions Bento Grid */}
      <section className="bento-grid-top">
        {/* Skin Score Summary Card (Spans 8 Cols on Desktop) */}
        <div className="bento-card skin-score-card">
          <div className="card-top-row">
            <div>
              <span className="meta-label">Overall Skin Score</span>
              <div className="score-flex">
                <span className="score-val">85</span>
                <span className="score-badge">Great</span>
              </div>
            </div>
            {/* Gauge Circular Ring */}
            <div className="gauge-wrapper">
              <svg className="gauge-svg" viewBox="0 0 36 36">
                <path className="gauge-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="3" />
                <path className="gauge-fill" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeDasharray="85, 100" strokeWidth="3" />
              </svg>
              <Star size={18} className="gauge-icon" />
            </div>
          </div>

          {/* Metric Breakdown Rings */}
          <div className="metrics-grid">
            <div className="metric-box">
              <div className="mini-ring">
                <span className="ring-percent text-sky">85%</span>
              </div>
              <span className="ring-label">HYDRATION</span>
            </div>

            <div className="metric-box">
              <div className="mini-ring">
                <span className="ring-percent text-sky-dark">92%</span>
              </div>
              <span className="ring-label">TEXTURE</span>
            </div>

            <div className="metric-box">
              <div className="mini-ring">
                <span className="ring-percent text-amber">45%</span>
              </div>
              <span className="ring-label">OILINESS</span>
            </div>
          </div>
        </div>

        {/* Quick Scan Action Cards (2 Stacked Buttons) */}
        <div className="quick-scan-stack">
          {/* Scan Wajah */}
          <button className="bento-card scan-btn-card" onClick={() => navigate('/face-scan')}>
            <div className="scan-icon-circle icon-bg-sky">
              <ScanFace size={24} />
            </div>
            <div className="scan-text">
              <h3>Scan Wajah</h3>
              <p>Analyze your skin condition</p>
            </div>
            <ChevronRight className="scan-arrow" size={20} />
          </button>

          {/* Scan Ingredient */}
          <button className="bento-card scan-btn-card" onClick={() => navigate('/ingredient-scan')}>
            <div className="scan-icon-circle icon-bg-amber">
              <ScanLine size={24} />
            </div>
            <div className="scan-text">
              <h3>Scan Ingredient</h3>
              <p>Check product safety</p>
            </div>
            <ChevronRight className="scan-arrow" size={20} />
          </button>
        </div>
      </section>

      {/* 3. Today's Routine & Daily Missions Grid */}
      <section className="bento-grid-bottom">
        {/* Today's Routine List (7 Cols Desktop) */}
        <div className="bento-card routine-card">
          <div className="card-header">
            <h2>Today's Routine</h2>
            <span className="routine-badge">Morning</span>
          </div>

          <div className="routine-list">
            {/* Step 1 Completed */}
            <div className="routine-item item-completed">
              <div className="check-box checked">
                <Check size={14} />
              </div>
              <div className="product-thumb-placeholder">🧴</div>
              <div className="routine-info">
                <h4 className="line-through">Gentle Cleanser</h4>
                <p>Step 1</p>
              </div>
            </div>

            {/* Step 2 Active */}
            <div className="routine-item item-active">
              <div className="check-box active-box" />
              <div className="product-thumb-placeholder">💧</div>
              <div className="routine-info">
                <h4>Hydrating Serum</h4>
                <p>Step 2</p>
              </div>
              <button className="btn-info-icon" title="Product Info">
                <Info size={18} />
              </button>
            </div>

            {/* Step 3 Pending */}
            <div className="routine-item item-pending">
              <div className="check-box pending-box" />
              <div className="product-thumb-placeholder">✨</div>
              <div className="routine-info">
                <h4>Daily Moisturizer</h4>
                <p>Step 3</p>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Missions Quick-View (5 Cols Desktop) */}
        <div className="bento-card missions-card">
          <div className="card-header">
            <h2>Daily Missions</h2>
            <Link to="/missions" className="view-all-link">View All</Link>
          </div>

          <div className="missions-stack">
            {/* Mission 1 */}
            <div className="mission-row">
              <div className="mission-icon-box box-amber">
                <GlassWater size={18} />
              </div>
              <div className="mission-meta">
                <h4>Drink 8 Glasses of Water</h4>
                <div className="mission-progress-bar">
                  <div className="fill-bar" style={{ width: '50%' }} />
                </div>
                <span className="mission-count">4/8</span>
              </div>
            </div>

            {/* Mission 2 */}
            <div className="mission-row">
              <div className="mission-icon-box box-blue">
                <Moon size={18} />
              </div>
              <div className="mission-meta">
                <h4>Complete Night Routine</h4>
                <div className="mission-progress-bar">
                  <div className="fill-bar" style={{ width: '0%' }} />
                </div>
                <span className="mission-count">0/1</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .dashboard-stich { width: 100%; padding-bottom: 40px; }

        .dashboard-greeting-sec { margin-bottom: var(--space-xl); }
        .greeting-title { font-size: 2rem; font-weight: 700; color: var(--color-primary); margin: 0 0 4px 0; font-family: var(--font-heading); }
        .greeting-sub { font-size: 1.125rem; color: var(--color-text-muted); margin: 0; }

        /* Bento Grid Top */
        .bento-grid-top {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-lg);
          margin-bottom: var(--space-xl);
        }
        @media (min-width: 900px) {
          .bento-grid-top {
            grid-template-columns: 8fr 4fr;
          }
        }

        .bento-card {
          background: var(--color-surface-container-lowest);
          border: 1px solid var(--color-secondary-container);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
          box-shadow: var(--shadow-sky);
        }

        /* Skin Score Card */
        .skin-score-card { display: flex; flex-direction: column; justify-content: space-between; }
        .card-top-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-xl); }
        .meta-label { font-size: 0.875rem; color: var(--color-secondary); font-weight: 600; display: block; margin-bottom: 4px; }
        .score-flex { display: flex; align-items: baseline; gap: 12px; }
        .score-val { font-size: 3rem; font-weight: 800; color: var(--color-primary); line-height: 1; font-family: var(--font-heading); }
        .score-badge {
          background: var(--color-success-soft); color: var(--color-primary); font-size: 0.8125rem;
          font-weight: 700; padding: 2px 10px; border-radius: var(--radius-md); border: 1px solid var(--color-secondary-container);
        }

        .gauge-wrapper { position: relative; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; }
        .gauge-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
        .gauge-bg { stroke: var(--color-secondary-container); }
        .gauge-fill { stroke: var(--color-primary-container); }
        .gauge-icon { position: absolute; color: var(--color-primary-container); }

        .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-md); }
        .metric-box {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: var(--space-md); background: var(--color-surface-bg); border-radius: var(--radius-lg);
        }
        .mini-ring { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; }
        .ring-percent { font-size: 0.9375rem; font-weight: 700; font-family: var(--font-heading); }
        .ring-label { font-size: 0.6875rem; color: var(--color-text-muted); font-weight: 700; letter-spacing: 0.05em; margin-top: 4px; }
        .text-sky { color: var(--color-primary); }
        .text-sky-dark { color: var(--color-primary-container); }
        .text-amber { color: var(--color-tertiary-container); }

        /* Quick Scan Stack */
        .quick-scan-stack { display: flex; flex-direction: column; gap: var(--space-md); }
        .scan-btn-card {
          display: flex; align-items: center; gap: 16px; padding: var(--space-lg);
          cursor: pointer; text-align: left; transition: all 0.2s ease; width: 100%;
        }
        .scan-btn-card:hover { transform: translateY(-2px); border-color: var(--color-primary-container); }
        .scan-icon-circle {
          width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .icon-bg-sky { background: var(--color-secondary-fixed); color: var(--color-primary); }
        .icon-bg-amber { background: var(--color-tertiary-fixed); color: var(--color-tertiary); }
        .scan-text { flex: 1; }
        .scan-text h3 { font-size: 1.125rem; margin: 0 0 2px 0; }
        .scan-text p { font-size: 0.75rem; color: var(--color-text-muted); margin: 0; }
        .scan-arrow { color: var(--color-secondary); transition: color 0.2s; }
        .scan-btn-card:hover .scan-arrow { color: var(--color-primary-container); }

        /* Bento Grid Bottom */
        .bento-grid-bottom {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-lg);
        }
        @media (min-width: 900px) {
          .bento-grid-bottom {
            grid-template-columns: 7fr 5fr;
          }
        }

        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg); }
        .card-header h2 { font-size: 1.25rem; margin: 0; }
        .routine-badge {
          background: var(--color-secondary-fixed); color: var(--color-primary); font-size: 0.75rem;
          font-weight: 700; padding: 4px 12px; border-radius: var(--radius-md);
        }
        .view-all-link { font-size: 0.8125rem; font-weight: 700; color: var(--color-primary); text-decoration: none; }

        .routine-list { display: flex; flex-direction: column; gap: 12px; }
        .routine-item {
          display: flex; align-items: center; gap: 14px; padding: 14px; border-radius: var(--radius-lg);
          border: 1px solid var(--color-secondary-container); background: var(--color-surface-container-lowest);
        }
        .item-completed { opacity: 0.7; background: var(--color-surface-bg); border-color: rgba(0,0,0,0.05); }
        .item-active { border-color: var(--color-primary-container); box-shadow: var(--shadow-sky); }
        
        .check-box {
          width: 24px; height: 24px; border-radius: 50%; border: 2px solid var(--color-outline-variant);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .check-box.checked { background: var(--color-primary-container); border-color: transparent; color: white; }
        .check-box.active-box { border-color: var(--color-primary-container); }

        .product-thumb-placeholder {
          width: 48px; height: 48px; border-radius: var(--radius-md); background: var(--color-surface-container-low);
          display: flex; align-items: center; justify-content: center; font-size: 20px; border: 1px solid var(--color-secondary-container);
        }
        .routine-info { flex: 1; }
        .routine-info h4 { font-size: 0.9375rem; margin: 0 0 2px 0; }
        .routine-info p { font-size: 0.75rem; color: var(--color-text-muted); margin: 0; }
        .line-through { text-decoration: line-through; color: var(--color-text-muted); }
        .btn-info-icon { background: transparent; border: none; color: var(--color-primary-container); cursor: pointer; padding: 4px; }

        .missions-stack { display: flex; flex-direction: column; gap: 12px; }
        .mission-row { display: flex; items-center; gap: 12px; padding: 12px; background: var(--color-surface-bg); border-radius: var(--radius-lg); }
        .mission-icon-box {
          width: 40px; height: 40px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .box-amber { background: var(--color-tertiary-fixed); color: var(--color-tertiary); }
        .box-blue { background: var(--color-secondary-fixed); color: var(--color-primary); }

        .mission-meta { flex: 1; }
        .mission-meta h4 { font-size: 0.875rem; margin: 0 0 6px 0; }
        .mission-progress-bar { width: 100%; height: 6px; background: var(--color-surface-container-high); border-radius: 3px; overflow: hidden; }
        .fill-bar { height: 100%; background: var(--color-primary-container); border-radius: 3px; }
        .mission-count { font-size: 0.75rem; color: var(--color-text-muted); text-align: right; display: block; margin-top: 2px; }
      `}</style>
    </div>
  )
}
