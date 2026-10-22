import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Crown, CheckCircle, Sparkles, ScanFace, MessageSquare, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import type { Subscription } from '@/types/database'
import { isActiveGlow } from '@/utils/subscriptionHelpers'
import { Button, Badge } from '@/components/ui'

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
    <div className="cluv-canvas-focused cluv-animate-fade">
      {/* Back to Billing */}
      <Link
        to="/profile/billing"
        className="cluv-link is-muted cluv-flex-row cluv-items-center cluv-gap-1 cluv-mb-4"
      >
        <ArrowLeft size={16} /> Kembali ke Billing & Langganan
      </Link>

      <div className="cluv-card cluv-items-center cluv-text-center">
        {/* Animated Celebration Crown/Sparkle */}
        <div className="cluv-card-icon-wrap is-xl is-gold cluv-mb-3 cluv-animate-pulse">
          {isGlowPlan ? <Sparkles size={34} /> : <Crown size={36} />}
        </div>
        
        <div>
          <Badge variant="gold" icon={<Sparkles size={13} />} className="cluv-mb-2">
            Status {isGlowPlan ? 'GLOW' : 'PRO'} Aktif
          </Badge>
        </div>

        <h1 className="cluv-title-card cluv-mt-2 cluv-mb-1">
          Selamat! Kamu Resmi Memiliki Akses {isGlowPlan ? 'GLOW' : 'PRO'}
        </h1>
        <p className="cluv-caption cluv-text-muted cluv-mb-6 cluv-max-w-md">
          Nikmati akses analisis kondisi kulit &amp; konsultasi Skinsistant AI selama 30 hari ke depan.
        </p>

        {/* Invoice Summary Box */}
        <div className="cluv-receipt-box cluv-mb-5">
          <div className="cluv-receipt-row">
            <span className="cluv-receipt-label">No. Referensi:</span>
            <span className="cluv-receipt-val cluv-font-mono cluv-text-teal">{reference}</span>
          </div>
          <div className="cluv-receipt-row">
            <span className="cluv-receipt-label">Paket:</span>
            <span className="cluv-receipt-val cluv-text-teal">{planName}</span>
          </div>
          <div className="cluv-receipt-row">
            <span className="cluv-receipt-label">Total Pembayaran:</span>
            <span className="cluv-receipt-val">{planPriceFormatted}</span>
          </div>
          <div className="cluv-receipt-row">
            <span className="cluv-receipt-label">Status Pembayaran:</span>
            <Badge variant="teal" icon={<CheckCircle size={12} />}>
              LUNAS
            </Badge>
          </div>
        </div>

        {/* Benefits Checklist */}
        <div className="cluv-card is-compact cluv-w-full cluv-mb-5 cluv-text-left">
          <h3 className="cluv-caption cluv-font-bold cluv-text-muted cluv-mb-3">
            FITUR {isGlowPlan ? 'GLOW' : 'PRO'} YANG SUDAH TERBUKA:
          </h3>
          <ul className="cluv-feature-list">
            <li className="cluv-feature-item">
              <CheckCircle size={16} className="cluv-text-teal" />
              <span>{isGlowPlan ? '100 Universal AI Usage / 30 Hari' : '500 Universal AI Usage / 30 Hari'}</span>
            </li>
            <li className="cluv-feature-item">
              <CheckCircle size={16} className="cluv-text-teal" />
              <span>Analisis Kulit AI &amp; Rekomendasi Rutinitas yang Dipersonalisasi</span>
            </li>
            <li className="cluv-feature-item">
              <CheckCircle size={16} className="cluv-text-teal" />
              <span>Peringatan Komposisi &amp; Deteksi Interaksi Skincare</span>
            </li>
            <li className="cluv-feature-item">
              <CheckCircle size={16} className="cluv-text-teal" />
              <span>Tanya Jawab Edukatif Bersama Skinsistant AI 24/7</span>
            </li>
          </ul>
        </div>

        {/* Non-Therapeutic Compliance Disclaimer (RFC 016/017) */}
        <div className="cluv-card-note cluv-w-full cluv-mb-6 cluv-text-left">
          <AlertCircle size={16} />
          <p className="cluv-caption">
            <strong>Pemberitahuan Kepatuhan:</strong> Skincluv adalah panduan perawatan kosmetik berbasis AI — bukan diagnosis klinis, resep obat, atau pengganti dokter spesialis dermatologi.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="cluv-flex-col cluv-gap-3 cluv-w-full">
          <Button
            variant="primary"
            size="md"
            block
            iconLeft={<ScanFace size={18} />}
            to="/face-scan"
          >
            Coba Scan Wajah Sekarang
          </Button>
          <div className="cluv-flex-row cluv-gap-3 cluv-w-full">
            <Button
              variant="outline"
              size="md"
              iconLeft={<MessageSquare size={16} />}
              to="/chatbot"
              className="cluv-flex-1"
            >
              Chat AI
            </Button>
            <Button
              variant="ghost"
              size="md"
              iconRight={<ArrowRight size={14} />}
              to="/transactions"
              className="cluv-flex-1"
            >
              Riwayat Tagihan
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
