import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Copy, Check, RefreshCw, QrCode, CreditCard, Store, Clock, ExternalLink, ArrowLeft, ShieldAlert, CheckCircle2, ChevronRight, Crown, ShoppingBag } from 'lucide-react'
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
  const navigate = useNavigate()
  const { session, profile } = useAuthStore()

  // State for Review & Method Selector Mode (when reference is undefined)
  const [selectedMethod, setSelectedMethod] = useState<string>('BRIVA')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

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
  const fetchInvoiceStatus = async (showLoadingState = false) => {
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
  }

  useEffect(() => {
    if (reference) {
      fetchInvoiceStatus()
    } else {
      setLoading(false)
    }
  }, [reference])

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
    try {
      const { data, error } = await supabase.functions.invoke('tripay-invoice', {
        body: { plan: 'PREMIUM', method: selectedMethod }
      })

      if (error) {
        let msg = error.message
        if ((error as any).context) {
          try {
            const ctxJson = await (error as any).context.json()
            if (ctxJson?.error) msg = ctxJson.error
          } catch {}
        }
        alert('Gagal membuat tagihan: ' + msg)
        return
      }

      if (data?.checkout_url) {
        // Direct redirect to official Tripay payment page (with Admin Fee, VA Code, QRIS & Sandbox simulation!)
        window.location.href = data.checkout_url
      } else {
        alert('Gagal mendapatkan URL pembayaran: ' + (data?.error || 'Unknown error'))
      }
    } catch (err: any) {
      alert('Gagal memproses pembayaran: ' + (err.message || err))
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
                <Crown size={24} className="icon-gold" />
                <div>
                  <h4>Skincluv PRO (1 Bulan)</h4>
                  <p>3.000 Universal AI Usage & Analisis Wajah Medis</p>
                </div>
              </div>
              <div className="item-price">Rp 49.000</div>
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
              <strong>Rp 49.000</strong>
            </div>
            <div className="total-row note-row">
              <span className="note-text">
                *Biaya administrasi bank/e-Wallet akan dihitung resmi oleh Tripay di halaman berikutnya.
              </span>
            </div>
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
          .checkout-page { padding-bottom: 120px; max-width: 600px; margin: 0 auto; }
          .checkout-header { margin-bottom: var(--space-lg); }
          .back-link { display: inline-flex; align-items: center; gap: 6px; color: var(--color-brand-300); font-size: 0.875rem; text-decoration: none; margin-bottom: 4px; }
          .checkout-header h1 { font-size: 1.5rem; margin: 0; }
          .page-subtitle { color: var(--color-text-muted); font-size: 0.875rem; margin-top: 2px; }

          .checkout-review-grid { display: flex; flex-direction: column; gap: var(--space-lg); }
          .review-card { padding: var(--space-xl); border-radius: var(--radius-2xl); border: 1px solid var(--color-border); }
          .section-heading { font-size: 1rem; margin-bottom: var(--space-md); display: flex; align-items: center; gap: 8px; color: var(--color-brand-300); }

          .order-item-box { display: flex; justify-content: space-between; align-items: center; padding-bottom: 14px; border-bottom: 1px dashed var(--color-border); }
          .item-left { display: flex; align-items: center; gap: 12px; }
          .icon-gold { color: #FBBF24; }
          .item-left h4 { font-size: 1rem; margin: 0 0 2px 0; }
          .item-left p { font-size: 0.75rem; color: var(--color-text-muted); margin: 0; }
          .item-price { font-size: 1.125rem; font-weight: 800; color: white; }

          .customer-info-box { margin-top: 14px; display: flex; flex-direction: column; font-size: 0.8125rem; }
          .box-label { color: var(--color-text-muted); font-size: 0.75rem; margin-bottom: 2px; }
          .customer-name { font-weight: 700; color: white; }
          .customer-email { color: var(--color-brand-300); }

          .channel-select-group { display: flex; flex-direction: column; gap: 8px; }
          .category-title { font-size: 0.75rem; font-weight: 700; color: var(--color-text-muted); display: flex; align-items: center; gap: 6px; }
          .mt-md { margin-top: 14px; }

          .channel-option {
            display: flex; align-items: center; gap: 12px; padding: 12px 14px;
            background: rgba(255,255,255,0.03); border: 1px solid var(--color-border);
            border-radius: var(--radius-lg); cursor: pointer; transition: all 0.2s;
          }
          .channel-option:hover { background: rgba(168,85,247,0.1); border-color: var(--color-brand-400); }
          .channel-option.selected { background: rgba(168,85,247,0.15); border-color: var(--color-brand-400); box-shadow: 0 2px 12px rgba(168,85,247,0.2); }
          .channel-option input { accent-color: var(--color-brand-500); width: 16px; height: 16px; }

          .option-label { display: flex; justify-content: space-between; align-items: center; width: 100%; font-size: 0.875rem; font-weight: 600; }
          .tag { font-size: 0.6875rem; font-weight: 700; }
          .tag-qris { color: #22c55e; }
          .tag-va { color: #3b82f6; }
          .tag-retail { color: #f59e0b; }

          .total-summary-card { background: linear-gradient(135deg, rgba(168,85,247,0.1), rgba(20,15,35,0.9)); }
          .total-row { display: flex; justify-content: space-between; font-size: 1rem; color: white; margin-bottom: 4px; }
          .total-row strong { font-size: 1.25rem; color: #FBBF24; }
          .note-row { margin-top: 4px; }
          .note-text { font-size: 0.75rem; color: var(--color-text-muted); font-style: italic; }
          .btn-pay-now { width: 100%; justify-content: center; gap: 8px; box-shadow: 0 4px 20px rgba(168, 85, 247, 0.4); }
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
  const qrUrl = tripayDetail?.qr_url || invoice?.qr_url || tripayDetail?.qr_string
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
            <strong>Skincluv PRO (1 Bulan)</strong>
          </div>
          <div className="summary-row">
            <span>Total Tagihan:</span>
            <strong className="amount">Rp {invoice.amount_idr?.toLocaleString('id-ID')}</strong>
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
        .back-link { display: inline-flex; align-items: center; gap: 6px; color: var(--color-brand-300); font-size: 0.875rem; text-decoration: none; }
        .checkout-header h1 { font-size: 1.5rem; margin: 0; }

        .checkout-loading, .checkout-not-found {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 80px 20px; text-align: center; gap: 16px;
        }

        .checkout-card {
          padding: var(--space-xl); border-radius: var(--radius-2xl);
          background: var(--color-surface-glass); border: 1px solid var(--color-border);
        }

        .status-banner {
          display: flex; justify-content: space-between; align-items: center;
          padding-bottom: var(--space-md); border-bottom: 1px dashed var(--color-border);
          margin-bottom: var(--space-lg);
        }
        .status-info { display: flex; align-items: center; gap: 8px; font-size: 0.875rem; }
        .badge { padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; }
        .badge-warning { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); }
        .badge-success { background: rgba(34, 197, 94, 0.15); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.3); }
        .badge-danger { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }
        
        .timer-info { display: flex; align-items: center; gap: 6px; font-size: 0.8125rem; color: var(--color-text-muted); }
        .timer-text { color: #f59e0b; font-family: monospace; font-size: 0.9375rem; }

        .summary-box {
          background: rgba(0,0,0,0.25); padding: var(--space-md);
          border-radius: var(--radius-lg); margin-bottom: var(--space-xl);
          font-size: 0.875rem; display: flex; flex-direction: column; gap: 8px;
        }
        .summary-row { display: flex; justify-content: space-between; color: var(--color-text-secondary); }
        .summary-row .code { font-family: monospace; font-size: 0.8125rem; color: var(--color-brand-300); }
        .summary-row .amount { color: #FBBF24; font-size: 1rem; }

        .method-instruction-box {
          background: linear-gradient(135deg, rgba(168,85,247,0.1), rgba(59,130,246,0.1));
          border: 1px solid rgba(168,85,247,0.3); border-radius: var(--radius-xl);
          padding: var(--space-xl); margin-bottom: var(--space-xl); text-align: center;
        }
        .method-title-bar {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          color: var(--color-brand-300); margin-bottom: var(--space-lg);
        }
        .method-title-bar h3 { font-size: 1.125rem; margin: 0; }

        .pay-code-container { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .pay-code-label { font-size: 0.8125rem; color: var(--color-text-muted); }
        .pay-code-box {
          display: flex; align-items: center; gap: 12px; background: rgba(0,0,0,0.4);
          padding: 8px 16px; border-radius: var(--radius-lg); border: 1px solid var(--color-brand-500);
        }
        .pay-code-number { font-size: 1.5rem; font-weight: 800; font-family: monospace; color: white; letter-spacing: 1px; }
        .btn-copy { gap: 6px; }
        .pay-code-sub { font-size: 0.75rem; color: var(--color-text-muted); max-width: 340px; margin-top: 4px; }

        .qris-container { display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .qr-image-wrapper { background: white; padding: 12px; border-radius: var(--radius-lg); box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
        .qr-code-img { width: 200px; height: 200px; display: block; }
        .qris-guide { font-size: 0.8125rem; color: var(--color-text-muted); max-width: 360px; line-height: 1.4; }

        .checkout-actions { display: flex; flex-direction: column; gap: 12px; text-align: center; }
        .btn-check-status { box-shadow: 0 4px 20px rgba(168, 85, 247, 0.3); gap: 8px; }
        .history-link { font-size: 0.8125rem; color: var(--color-text-muted); text-decoration: none; margin-top: 4px; }
        .history-link:hover { color: white; }
      `}</style>
    </div>
  )
}
