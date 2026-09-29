// src/pages/app/DashboardV2Page.tsx
// Skincluv Fresh Blue & Clinical Tech Dashboard (Ported from v0.dev design)
// Version 2 Preview: Pure Sans-serif, Clean White Surfaces, Fresh Cyan & Blue Accents

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HeartPulse,
  Droplets,
  SunMedium,
  Sparkles,
  ArrowUpRight,
  ChevronRight,
  Leaf,
  Check,
  MoreHorizontal,
  Activity,
  ScanFace,
  FlaskConical,
  MessageSquare,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useDashboardData } from '@/hooks/useDashboardData'

function formatRelativeDate(dateStr?: string | null): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Hari ini'
    if (diffDays === 1) return 'Kemarin'
    if (diffDays < 7) return `${diffDays} hari lalu`

    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  } catch {
    return '—'
  }
}

function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 4 && hour < 11) return 'pagi'
  if (hour >= 11 && hour < 15) return 'siang'
  if (hour >= 15 && hour < 18) return 'sore'
  return 'malam'
}

const defaultWeekData = [
  { day: 'Sen', date: '21', score: 76 },
  { day: 'Sel', date: '22', score: 84 },
  { day: 'Rab', date: '23', score: 68 },
  { day: 'Kam', date: '24', score: 91 },
  { day: 'Jum', date: '25', score: 88 },
  { day: 'Sab', date: '26', score: 94 },
  { day: 'Min', date: '27', score: 82 },
]

const initialRoutines = [
  { title: 'Cleanser Lembut (pH Balance)', type: 'Pagi · 2 menit', done: true },
  { title: 'Serum Hidrasi / Niacinamide', type: 'Pagi · 1 menit', done: true },
  { title: 'Moisturizer + Sunscreen SPF 50', type: 'Pagi · 2 menit', done: false },
]

