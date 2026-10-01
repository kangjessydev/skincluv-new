import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Crown, CheckCircle, Sparkles, ScanFace, MessageSquare, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react'
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
    <div className="v0-page-container animate-fade-in">
      <div className="v0-profile-form-container">
        <div style={{ marginBottom: '16px' }}>
          <Link to="/profile/billing" className="v0-back-link">
            <ArrowLeft size={16} /> Kembali ke Billing & Langganan
          </Link>
        </div>

        <div className="v0-profile-card" style={{ padding: '32px 28px', textAlign: 'center' }}>
          {/* Animated Celebration Crown/Sparkle */}
          <div className={`v0-celebrate-circle ${isGlowPlan ? 'glow' : ''}`}>
            {isGlowPlan ? <Sparkles size={40} /> : <Crown size={42} />}
          </div>
          <div>
            <span className="v0-celebrate-badge">
              <Sparkles size={14} /> Status {isGlowPlan ? 'GLOW' : 'PRO'} Aktif
            </span>
          </div>

          <h1 className="v0-profile-form-main-title" style={{ fontSize: '1.375rem', marginBottom: '8px' }}>
            Selamat! Kamu Resmi Memiliki Akses {isGlowPlan ? 'GLOW' : 'PRO'}
          </h1>
          <p className="v0-profile-form-main-sub" style={{ marginBottom: '24px' }}>
            Nikmati akses analisis kondisi kulit & konsultasi Skinsistant AI selama 30 hari ke depan.
          </p>

          {/* Invoice Summary Box */}
          <div className="v0-receipt-box">
            <div className="v0-receipt-row">
              <span className="v0-receipt-label">No. Referensi:</span>
              <span className="v0-receipt-val code">{reference}</span>
            </div>
            <div className="v0-receipt-row">
              <span className="v0-receipt-label">Paket:</span>
              <span className="v0-receipt-val highlight">{planName}</span>
            </div>
            <div className="v0-receipt-row">
              <span className="v0-receipt-label">Total Pembayaran:</span>
              <span className="v0-receipt-val">{planPriceFormatted}</span>
            </div>
            <div className="v0-receipt-row">
              <span className="v0-receipt-label">Status Pembayaran:</span>
              <span className="v0-badge success">
                <CheckCircle size={12} /> LUNAS
              </span>
            </div>
          </div>

          {/* Benefits Checklist */}
          <div className="v0-benefits-card">
            <h3>Fitur {isGlowPlan ? 'GLOW' : 'PRO'} yang Sudah Terbuka:</h3>
            <ul className="v0-benefits-list">
              <li>
                <CheckCircle size={16} className="v0-benefits-icon" />
                <span>{isGlowPlan ? '100 Universal AI Usage / 30 Hari' : '500 Universal AI Usage / 30 Hari'}</span>
              </li>
              <li>
                <CheckCircle size={16} className="v0-benefits-icon" />
                <span>Analisis Kulit AI & Rekomendasi Rutinitas yang Dipersonalisasi</span>
              </li>
              <li>
                <CheckCircle size={16} className="v0-benefits-icon" />
                <span>Peringatan Komposisi & Deteksi Interaksi Skincare</span>
              </li>
              <li>
                <CheckCircle size={16} className="v0-benefits-icon" />
                <span>Tanya Jawab Edukatif Bersama Skinsistant AI 24/7</span>
              </li>
            </ul>
          </div>

          {/* Non-Therapeutic Compliance Disclaimer (RFC 016/017) */}
          <div className="v0-disclaimer-box">
            <AlertCircle size={16} className="v0-disclaimer-icon" />
            <p>
              <strong>Pemberitahuan Kepatuhan:</strong> Skincluv adalah panduan perawatan kosmetik berbasis AI — bukan diagnosis klinis, resep obat, atau pengganti dokter spesialis dermatologi.
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
            <Link to="/face-scan" className="v0-btn-action" style={{ justifyContent: 'center', padding: '12px 18px', fontSize: '0.875rem' }}>
              <ScanFace size={18} /> Coba Scan Wajah Sekarang
            </Link>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link to="/chatbot" className="v0-profile-chip" style={{ flex: 1, justifyContent: 'center', textDecoration: 'none' }}>
                <MessageSquare size={15} /> Chat AI
              </Link>
              <Link to="/transactions" className="v0-profile-chip" style={{ flex: 1, justifyContent: 'center', textDecoration: 'none' }}>
                Riwayat Tagihan <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
