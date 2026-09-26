import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'
import { Copy, Check, RefreshCw, QrCode, CreditCard, Store, Clock, ExternalLink, ArrowLeft, ShieldAlert, CheckCircle2, ChevronRight, Crown, ShoppingBag, Sparkles, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

interface PaymentChannel {
  code: string
  name: string
  category: 'qris' | 'va' | 'retail'
  iconLabel: string
}

const PAYMENT_CHANNELS: PaymentChannel[] = [
  { code: 'QRIS', name: 'QRIS (GoPay, OVO, Dana, ShopeePay)', category: 'qris', iconLabel: '⚡ Instan' },
  { code: 'BRIVA', name: 'BRI Virtual Account', category: 'va', iconLabel: 'Bank BRI' },
  { code: 'BCAVA', name: 'BCA Virtual Account', category: 'va', iconLabel: 'Bank BCA' },
  { code: 'MANDIRIVA', name: 'Mandiri Virtual Account', category: 'va', iconLabel: 'Mandiri' },
  { code: 'BNIVA', name: 'BNI Virtual Account', category: 'va', iconLabel: 'Bank BNI' },
  { code: 'PERMATAVA', name: 'Permata Virtual Account', category: 'va', iconLabel: 'Permata' },
  { code: 'ALFAMART', name: 'Alfamart / Alfamidi', category: 'retail', iconLabel: 'Retail' },
  { code: 'INDOMARET', name: 'Indomaret', category: 'retail', iconLabel: 'Retail' },
]

export default function CheckoutPage() {
  const { reference } = useParams<{ reference?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { session, profile } = useAuthStore()

  const planQuery = searchParams.get('plan')?.toLowerCase()
  const isGlow = planQuery === 'glow'
  const planSlug = isGlow ? 'GLOW' : 'PREMIUM'
  const planTitle = isGlow ? 'Skincluv GLOW (Akses 30 Hari)' : 'Skincluv PRO (Akses 30 Hari)'
  const planDesc = isGlow ? '100 Universal AI Usage / 30 Hari' : '500 Universal AI Usage & Konsultasi Chatbot AI'
  const planPriceFormatted = isGlow ? 'Rp 25.000' : 'Rp 49.000'

  // State for Review & Method Selector Mode (when reference is undefined)
  const [selectedMethod, setSelectedMethod] = useState<string>('BRIVA')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // State for Existing Invoice Mode (when reference is provided)
  const [loading, setLoading] = useState(!!reference)
  const [invoice, setInvoice] = useState<any>(null)
  const [tripayDetail, setTripayDetail] = useState<any>(null)
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState<string>('')

  // -------------------------------------------------------------
  // Mode A: Fetch Invoice Status for Existing Reference
  // -------------------------------------------------------------
  const fetchInvoiceStatus = useCallback(async (showLoadingState = false) => {
    if (!reference) return
    if (showLoadingState) setIsCheckingStatus(true)
    try {
      const { data, error } = await supabase.functions.invoke('tripay-check-status', {
        body: { reference }
      })

      if (error) {
        console.error('Check status error:', error)
      } else if (data?.success) {
        setInvoice(data.invoice)
        if (data.tripay_detail) {
          setTripayDetail(data.tripay_detail)
        }

        if (data.is_paid || data.status === 'PAID') {
          navigate(`/payment-success?reference=${reference}`)
        }
      }
    } catch (err) {
      console.error('Fetch invoice status error:', err)
    } finally {
      setLoading(false)
      if (showLoadingState) setIsCheckingStatus(false)
    }
  }, [reference, navigate])

  useEffect(() => {
    if (reference) {
      fetchInvoiceStatus()
    } else {
      setLoading(false)
    }
  }, [reference, fetchInvoiceStatus])

  // Countdown Timer for Existing Invoice Mode
  useEffect(() => {
    if (!invoice?.expired_at) return
    const interval = setInterval(() => {
      const expiry = new Date(invoice.expired_at).getTime()
      const now = new Date().getTime()
      const diff = expiry - now

      if (diff <= 0) {
        setTimeLeft('Expired')
        clearInterval(interval)
      } else {
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [invoice?.expired_at])

  // -------------------------------------------------------------
  // Mode B: Initiate Invoice & Redirect to Tripay Payment Page
  // -------------------------------------------------------------
  const handleProceedToPayment = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      const { data, error } = await supabase.functions.invoke('tripay-invoice', {
        body: { plan: planSlug, method: selectedMethod }
      })

      if (error) {
        let msg = error.message
        if ((error as any).context) {
          try {
            const ctxJson = await (error as any).context.json()
            if (ctxJson?.error) msg = ctxJson.error
          } catch {}
        }
        setErrorMessage(msg || 'Gagal membuat tagihan pembayaran.')
        return
      }

      if (data?.checkout_url) {
        // Direct redirect to official Tripay payment page (with Admin Fee, VA Code, QRIS & Sandbox simulation!)
        window.location.href = data.checkout_url
      } else {
        setErrorMessage(data?.error || 'Gagal mendapatkan URL pembayaran dari gateway.')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses pembayaran. Cek koneksi Anda.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="checkout-loading">
        <RefreshCw size={32} className="animate-spin text-brand" />
        <p>Memuat rincian transaksi...</p>
      </div>
    )
  }

  // =============================================================
  // MODE 1: ORDER REVIEW & METHOD SELECTION (No Reference Parameter)
  // =============================================================
  if (!reference) {
    return (
      <div className="checkout-page animate-fade-in">
        <div className="checkout-header">
          <Link to="/pricing" className="back-link">
            <ArrowLeft size={18} /> Pilihan Paket
          </Link>
          <h1>Checkout & Review Pesanan</h1>
          <p className="page-subtitle">Periksa rincian pesanan dan pilih metode pembayaran favoritmu.</p>
        </div>

        <div className="checkout-review-grid">
          {/* Order Summary Card */}
          <div className="review-card glass-card">
            <h3 className="section-heading"><ShoppingBag size={18} /> Rincian Pesanan</h3>
            <div className="order-item-box">
              <div className="item-left">
                {isGlow ? <Sparkles size={24} className="icon-amber" /> : <Crown size={24} className="icon-gold" />}
                <div>
                  <h4>{planTitle}</h4>
                  <p>{planDesc}</p>
                </div>
              </div>
              <div className="item-price">{planPriceFormatted}</div>
            </div>

            <div className="customer-info-box">
              <span className="box-label">Pemesan:</span>
              <strong className="customer-name">{profile?.full_name || 'Pelanggan Skincluv'}</strong>
              <span className="customer-email">{session?.user?.email}</span>
            </div>
          </div>

          {/* Payment Method Selector Card */}
          <div className="review-card glass-card">
            <h3 className="section-heading"><CreditCard size={18} /> Pilih Metode Pembayaran</h3>
            
            <div className="channel-select-group">
              <div className="category-title"><QrCode size={14} /> QRIS & E-WALLET</div>
              {PAYMENT_CHANNELS.filter(c => c.category === 'qris').map(ch => (
                <label 
                  key={ch.code} 
                  className={`channel-option ${selectedMethod === ch.code ? 'selected' : ''}`}
                  onClick={() => setSelectedMethod(ch.code)}
                >
                  <input type="radio" name="payment_method" value={ch.code} checked={selectedMethod === ch.code} readOnly />
                  <div className="option-label">
                    <span className="name">{ch.name}</span>
                    <span className="tag tag-qris">{ch.iconLabel}</span>
                  </div>
                </label>
              ))}

              <div className="category-title mt-md"><CreditCard size={14} /> VIRTUAL ACCOUNT (BANK TRANSFER)</div>
              {PAYMENT_CHANNELS.filter(c => c.category === 'va').map(ch => (
                <label 
                  key={ch.code} 
                  className={`channel-option ${selectedMethod === ch.code ? 'selected' : ''}`}
                  onClick={() => setSelectedMethod(ch.code)}
                >
                  <input type="radio" name="payment_method" value={ch.code} checked={selectedMethod === ch.code} readOnly />
                  <div className="option-label">
                    <span className="name">{ch.name}</span>
                    <span className="tag tag-va">{ch.iconLabel}</span>
                  </div>
                </label>
              ))}

              <div className="category-title mt-md"><Store size={14} /> GERAI RETAIL</div>
              {PAYMENT_CHANNELS.filter(c => c.category === 'retail').map(ch => (
                <label 
                  key={ch.code} 
                  className={`channel-option ${selectedMethod === ch.code ? 'selected' : ''}`}
                  onClick={() => setSelectedMethod(ch.code)}
                >
                  <input type="radio" name="payment_method" value={ch.code} checked={selectedMethod === ch.code} readOnly />
                  <div className="option-label">
                    <span className="name">{ch.name}</span>
                    <span className="tag tag-retail">{ch.iconLabel}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Payment Total & Submit CTA */}
          <div className="review-card glass-card total-summary-card">
            <div className="total-row">
              <span>Subtotal Paket:</span>
              <strong>{planPriceFormatted}</strong>
            </div>
            <div className="total-row note-row">
              <span className="note-text">
                *Biaya administrasi bank/e-Wallet akan dihitung resmi oleh Tripay di halaman berikutnya.
              </span>
            </div>
            <div className="checkout-trust-box">
              <div className="trust-header">
                <ShieldCheck size={18} className="trust-shield-icon" />
                <span className="trust-title">Pembayaran Aman & Transparan</span>
              </div>
              <p className="trust-text">
                Ini <strong>bukan langganan bulanan</strong>. Ini <strong>Paket Akses 30 Hari</strong> — sekali bayar, kuota langsung aktif. Saldo <strong>TIDAK AKAN</strong> terpotong otomatis di akhir periode. Kamu yang pegang kendali penuh.
              </p>
            </div>

            {errorMessage && (
              <div className="checkout-error-banner">
                <ShieldAlert size={18} className="error-icon" />
                <div className="error-content">
                  <p className="error-msg">{errorMessage}</p>
                  {errorMessage.includes('Payment gateway not configured') && (
                    <span className="error-hint">
                      Tips: Kredensial Tripay (TRIPAY_API_KEY, TRIPAY_PRIVATE_KEY, TRIPAY_MERCHANT_CODE) belum dikonfigurasi di Supabase Secrets.
                    </span>
                  )}
                </div>
              </div>
            )}

            <button 
              className="btn btn-primary btn-block btn-pay-now mt-md" 
              onClick={handleProceedToPayment}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={18} className="animate-spin" /> Memproses Tagihan...
                </>
              ) : (
                <>
                  Lanjut ke Pembayaran Tripay <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>

        <style>{`
          .checkout-error-banner {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: var(--radius-lg);
            padding: 12px 14px;
            margin-top: 12px;
            color: #dc2626;
          }
          .error-icon { flex-shrink: 0; margin-top: 2px; }
          .error-content { display: flex; flex-direction: column; gap: 2px; }
          .error-msg { margin: 0; font-size: 0.8125rem; font-weight: 600; line-height: 1.4; color: #dc2626; }
          .error-hint { font-size: 0.75rem; color: var(--color-text-muted); line-height: 1.3; }

          .checkout-page { padding-bottom: 120px; max-width: 600px; margin: 0 auto; width: 100%; }
          .checkout-header { margin-bottom: var(--space-lg); }
          .back-link { display: inline-flex; align-items: center; gap: 6px; color: var(--color-primary); font-size: 0.875rem; font-weight: 700; text-decoration: none; margin-bottom: 4px; }
          .back-link:hover { text-decoration: underline; }
          .checkout-header h1 { font-size: 1.5rem; margin: 0; color: var(--color-primary); font-family: var(--font-heading); }
          .page-subtitle { color: var(--color-text-muted); font-size: 0.875rem; margin-top: 2px; }

          .checkout-review-grid { display: flex; flex-direction: column; gap: var(--space-md); }
          .review-card { padding: var(--space-xl); border-radius: var(--radius-xl); border: 1px solid #e2e8f0; background: #ffffff; box-shadow: var(--shadow-sm); }
          .section-heading { font-size: 1rem; margin-bottom: var(--space-md); display: flex; align-items: center; gap: 8px; color: var(--color-primary); font-family: var(--font-heading); font-weight: 700; }

          .order-item-box { display: flex; justify-content: space-between; align-items: center; padding-bottom: 14px; border-bottom: 1px dashed #e2e8f0; }
          .item-left { display: flex; align-items: center; gap: 12px; }
          .icon-amber { color: #d97706; }
          .icon-gold { color: var(--color-tertiary-container); }
          .item-left h4 { font-size: 1rem; margin: 0 0 2px 0; color: var(--color-text-main); font-weight: 700; }
          .item-left p { font-size: 0.75rem; color: var(--color-text-muted); margin: 0; }
          .item-price { font-size: 1.125rem; font-weight: 800; color: var(--color-primary); }

          .customer-info-box { margin-top: 14px; display: flex; flex-direction: column; font-size: 0.8125rem; }
          .box-label { color: var(--color-text-muted); font-size: 0.75rem; margin-bottom: 2px; }
          .customer-name { font-weight: 700; color: var(--color-text-main); }
          .customer-email { color: var(--color-primary); }

          .channel-select-group { display: flex; flex-direction: column; gap: 8px; }
          .category-title { font-size: 0.75rem; font-weight: 700; color: var(--color-text-muted); display: flex; align-items: center; gap: 6px; letter-spacing: 0.03em; }
          .mt-md { margin-top: 14px; }

          .channel-option {
            display: flex; align-items: center; gap: 12px; padding: 12px 14px;
            background: var(--color-surface-bg, #f8fafc); border: 1px solid #e2e8f0;
            border-radius: var(--radius-lg); cursor: pointer; transition: all 0.2s ease;
          }
          .channel-option:hover { background: #f0f9ff; border-color: #7dd3fc; }
          .channel-option.selected { background: #f0fdf4; border-color: #0ea5e9; box-shadow: 0 2px 10px rgba(14, 165, 233, 0.12); }
          .channel-option input { accent-color: var(--color-primary); width: 16px; height: 16px; }

          .option-label { display: flex; justify-content: space-between; align-items: center; width: 100%; font-size: 0.875rem; font-weight: 600; color: var(--color-text-main); }
          .tag { font-size: 0.6875rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
          .tag-qris { color: #15803d; background: #dcfce7; }
          .tag-va { color: #0369a1; background: #e0f2fe; }
          .tag-retail { color: #b45309; background: #fef3c7; }

          .total-summary-card { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 1px solid #bae6fd; box-shadow: var(--shadow-sky); }
          .total-row { display: flex; justify-content: space-between; font-size: 1rem; color: var(--color-text-main); margin-bottom: 4px; }
          .total-row strong { font-size: 1.25rem; color: var(--color-primary); font-weight: 800; font-family: var(--font-heading); }
          .note-row { margin-top: 4px; }
          .note-text { font-size: 0.75rem; color: var(--color-text-muted); font-style: italic; }

          .checkout-trust-box {
            margin-top: 14px;
            padding: 12px 14px;
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: var(--radius-lg);
            text-align: left;
          }
          .trust-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 6px;
          }
          .trust-shield-icon {
            color: #16a34a;
            flex-shrink: 0;
          }
          .trust-title {
            font-size: 0.8125rem;
            font-weight: 700;
            color: #15803d;
            letter-spacing: 0.2px;
          }
          .trust-text {
            margin: 0;
            font-size: 0.75rem;
            color: #334155;
            line-height: 1.45;
          }
          .trust-text strong {
            color: #0f172a;
          }

          .btn-pay-now { width: 100%; justify-content: center; gap: 8px; margin-top: 16px; }
        `}</style>
      </div>
    )
  }

  // =============================================================
  // MODE 2: EXISTING INVOICE DETAIL & MANUAL STATUS CHECK (With Reference Parameter)
  // =============================================================
  if (!invoice) {
    return (
      <div className="checkout-not-found">
        <ShieldAlert size={48} color="#ef4444" />
        <h2>Transaksi Tidak Ditemukan</h2>
        <p>Nomor referensi `{reference}` tidak valid atau tidak terdaftar.</p>
        <Link to="/transactions" className="btn btn-primary mt-lg">Lihat Riwayat Transaksi</Link>
      </div>
    )
  }

  const payCode = tripayDetail?.pay_code || invoice?.pay_code || invoice?.reference || reference
  const rawQrUrl = tripayDetail?.qr_url || invoice?.qr_url
  const qrString = tripayDetail?.qr_string || invoice?.qr_string
  const qrUrl = rawQrUrl || (qrString ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrString)}` : null)
  const method = tripayDetail?.payment_method || invoice?.method || 'Virtual Account'
  const isPaid = invoice?.status === 'PAID'
  const isExpired = invoice?.status === 'EXPIRED' || timeLeft === 'Expired'

  return (
    <div className="checkout-page animate-fade-in">
      <div className="checkout-header">
        <Link to="/transactions" className="back-link">
          <ArrowLeft size={18} /> Riwayat Transaksi
        </Link>
        <h1>Detail Tagihan Pembayaran</h1>
      </div>

      <div className="checkout-card glass-card">
        {/* Status & Expiry Bar */}
        <div className="status-banner">
          <div className="status-info">
            <span className="label">Status:</span>
            {isPaid ? (
              <span className="badge badge-success"><CheckCircle2 size={14} /> LUNAS</span>
            ) : isExpired ? (
              <span className="badge badge-danger">KADALUARSA</span>
            ) : (
              <span className="badge badge-warning">BELUM DIBAYAR</span>
            )}
          </div>
          {!isPaid && !isExpired && (
            <div className="timer-info">
              <Clock size={14} /> Batas Waktu: <strong className="timer-text">{timeLeft || '24:00:00'}</strong>
            </div>
          )}
        </div>

        {/* Invoice Items Summary */}
        <div className="summary-box">
          <div className="summary-row">
            <span>No. Tagihan:</span>
            <strong className="code">{invoice.merchant_ref}</strong>
          </div>
          <div className="summary-row">
            <span>Produk:</span>
            <strong>{invoice.plan_name || (invoice.merchant_ref?.includes('GLOW') ? 'Skincluv GLOW (Akses 30 Hari)' : 'Skincluv PRO (Akses 30 Hari)')}</strong>
          </div>
          <div className="summary-row">
            <span>Total Tagihan:</span>
            <strong className="amount">Rp {(invoice.total_amount_idr || invoice.amount_idr)?.toLocaleString('id-ID')}</strong>
          </div>
        </div>

        {/* Method-Specific Instruction Box */}
        <div className="method-instruction-box">
          <div className="method-title-bar">
            {method.includes('QRIS') ? <QrCode size={20} /> : method.includes('MART') || method.includes('INDOMARET') ? <Store size={20} /> : <CreditCard size={20} />}
            <h3>Metode Pembayaran: {method}</h3>
          </div>

          {/* QRIS Display */}
          {method.includes('QRIS') && (
            <div className="qris-container">
              {qrUrl ? (
                <div className="qr-image-wrapper">
                  <img src={qrUrl} alt="QRIS Code" className="qr-code-img" />
                </div>
              ) : (
                <div className="qr-placeholder">
                  <QrCode size={64} color="var(--color-brand-400)" />
                  <p>Buka halaman Tripay untuk memindai QRIS</p>
                </div>
              )}
              <p className="qris-guide">
                Scan QR Code di atas menggunakan GoPay, OVO, ShopeePay, Dana, LinkAja, atau Mobile Banking kamu.
              </p>
            </div>
          )}

          {/* Virtual Account / Code Display */}
          {!method.includes('QRIS') && (
            <div className="pay-code-container">
              <span className="pay-code-label">
                {method.includes('MART') || method.includes('INDOMARET') ? 'Kode Pembayaran Minimarket:' : 'Nomor Virtual Account:'}
              </span>
              <div className="pay-code-box">
                <span className="pay-code-number">{payCode}</span>
                <button className="btn btn-primary btn-sm btn-copy" onClick={() => copyToClipboard(payCode)}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Tersalin!' : 'Salin'}
                </button>
              </div>
              <p className="pay-code-sub">
                Salin nomor di atas dan masukkan pada menu transfer Bank/Virtual Account kamu.
              </p>
            </div>
          )}
        </div>

        {/* Interactive Action Footer */}
        <div className="checkout-actions">
          <button 
            className="btn btn-primary btn-block btn-check-status" 
            onClick={() => fetchInvoiceStatus(true)}
            disabled={isCheckingStatus || isPaid}
          >
            <RefreshCw size={18} className={isCheckingStatus ? 'animate-spin' : ''} />
            {isCheckingStatus ? 'Mengecek ke Server...' : 'Cek Status Pembayaran'}
          </button>

          {invoice.checkout_url && (
            <a href={invoice.checkout_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-block">
              Buka Halaman Pembayaran Tripay <ExternalLink size={16} />
            </a>
          )}

          <Link to="/transactions" className="history-link">
            Lihat Semua Riwayat Transaksi Saya
          </Link>
        </div>
      </div>

      <style>{`
        .checkout-page { padding-bottom: 120px; max-width: 560px; margin: 0 auto; }
        .checkout-header { display: flex; flex-direction: column; gap: 8px; margin-bottom: var(--space-lg); }
        .back-link { display: inline-flex; align-items: center; gap: 6px; color: var(--color-primary); font-size: 0.875rem; font-weight: 700; text-decoration: none; }
        .back-link:hover { text-decoration: underline; }
        .checkout-header h1 { font-size: 1.5rem; margin: 0; color: var(--color-primary); font-family: var(--font-heading); }

        .checkout-loading, .checkout-not-found {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 80px 20px; text-align: center; gap: 16px;
        }

        .checkout-card {
          padding: var(--space-xl); border-radius: var(--radius-xl);
          background: #ffffff; border: 1px solid #e2e8f0; box-shadow: var(--shadow-sm);
        }

        .status-banner {
          display: flex; justify-content: space-between; align-items: center;
          padding-bottom: var(--space-md); border-bottom: 1px dashed #e2e8f0;
          margin-bottom: var(--space-lg);
        }
        .status-info { display: flex; align-items: center; gap: 8px; font-size: 0.875rem; color: var(--color-text-main); font-weight: 600; }
        .badge { padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; }
        .badge-warning { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
        .badge-success { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
        .badge-danger { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }
        
        .timer-info { display: flex; align-items: center; gap: 6px; font-size: 0.8125rem; color: var(--color-text-muted); }
        .timer-text { color: #d97706; font-family: monospace; font-size: 0.9375rem; }

        .summary-box {
          background: var(--color-surface-bg, #f8fafc); padding: var(--space-md);
          border: 1px solid #e2e8f0; border-radius: var(--radius-lg); margin-bottom: var(--space-xl);
          font-size: 0.875rem; display: flex; flex-direction: column; gap: 8px;
        }
        .summary-row { display: flex; justify-content: space-between; color: var(--color-text-muted); }
        .summary-row strong { color: var(--color-text-main); font-weight: 700; }
        .summary-row .code { font-family: monospace; font-size: 0.8125rem; color: var(--color-primary); }
        .summary-row .amount { color: var(--color-primary); font-size: 1.125rem; font-weight: 800; font-family: var(--font-heading); }

        .method-instruction-box {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 1px solid #bae6fd; border-radius: var(--radius-xl);
          padding: var(--space-xl); margin-bottom: var(--space-xl); text-align: center;
        }
        .method-title-bar {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          color: var(--color-primary); margin-bottom: var(--space-lg); font-weight: 700;
        }
        .method-title-bar h3 { font-size: 1.125rem; margin: 0; color: var(--color-primary); font-family: var(--font-heading); font-weight: 700; }

        .pay-code-container { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .pay-code-label { font-size: 0.8125rem; color: var(--color-text-muted); font-weight: 600; }
        .pay-code-box {
          display: flex; align-items: center; gap: 12px; background: #ffffff;
          padding: 8px 16px; border-radius: var(--radius-lg); border: 2px solid #0ea5e9;
          box-shadow: 0 4px 12px rgba(14, 165, 233, 0.15);
        }
        .pay-code-number { font-size: 1.5rem; font-weight: 800; font-family: monospace; color: #0f172a; letter-spacing: 1px; }
        .btn-copy { gap: 6px; }
        .pay-code-sub { font-size: 0.75rem; color: var(--color-text-muted); max-width: 340px; margin-top: 4px; }

        .qris-container { display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .qr-image-wrapper { background: white; padding: 12px; border-radius: var(--radius-lg); box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
        .qr-code-img { width: 200px; height: 200px; display: block; }
        .qr-placeholder {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 12px; padding: 32px; background: white; border-radius: var(--radius-lg);
          border: 1px dashed #cbd5e1; color: var(--color-text-muted);
        }
        .qris-guide { font-size: 0.8125rem; color: var(--color-text-muted); max-width: 360px; line-height: 1.4; }
        .name { font-weight: 600; color: var(--color-text-main); font-size: 0.875rem; }

        .checkout-actions { display: flex; flex-direction: column; gap: 12px; text-align: center; }
        .btn-check-status { gap: 8px; }
        .history-link { font-size: 0.8125rem; color: var(--color-text-muted); text-decoration: none; margin-top: 4px; font-weight: 600; }
        .history-link:hover { color: var(--color-primary); text-decoration: underline; }
      `}</style>
    </div>
  )
}