export default function DashboardV2Page() {
  const navigate = useNavigate()
  const { profile, coinBalance } = useAuthStore()
  const { data, loading } = useDashboardData()

  const [routineItems, setRoutineItems] = useState(initialRoutines)

  const toggleRoutine = (index: number) => {
    setRoutineItems((items) =>
      items.map((item, idx) => (idx === index ? { ...item, done: !item.done } : item))
    )
  }

  const skinAssessment = data?.skin_assessment
  const scanCounts = data?.scan_counts ?? { face_total: 0, ingredient_total: 0, total: 0 }
  const productSummary = data?.product_summary ?? { total_products_scanned: 0, safe_products_count: 0, avg_safety_score: null }
  const missions = data?.missions ?? { completed: 0, total: 1, active_list: [] }
  const recentScans = data?.recent_scans ?? []

  const hasFaceScan = skinAssessment?.has_face_scan ?? false
  const latestScore = skinAssessment?.latest_score ?? 82
  const latestStatus = skinAssessment?.latest_status || 'Kondisi Kulit Terpantau'

  const userName = profile?.full_name?.split(' ')[0] || 'kamu'
  const timeOfDay = getTimeOfDayGreeting()
  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="v0-dashboard-root">
      {/* PREVIEW BANNER: Toggle back to v1 */}
      <div className="v0-preview-switch">
        <span className="switch-text">
          Tampilan <strong>Versi 2 (v0 Fresh Blue)</strong> — Eksplorasi UI/UX Baru
        </span>
        <button onClick={() => navigate('/')} className="btn-switch-v1">
          Kembali ke Versi 1
        </button>
      </div>

      <div className="v0-container">
        {/* HEADER SECTION */}
        <header className="v0-header-row">
          <div>
            <p className="v0-header-date">{todayFormatted}</p>
            <h1 className="v0-header-title">Selamat {timeOfDay}, {userName}</h1>
            <p className="v0-header-sub">
              {hasFaceScan
                ? 'Jaga ritmemu hari ini, satu langkah kecil perawatan kulit sangat berarti.'
                : 'Mulai pemantauan kulit pertamamu untuk rekomendasi formula yang tepat.'}
            </p>
          </div>

          <div className="v0-header-actions">
            <button
              onClick={() => navigate('/face-scan')}
              className="v0-btn-primary"
            >
              <Sparkles size={16} />
              <span>{hasFaceScan ? 'Check-in Kulit Baru' : 'Mulai Face Scan'}</span>
            </button>
          </div>
        </header>

        {/* TOP STAT CARDS (3 COLS) */}
        <section className="v0-stats-grid">
          {/* Card 1: Score */}
          <div className="v0-stat-card">
            <div className="v0-stat-top">
              <span className="v0-stat-icon teal">
                <HeartPulse size={18} />
              </span>
              <span className="v0-stat-label">Kondisi Wajah Terkini</span>
            </div>
            <div className="v0-stat-val-group">
              <span className="v0-stat-val">{hasFaceScan ? latestScore : '82'}</span>
              <span className="v0-stat-suffix">/ 100</span>
            </div>
            <p className="v0-stat-note">
              {hasFaceScan ? latestStatus : 'Estimasi awal · Lakukan scan'}
            </p>
          </div>

          {/* Card 2: Skincare Safety */}
          <div className="v0-stat-card">
            <div className="v0-stat-top">
              <span className="v0-stat-icon blue">
                <Droplets size={18} />
              </span>
              <span className="v0-stat-label">Keamanan Produk</span>
            </div>
            <div className="v0-stat-val-group">
              <span className="v0-stat-val">{productSummary.safe_products_count}</span>
              <span className="v0-stat-suffix">/ {productSummary.total_products_scanned} produk</span>
            </div>
            <p className="v0-stat-note">
              {productSummary.total_products_scanned > 0
                ? `${productSummary.safe_products_count} formula terverifikasi aman`
                : 'Belum ada produk yang kamu cek'}
            </p>
          </div>

          {/* Card 3: Missions / Streak */}
          <div className="v0-stat-card">
            <div className="v0-stat-top">
              <span className="v0-stat-icon coral">
                <SunMedium size={18} />
              </span>
              <span className="v0-stat-label">Misi & Proteksi Kulit</span>
            </div>
            <div className="v0-stat-val-group">
              <span className="v0-stat-val">{missions.completed}</span>
              <span className="v0-stat-suffix">/ {missions.total} selesai</span>
            </div>
            <p className="v0-stat-note">
              Re-apply sunscreen siang nanti
            </p>
          </div>
        </section>

        {/* MIDDLE SECTION: WEEKLY BAR CHART + INSIGHT */}
        <section className="v0-middle-grid">
          {/* Left: Weekly Trend Bars */}
          <div className="v0-card v0-trend-card">
            <div className="v0-card-header">
              <div>
                <h2 className="v0-card-title">Keseimbangan Mingguan</h2>
                <p className="v0-card-sub">Ringkasan perkembangan skor kulit harianmu</p>
              </div>
              <button onClick={() => navigate('/scan-history')} className="v0-card-link">
                Lihat detail <ArrowUpRight size={14} />
              </button>
            </div>

            <div className="v0-chart-container">
              {defaultWeekData.map((item, idx) => {
                const isHighlight = idx === 5
                return (
                  <div key={item.day} className="v0-chart-col">
                    <div className="v0-bar-track">
                      {isHighlight && (
                        <span className="v0-bar-tooltip">{item.score}</span>
                      )}
                      <div
                        className={`v0-bar-fill ${isHighlight ? 'active' : ''}`}
                        style={{ height: `${item.score}%` }}
                      />
                    </div>
                    <span className={`v0-bar-day ${isHighlight ? 'active' : ''}`}>
                      {item.day}
                    </span>
                    <span className="v0-bar-date">{item.date}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right: Insight Card */}
          <div className="v0-card v0-insight-card">
            <div className="v0-insight-top">
              <div>
                <span className="v0-insight-badge">INSIGHT DERMATOLOGI</span>
                <h2 className="v0-insight-title">
                  {hasFaceScan ? 'Perhatikan Keseimbangan Kulit' : 'Mulai Pengamatan Kulit'}
                </h2>
              </div>
              <span className="v0-insight-icon">
                <Leaf size={18} />
              </span>
            </div>

            <p className="v0-insight-desc">
              {skinAssessment?.analysis_notes
                ? skinAssessment.analysis_notes
                : 'Siklus pembaruan sel kulit membutuhkan waktu sekitar 28 hari. Pertahankan rutinitas pembersihan lembut dan hidrasi konsisten setiap hari.'}
            </p>

            <div className="v0-insight-footer">
              <span className="v0-insight-meta">Berdasarkan data profil AI</span>
              <button onClick={() => navigate('/chatbot')} className="v0-insight-action">
                Tanya Skinsistant <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* BOTTOM SECTION: ROUTINE CHECKLIST + RECENT ACTIVITY */}
        <section className="v0-bottom-grid">
          {/* Left: Routine Checklist */}
          <div className="v0-card v0-routine-card">
            <div className="v0-card-header">
              <div>
                <h2 className="v0-card-title">Rutinitas Hari Ini</h2>
                <p className="v0-card-sub">3 langkah · sekitar 4 menit</p>
              </div>
              <button className="v0-btn-icon-subtle" aria-label="Opsi">
                <MoreHorizontal size={18} />
              </button>
            </div>

            <div className="v0-routine-list">
              {routineItems.map((item, idx) => (
                <button
                  key={item.title}
                  onClick={() => toggleRoutine(idx)}
                  className="v0-routine-item"
                >
                  <span className={`v0-checkbox ${item.done ? 'checked' : ''}`}>
                    <Check size={14} strokeWidth={3} />
                  </span>
                  <div className="v0-routine-meta">
                    <span className={`v0-routine-name ${item.done ? 'done' : ''}`}>
                      {item.title}
                    </span>
                    <span className="v0-routine-type">{item.type}</span>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => navigate('/missions')}
              className="v0-btn-routine-footer"
            >
              Lihat misi & rutinitas lengkap <ChevronRight size={14} />
            </button>
          </div>

          {/* Right: Recent Activity */}
          <div className="v0-card v0-activity-card">
            <div className="v0-card-header">
              <div>
                <h2 className="v0-card-title">Aktivitas Terakhir</h2>
                <p className="v0-card-sub">Catatan pemindaian dan perawatanmu</p>
              </div>
              <button onClick={() => navigate('/scan-history')} className="v0-card-link">
                Lihat semua
              </button>
            </div>

            <div className="v0-activity-grid">
              {recentScans.length === 0 ? (
                <>
                  <div className="v0-activity-box">
                    <span className="v0-act-icon blue"><Droplets size={16} /></span>
                    <p className="v0-act-title">Scan Komposisi</p>
                    <p className="v0-act-time">Hari ini</p>
                    <p className="v0-act-status">Belum ada</p>
                  </div>
                  <div className="v0-activity-box">
                    <span className="v0-act-icon teal"><ScanFace size={16} /></span>
                    <p className="v0-act-title">Scan Wajah</p>
                    <p className="v0-act-time">Hari ini</p>
                    <p className="v0-act-status">Belum ada</p>
                  </div>
                  <div className="v0-activity-box">
                    <span className="v0-act-icon lavender"><MessageSquare size={16} /></span>
                    <p className="v0-act-title">Tanya AI</p>
                    <p className="v0-act-time">Siap bantu</p>
                    <p className="v0-act-status">Aktif</p>
                  </div>
                </>
              ) : (
                recentScans.slice(0, 3).map((scan, idx) => {
                  const isFace = scan.type === 'face'
                  const tones = ['teal', 'blue', 'lavender'] as const
                  const tone = tones[idx % 3]
                  return (
                    <div
                      key={scan.id}
                      className="v0-activity-box clickable"
                      onClick={() => navigate('/scan-history')}
                    >
                      <span className={`v0-act-icon ${tone}`}>
                        {isFace ? <ScanFace size={16} /> : <FlaskConical size={16} />}
                      </span>
                      <p className="v0-act-title">{scan.title}</p>
                      <p className="v0-act-time">{formatRelativeDate(scan.created_at)}</p>
                      <p className="v0-act-status">
                        {scan.score !== null ? `Skor ${scan.score}` : 'Selesai'}
                      </p>
                    </div>
                  )
                })
              )}
            </div>

            {/* Sunscreen Reminder Banner */}
            <div className="v0-sun-banner">
              <span className="v0-sun-icon">
                <SunMedium size={16} />
              </span>
              <p className="v0-sun-text">
                Jangan lupa re-apply sunscreen sebelum keluar siang nanti untuk perlindungan UV optimal.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* VANILLA CSS SCOPED SPECIFICALLY TO V0 AESTHETICS */}
      <style>{`
        .v0-dashboard-root {
          width: 100%;
          min-height: calc(100vh - var(--nav-height, 64px));
          background: #f7faff;
          color: #13243c;
          font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
          padding-bottom: 60px;
        }

        .v0-preview-switch {
          background: #eef6fc;
          border-bottom: 1px solid #dce8f1;
          padding: 10px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13px;
          color: #315467;
        }
        .btn-switch-v1 {
          background: #ffffff;
          border: 1px solid #cfe0ec;
          border-radius: 8px;
          padding: 5px 12px;
          font-size: 12px;
          font-weight: 600;
          color: #1f9d97;
          cursor: pointer;
        }
        .btn-switch-v1:hover {
          background: #f0f8ff;
        }

        .v0-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 28px 24px 48px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* HEADER ROW */
        .v0-header-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        .v0-header-date {
          font-size: 12px;
          font-weight: 500;
          color: #7990a3;
          margin-bottom: 4px;
        }
        .v0-header-title {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 32px;
          font-weight: 700;
          letter-spacing: -0.04em;
          color: #1b3048;
          margin: 0;
          line-height: 1.2;
        }
        .v0-header-sub {
          font-size: 13.5px;
          color: #72879a;
          margin: 6px 0 0;
        }
        .v0-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #1f9d97;
          color: #ffffff;
          border: none;
          border-radius: 12px;
          padding: 11px 18px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 7px 18px rgba(31, 157, 151, 0.18);
          transition: background 0.15s ease;
        }
        .v0-btn-primary:hover {
          background: #188b86;
        }

        /* STATS GRID */
        .v0-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .v0-stat-card {
          background: #ffffff;
          border: 1px solid #dfeaf2;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 12px 35px rgba(43, 84, 116, 0.04);
        }
        .v0-stat-top {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .v0-stat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 12px;
        }
        .v0-stat-icon.teal { background: #e5f7f4; color: #299d96; }
        .v0-stat-icon.blue { background: #e6f2ff; color: #4b91c6; }
        .v0-stat-icon.coral { background: #fff0e9; color: #e28b65; }

        .v0-stat-label {
          font-size: 12.5px;
          font-weight: 500;
          color: #7d91a2;
        }
        .v0-stat-val-group {
          margin-top: 18px;
          display: flex;
          align-items: baseline;
          gap: 4px;
        }
        .v0-stat-val {
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.04em;
          color: #1c3449;
          line-height: 1;
        }
        .v0-stat-suffix {
          font-size: 12px;
          color: #93a2af;
          font-weight: 500;
        }
        .v0-stat-note {
          font-size: 11.5px;
          color: #86a0ae;
          margin: 6px 0 0;
        }

        /* SHARED CARD STYLING */
        .v0-card {
          background: #ffffff;
          border: 1px solid #dfeaf2;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 12px 35px rgba(43, 84, 116, 0.04);
        }
        .v0-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .v0-card-title {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.03em;
          color: #1c3449;
          margin: 0;
        }
        .v0-card-sub {
          font-size: 12px;
          color: #8496a6;
          margin: 4px 0 0;
        }
        .v0-card-link {
          background: none;
          border: none;
          font-size: 12px;
          font-weight: 600;
          color: #258e8b;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .v0-card-link:hover { opacity: 0.8; }

        /* MIDDLE GRID: 1.55fr 1fr */
        .v0-middle-grid {
          display: grid;
          grid-template-columns: 1.55fr 1fr;
          gap: 20px;
        }

        /* WEEKLY CHART */
        .v0-chart-container {
          height: 190px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 4px 0;
        }
        .v0-chart-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          height: 100%;
          justify-content: flex-end;
        }
        .v0-bar-track {
          position: relative;
          width: 100%;
          max-width: 28px;
          height: 140px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .v0-bar-fill {
          width: 100%;
          background: #d9f0ef;
          border-radius: 6px 6px 0 0;
          transition: height 0.3s ease;
        }
        .v0-bar-fill.active {
          background: #2aa6a0;
        }
        .v0-bar-tooltip {
          position: absolute;
          top: -26px;
          background: #19364a;
          color: #ffffff;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .v0-bar-day {
          font-size: 11px;
          color: #94a3b0;
        }
        .v0-bar-day.active {
          color: #1e9892;
          font-weight: 700;
        }
        .v0-bar-date {
          font-size: 11px;
          font-weight: 500;
          color: #647e91;
        }

        /* INSIGHT CARD */
        .v0-insight-card {
          background: #eef9f8;
          border-color: #dfeaf2;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .v0-insight-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }
        .v0-insight-badge {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.16em;
          color: #5d9896;
          text-transform: uppercase;
        }
        .v0-insight-title {
          font-size: 19px;
          font-weight: 700;
          letter-spacing: -0.03em;
          color: #20485a;
          margin: 6px 0 0;
        }
        .v0-insight-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 12px;
          background: #ffffff;
          color: #2aa39c;
        }
        .v0-insight-desc {
          font-size: 13.5px;
          line-height: 1.6;
          color: #557985;
          margin: 16px 0;
        }
        .v0-insight-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid #d5eeeb;
          padding-top: 14px;
        }
        .v0-insight-meta {
          font-size: 11.5px;
          color: #6b9295;
        }
        .v0-insight-action {
          background: none;
          border: none;
          font-size: 11.5px;
          font-weight: 700;
          color: #208c87;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 2px;
        }

        /* BOTTOM GRID: 1fr 1.55fr */
        .v0-bottom-grid {
          display: grid;
          grid-template-columns: 1fr 1.55fr;
          gap: 20px;
        }

        /* ROUTINE CHECKLIST */
        .v0-btn-icon-subtle {
          background: none;
          border: none;
          color: #91a1af;
          cursor: pointer;
        }
        .v0-routine-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .v0-routine-item {
          display: flex;
          align-items: center;
          gap: 12px;
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          padding: 4px 0;
        }
        .v0-checkbox {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          border: 1px solid #d4e1e9;
          background: #ffffff;
          color: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.15s ease;
        }
        .v0-checkbox.checked {
          background: #2ca59e;
          border-color: #2ca59e;
          color: #ffffff;
        }
        .v0-routine-meta {
          flex: 1;
        }
        .v0-routine-name {
          display: block;
          font-size: 12.5px;
          font-weight: 600;
          color: #3c566a;
        }
        .v0-routine-name.done {
          color: #8296a5;
          text-decoration: line-through;
        }
        .v0-routine-type {
          display: block;
          font-size: 11px;
          color: #9aabb8;
          margin-top: 2px;
        }
        .v0-btn-routine-footer {
          margin-top: 20px;
          width: 100%;
          padding: 10px;
          border-radius: 12px;
          border: 1px solid #d9e8ef;
          background: #ffffff;
          font-size: 12px;
          font-weight: 600;
          color: #4b7488;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }
        .v0-btn-routine-footer:hover {
          background: #f7fbfc;
        }

        /* RECENT ACTIVITY */
        .v0-activity-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .v0-activity-box {
          border: 1px solid #e5eef3;
          border-radius: 12px;
          padding: 14px;
          background: #ffffff;
        }
        .v0-activity-box.clickable {
          cursor: pointer;
          transition: border-color 0.15s ease;
        }
        .v0-activity-box.clickable:hover {
          border-color: #1f9d97;
        }
        .v0-act-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
        }
        .v0-act-icon.blue { background: #eaf4ff; color: #4a8fc8; }
        .v0-act-icon.teal { background: #e8f8f5; color: #2a9e95; }
        .v0-act-icon.lavender { background: #f1edff; color: #896bc2; }

        .v0-act-title {
          font-size: 12.5px;
          font-weight: 600;
          color: #3d576a;
          margin: 10px 0 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .v0-act-time {
          font-size: 10.5px;
          color: #9aaab6;
          margin: 0;
        }
        .v0-act-status {
          font-size: 11.5px;
          font-weight: 600;
          color: #5b7a8d;
          margin: 10px 0 0;
        }

        .v0-sun-banner {
          margin-top: 18px;
          background: #f7fafc;
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .v0-sun-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #ffffff;
          color: #e0a264;
          flex-shrink: 0;
        }
        .v0-sun-text {
          font-size: 11.5px;
          color: #71899a;
          margin: 0;
          line-height: 1.5;
        }

        /* RESPONSIVE */
        @media (max-width: 1024px) {
          .v0-middle-grid,
          .v0-bottom-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 768px) {
          .v0-stats-grid {
            grid-template-columns: 1fr;
          }
          .v0-activity-grid {
            grid-template-columns: 1fr;
          }
          .v0-header-title {
            font-size: 26px;
          }
        }
      `}</style>
    </div>
  )
}
