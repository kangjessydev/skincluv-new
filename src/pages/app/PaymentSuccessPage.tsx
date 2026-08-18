import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Crown, CheckCircle, Sparkles, ScanFace, MessageSquare, ArrowRight, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const reference = searchParams.get('reference') || searchParams.get('tripay_merchant_ref') || 'INV-PRO'
  const { setSubscription } = useAuthStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Re-hydrate subscription data in background
    const refreshSub = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('*, subscription_tiers(name, slug)')
          .eq('user_id', session.user.id)
          .eq('status', 'active')
          .maybeSingle()

        if (subData) {
          setSubscription(subData)
        }
      }
      setLoading(false)
    }
    refreshSub()
  }, [setSubscription])

  return (
    <div className="payment-success-page animate-fade-in">
      <div className="success-card glass-card">
        <div className="crown-badge-wrapper">
          <div className="crown-circle">
            <Crown size={48} className="crown-icon-animated" />
          </div>
          <div className="sparkle-badge">
            <Sparkles size={16} /> Status PRO Aktif
          </div>
        </div>

        <h1 className="success-title">Selamat! Kamu Resmi Menjadi Member PRO 🎉</h1>
        <p className="success-subtitle">
          Nikmati akses analisis kulit cerdas & komunikasi tanpa batas bersama AI Skincluv.
        </p>

        {/* Invoice Summary Box */}
        <div className="receipt-box">
          <div className="receipt-row">
            <span className="receipt-label">No. Referensi:</span>
            <span className="receipt-value code">{reference}</span>
          </div>
          <div className="receipt-row">
            <span className="receipt-label">Paket:</span>
            <span className="receipt-value highlight">Skincluv PRO (1 Bulan)</span>
          </div>
          <div className="receipt-row">
            <span className="receipt-label">Total Pembayaran:</span>
            <span className="receipt-value">Rp 49.000</span>
          </div>
          <div className="receipt-row">
            <span className="receipt-label">Status Pembayaran:</span>
            <span className="badge badge-success">
              <ShieldCheck size={14} className="inline-icon" /> LUNAS
            </span>
          </div>
        </div>

        {/* Benefits Checklist */}
        <div className="benefits-card">
          <h3>Fitur PRO yang Sudah Terbuka:</h3>
          <ul>
            <li><CheckCircle size={18} className="check-icon" /> 3.000 Universal AI Usage / Bulan</li>
            <li><CheckCircle size={18} className="check-icon" /> Analisis Wajah & Rekomendasi Medis Mendalam</li>
            <li><CheckCircle size={18} className="check-icon" /> Peringatan Bahan Berbahaya/Alergi Otomatis</li>
            <li><CheckCircle size={18} className="check-icon" /> Tanya Jawab AI Gaya Gen Z Professional 24/7</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="action-grid">
          <Link to="/face-scan" className="btn btn-primary btn-block">
            <ScanFace size={18} /> Coba Scan Wajah Sekarang
          </Link>
          <div className="secondary-actions">
            <Link to="/chatbot" className="btn btn-outline flex-1">
              <MessageSquare size={18} /> Chat AI
            </Link>
            <Link to="/wallet" className="btn btn-ghost flex-1">
              Ke Wallet <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        .payment-success-page {
          padding-bottom: 120px;
          display: flex;
          justify-content: center;
        }

        .success-card {
          width: 100%;
          max-width: 540px;
          padding: var(--space-2xl);
          border-radius: var(--radius-2xl);
          background: linear-gradient(180deg, rgba(168,85,247,0.15) 0%, rgba(15,13,25,0.9) 100%);
          border: 1px solid rgba(168,85,247,0.3);
          text-align: center;
          box-shadow: 0 16px 48px rgba(107, 33, 168, 0.25);
        }

        .crown-badge-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: var(--space-lg);
          position: relative;
        }

        .crown-circle {
          width: 88px;
          height: 88px;
          border-radius: 50%;
          background: linear-gradient(135deg, #FBBF24, #D97706);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 8px 32px rgba(245, 158, 11, 0.4);
          animation: pulseCrown 3s infinite ease-in-out;
        }

        @keyframes pulseCrown {
          0%, 100% { transform: scale(1); box-shadow: 0 8px 32px rgba(245, 158, 11, 0.4); }
          50% { transform: scale(1.05); box-shadow: 0 12px 44px rgba(245, 158, 11, 0.6); }
        }

        .sparkle-badge {
          margin-top: 12px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8125rem;
          font-weight: 700;
          color: #FBBF24;
          background: rgba(245, 158, 11, 0.15);
          padding: 4px 14px;
          border-radius: 20px;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .success-title {
          font-size: 1.5rem;
          font-weight: 800;
          margin-bottom: 8px;
          background: linear-gradient(135deg, #ffffff 0%, #e9d5ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .success-subtitle {
          font-size: 0.875rem;
          color: var(--color-text-muted);
          margin-bottom: var(--space-xl);
          line-height: 1.5;
        }

        .receipt-box {
          background: rgba(0,0,0,0.3);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-md);
          margin-bottom: var(--space-xl);
          text-align: left;
          font-size: 0.875rem;
        }

        .receipt-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px dashed rgba(255,255,255,0.08);
        }
        .receipt-row:last-child { border-bottom: none; }

        .receipt-label { color: var(--color-text-muted); }
        .receipt-value { font-weight: 600; color: white; }
        .receipt-value.code { font-family: monospace; font-size: 0.8125rem; color: var(--color-brand-300); }
        .receipt-value.highlight { color: #FBBF24; }

        .badge-success {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
          padding: 2px 10px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.75rem;
        }

        .benefits-card {
          text-align: left;
          background: rgba(168,85,247,0.05);
          border-radius: var(--radius-lg);
          padding: var(--space-md);
          margin-bottom: var(--space-xl);
        }
        .benefits-card h3 { font-size: 0.875rem; color: var(--color-brand-300); margin-bottom: 12px; }
        .benefits-card ul { list-style: none; padding: 0; margin: 0; }
        .benefits-card li {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.8125rem;
          color: var(--color-text-secondary);
          margin-bottom: 8px;
        }
        .check-icon { color: #22c55e; flex-shrink: 0; }

        .action-grid { display: flex; flex-direction: column; gap: 12px; }
        .secondary-actions { display: flex; gap: 12px; }
        .flex-1 { flex: 1; }
      `}</style>
    </div>
  )
}
