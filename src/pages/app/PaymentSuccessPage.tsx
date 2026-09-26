import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Crown, CheckCircle, Sparkles, ScanFace, MessageSquare, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import type { Subscription } from '@/types/database'
import { isActiveGlow } from '@/utils/subscriptionHelpers'

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const reference = searchParams.get('reference') || searchParams.get('tripay_merchant_ref') || 'INV-PRO'
  const { subscription, setSubscription } = useAuthStore()
  const [invoice, setInvoice] = useState<any>(null)

  useEffect(() => {
    // Re-hydrate subscription data and verify payment status with gateway
    const syncAndRefresh = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      // 1. Trigger tripay-check-status as fallback settlement
      if (reference && reference !== 'INV-PRO') {
        try {
          const { data: checkRes } = await supabase.functions.invoke('tripay-check-status', {
            body: { reference }
          })
          if (checkRes?.invoice) {
            setInvoice(checkRes.invoice)
          }
        } catch (e) {
          console.warn('[PaymentSuccessPage] check-status fallback notice:', e)
        }
      }

      // 2. Query active subscription from database
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*, subscription_tiers(name, slug)')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .maybeSingle()

      if (subData) {
        setSubscription(subData as unknown as Subscription)
      }

      // 3. Fallback invoice fetch if check-status didn't set it
      if (reference && reference !== 'INV-PRO') {
        const { data: invData } = await supabase
          .from('tripay_invoices')
          .select('*')
          .or(`reference.eq.${reference},merchant_ref.eq.${reference}`)
          .maybeSingle()

        if (invData) {
          setInvoice(invData)
        }
      }
    }

    syncAndRefresh()
  }, [reference, setSubscription])

  const isGlowPlan = 
    invoice?.merchant_ref?.includes('GLOW') || 
    (!invoice && isActiveGlow(subscription))

  const planName = isGlowPlan ? 'Skincluv GLOW (Akses 30 Hari)' : 'Skincluv PRO (Akses 30 Hari)'
  const planPriceFormatted = invoice 
    ? `Rp ${(invoice.total_amount_idr || invoice.amount_idr)?.toLocaleString('id-ID')}` 
    : (isGlowPlan ? 'Rp 25.000' : 'Rp 49.000')

  return (
    <div className="payment-success-page animate-fade-in">
      <div className="success-card glass-card">
        <div className="crown-badge-wrapper">
          <div className={`crown-circle ${isGlowPlan ? 'crown-circle-glow' : ''}`}>
            {isGlowPlan ? <Sparkles size={44} className="crown-icon-animated" /> : <Crown size={48} className="crown-icon-animated" />}
          </div>
          <div className="sparkle-badge">
            <Sparkles size={16} /> Status {isGlowPlan ? 'GLOW' : 'PRO'} Aktif
          </div>
        </div>

        <h1 className="success-title">Selamat! Kamu Resmi Memiliki Akses {isGlowPlan ? 'GLOW' : 'PRO'}</h1>
        <p className="success-subtitle">
          Nikmati akses analisis kulit cerdas & komunikasi tanpa batas bersama AI Skincluv selama 30 hari ke depan.
        </p>

        {/* Invoice Summary Box */}
        <div className="receipt-box">
          <div className="receipt-row">
            <span className="receipt-label">No. Referensi:</span>
            <span className="receipt-value code">{reference}</span>
          </div>
          <div className="receipt-row">
            <span className="receipt-label">Paket:</span>
            <span className="receipt-value highlight">{planName}</span>
          </div>
          <div className="receipt-row">
            <span className="receipt-label">Total Pembayaran:</span>
            <span className="receipt-value">{planPriceFormatted}</span>
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
          <h3>Fitur {isGlowPlan ? 'GLOW' : 'PRO'} yang Sudah Terbuka:</h3>
          <ul>
            <li>
              <CheckCircle size={18} className="check-icon" /> 
              {isGlowPlan ? '100 Universal AI Usage / 30 Hari' : '500 Universal AI Usage / 30 Hari'}
            </li>
            <li>
              <CheckCircle size={18} className="check-icon" /> 
              Analisis Wajah AI & Rekomendasi Perawatan Kulit yang Dipersonalisasi
            </li>
            <li>
              <CheckCircle size={18} className="check-icon" /> 
              Peringatan Bahan Berbahaya & Kontraindikasi Skincare
            </li>
            <li>
              <CheckCircle size={18} className="check-icon" /> 
              Tanya Jawab AI Konsultan Skincare 24/7
            </li>
          </ul>
        </div>

        {/* BPOM Compliance Disclaimer */}
        <div className="bpom-disclaimer-box">
          <AlertCircle size={15} className="disclaimer-icon" />
          <p>
            <strong>Catatan Kepatuhan:</strong> Skincluv adalah alat bantu perawatan kulit berbasis AI — bukan pengganti diagnosis medis, resep obat, atau konsultasi dokter spesialis kulit.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="action-grid mt-lg">
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
          width: 100%;
        }

        .success-card {
          width: 100%;
          max-width: 540px;
          padding: var(--space-2xl);
          border-radius: var(--radius-2xl);
          background: #ffffff;
          border: 1px solid #e2e8f0;
          text-align: center;
          box-shadow: var(--shadow-lg);
        }

        .crown-badge-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: var(--space-lg);
          position: relative;
        }

        .crown-circle {
          width: 84px;
          height: 84px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 8px 30px rgba(217, 119, 6, 0.25);
          animation: pulseCrown 3s infinite ease-in-out;
        }

        .crown-circle-glow {
          background: linear-gradient(135deg, #0ea5e9, #0284c7);
          box-shadow: 0 8px 30px rgba(14, 165, 233, 0.25);
        }

        @keyframes pulseCrown {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .sparkle-badge {
          margin-top: 12px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--color-primary);
          background: #e0f2fe;
          padding: 4px 14px;
          border-radius: var(--radius-full);
          border: 1px solid #bae6fd;
        }

        .success-title {
          font-size: 1.5rem;
          font-weight: 800;
          margin-bottom: 8px;
          color: var(--color-primary);
          font-family: var(--font-heading);
        }

        .success-subtitle {
          font-size: 0.875rem;
          color: var(--color-text-muted);
          margin-bottom: var(--space-xl);
          line-height: 1.5;
        }

        .receipt-box {
          background: var(--color-surface-bg, #f8fafc);
          border: 1px solid #e2e8f0;
          border-radius: var(--radius-xl);
          padding: var(--space-md) var(--space-lg);
          margin-bottom: var(--space-lg);
          text-align: left;
          font-size: 0.875rem;
        }

        .receipt-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px dashed #e2e8f0;
        }
        .receipt-row:last-child { border-bottom: none; }

        .receipt-label { color: var(--color-text-muted); font-size: 0.8125rem; }
        .receipt-value { font-weight: 700; color: var(--color-text-main); }
        .receipt-value.code { font-family: monospace; font-size: 0.8125rem; color: var(--color-primary); }
        .receipt-value.highlight { color: var(--color-primary); font-family: var(--font-heading); font-weight: 800; }

        .badge-success {
          background: #dcfce7;
          color: #15803d;
          border: 1px solid #bbf7d0;
          padding: 2px 10px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.75rem;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .benefits-card {
          text-align: left;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: var(--radius-xl);
          padding: var(--space-md) var(--space-lg);
          margin-bottom: var(--space-lg);
        }
        .benefits-card h3 { font-size: 0.875rem; color: var(--color-primary); margin-bottom: 12px; font-weight: 700; font-family: var(--font-heading); }
        .benefits-card ul { list-style: none; padding: 0; margin: 0; }
        .benefits-card li {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.8125rem;
          color: var(--color-text-main);
          margin-bottom: 8px;
        }
        .check-icon { color: #10b981; flex-shrink: 0; }

        .bpom-disclaimer-box {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: #fffbeb;
          border: 1px solid #fef3c7;
          border-radius: var(--radius-lg);
          padding: 12px 14px;
          margin-bottom: var(--space-lg);
          text-align: left;
        }
        .disclaimer-icon {
          color: #d97706;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .bpom-disclaimer-box p {
          margin: 0;
          font-size: 0.75rem;
          color: #92400e;
          line-height: 1.45;
        }
        .bpom-disclaimer-box strong {
          color: #78350f;
        }

        .action-grid { display: flex; flex-direction: column; gap: 12px; }
        .secondary-actions { display: flex; gap: 12px; }
        .flex-1 { flex: 1; }
      `}</style>
    </div>
  )
}
