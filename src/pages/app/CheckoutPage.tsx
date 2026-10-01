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
  { code: 'QRIS', name: 'QRIS (GoPay, OVO, Dana, ShopeePay)', category: 'qris', iconLabel: 'Instan' },
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

  const [tierPrice, setTierPrice] = useState<number | null>(null)

  useEffect(() => {
    async function fetchTierPrice() {
      try {
        const targetSlug = isGlow ? 'glow' : 'premium'
        const { data } = await supabase
          .from('subscription_tiers')
          .select('price_idr')
          .eq('slug', targetSlug)
          .maybeSingle()
        if (data && typeof data.price_idr === 'number') {
          setTierPrice(data.price_idr)
        }
      } catch {
        // Fallback default
      }
    }
    fetchTierPrice()
  }, [isGlow])

  const actualPrice = tierPrice ?? (isGlow ? 25000 : 49000)
  const planPriceFormatted = `Rp ${actualPrice.toLocaleString('id-ID')}`

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
      <div className="v0-page-container animate-fade-in">
        <div className="v0-empty-state" style={{ minHeight: '360px' }}>
          <RefreshCw size={32} className="animate-spin text-brand" />
          <p style={{ color: 'var(--color-ink-soft)', fontSize: '0.875rem' }}>Memuat rincian transaksi...</p>
        </div>
      </div>
    )
  }

  // =============================================================
  // MODE 1: ORDER REVIEW & METHOD SELECTION (No Reference Parameter)
  // =============================================================
  if (!reference) {
    return (
      <div className="v0-page-container animate-fade-in">
        <div className="v0-profile-form-container">
          <div style={{ marginBottom: '16px' }}>
            <Link to="/pricing" className="v0-back-link">
              <ArrowLeft size={16} /> Pilihan Paket
            </Link>
          </div>

          <div className="v0-profile-form-header" style={{ marginBottom: '24px', textAlign: 'left' }}>
            <h1 className="v0-profile-form-main-title">Checkout &amp; Review Pesanan</h1>
            <p className="v0-profile-form-main-sub">Periksa rincian pesanan dan pilih metode pembayaran favoritmu.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Order Summary Card */}
            <div className="v0-profile-card">
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--color-ink)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={18} style={{ color: 'var(--color-teal)' }} /> Rincian Pesanan
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '14px', borderBottom: '1px dashed var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {isGlow ? <Sparkles size={24} style={{ color: 'var(--color-status-attention)' }} /> : <Crown size={24} style={{ color: 'var(--color-gold)' }} />}
                  <div>
                    <h4 style={{ fontSize: '0.9375rem', margin: '0 0 2px', color: 'var(--color-ink)', fontWeight: 700 }}>{planTitle}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', margin: 0 }}>{planDesc}</p>
                  </div>
                </div>
                <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-teal)', fontFamily: 'var(--font-display)' }}>{planPriceFormatted}</div>
              </div>

              <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', fontSize: '0.8125rem', gap: '2px' }}>
                <span style={{ color: 'var(--color-ink-muted)', fontSize: '0.75rem' }}>Pemesan:</span>
                <strong style={{ fontWeight: 700, color: 'var(--color-ink)' }}>{profile?.full_name || 'Pelanggan Skincluv'}</strong>
                <span style={{ color: 'var(--color-teal)' }}>{session?.user?.email}</span>
              </div>
            </div>

            {/* Payment Method Selector Card */}
            <div className="v0-profile-card">
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--color-ink)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={18} style={{ color: 'var(--color-teal)' }} /> Pilih Metode Pembayaran
              </h3>

              <div className="v0-channel-group">
                <div className="v0-channel-category"><QrCode size={14} /> QRIS &amp; E-WALLET</div>
                {PAYMENT_CHANNELS.filter(c => c.category === 'qris').map(ch => (
                  <label
                    key={ch.code}
                    className={`v0-channel-option ${selectedMethod === ch.code ? 'selected' : ''}`}
                    onClick={() => setSelectedMethod(ch.code)}
                  >
                    <input type="radio" name="payment_method" value={ch.code} checked={selectedMethod === ch.code} readOnly />
                    <div className="v0-channel-label">
                      <span>{ch.name}</span>
                      <span className="v0-channel-tag qris">{ch.iconLabel}</span>
                    </div>
                  </label>
                ))}

                <div className="v0-channel-category"><CreditCard size={14} /> VIRTUAL ACCOUNT (BANK TRANSFER)</div>
                {PAYMENT_CHANNELS.filter(c => c.category === 'va').map(ch => (
                  <label
                    key={ch.code}
                    className={`v0-channel-option ${selectedMethod === ch.code ? 'selected' : ''}`}
                    onClick={() => setSelectedMethod(ch.code)}
                  >
                    <input type="radio" name="payment_method" value={ch.code} checked={selectedMethod === ch.code} readOnly />
                    <div className="v0-channel-label">
                      <span>{ch.name}</span>
                      <span className="v0-channel-tag va">{ch.iconLabel}</span>
                    </div>
                  </label>
                ))}

                <div className="v0-channel-category"><Store size={14} /> GERAI RETAIL</div>
                {PAYMENT_CHANNELS.filter(c => c.category === 'retail').map(ch => (
                  <label
                    key={ch.code}
                    className={`v0-channel-option ${selectedMethod === ch.code ? 'selected' : ''}`}
                    onClick={() => setSelectedMethod(ch.code)}
                  >
                    <input type="radio" name="payment_method" value={ch.code} checked={selectedMethod === ch.code} readOnly />
                    <div className="v0-channel-label">
                      <span>{ch.name}</span>
                      <span className="v0-channel-tag retail">{ch.iconLabel}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Payment Total & Submit CTA */}
            <div className="v0-receipt-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.9375rem', color: 'var(--color-ink)' }}>Subtotal Paket:</span>
                <strong style={{ fontSize: '1.25rem', color: 'var(--color-teal)', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                  {planPriceFormatted}
                </strong>
              </div>
              <div style={{ marginTop: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', fontStyle: 'italic' }}>
                  *Biaya administrasi bank/e-Wallet akan dihitung resmi oleh Tripay di halaman berikutnya.
                </span>
              </div>

              <div className="v0-trust-box">
                <div className="v0-trust-header">
                  <ShieldCheck size={18} />
                  <span className="v0-trust-title">Pembayaran Aman &amp; Transparan</span>
                </div>
                <p className="v0-trust-text">
                  Ini <strong>bukan langganan bulanan</strong>. Ini <strong>Paket Akses 30 Hari</strong> — sekali bayar, kuota langsung aktif. Saldo <strong>TIDAK AKAN</strong> terpotong otomatis di akhir periode. Kamu yang pegang kendali penuh.
                </p>
              </div>

              {errorMessage && (
                <div className="v0-profile-message error animate-fade-in" style={{ marginTop: '14px' }}>
                  <ShieldAlert size={16} />
                  <div>
                    <p style={{ margin: 0, fontWeight: 700 }}>{errorMessage}</p>
                    {errorMessage.includes('Payment gateway not configured') && (
                      <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>
                        Tips: Kredensial Tripay (TRIPAY_API_KEY, TRIPAY_PRIVATE_KEY, TRIPAY_MERCHANT_CODE) belum dikonfigurasi di Supabase Secrets.
                      </span>
                    )}
                  </div>
                </div>
              )}

              <button
                type="button"
                className="v0-profile-save-btn"
                style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}
                onClick={handleProceedToPayment}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Memproses Tagihan...
                  </>
                ) : (
                  <>
                    Lanjut ke Pembayaran Tripay <ChevronRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // =============================================================
  // MODE 2: EXISTING INVOICE DETAIL & MANUAL STATUS CHECK (With Reference Parameter)
  // =============================================================
  if (!invoice) {
    return (
      <div className="v0-page-container animate-fade-in">
        <div className="v0-profile-form-container">
          <div className="v0-empty-state" style={{ minHeight: '360px', textAlign: 'center' }}>
            <ShieldAlert size={48} style={{ color: 'var(--color-status-alert)', margin: '0 auto 12px' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-ink)', margin: '0 0 8px' }}>
              Transaksi Tidak Ditemukan
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-ink-soft)', margin: '0 0 20px' }}>
              Nomor referensi <code>{reference}</code> tidak valid atau tidak terdaftar.
            </p>
            <Link to="/transactions" className="v0-btn-action">
              Lihat Riwayat Transaksi
            </Link>
          </div>
        </div>
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
    <div className="v0-page-container animate-fade-in">
      <div className="v0-profile-form-container">
        <div style={{ marginBottom: '16px' }}>
          <Link to="/transactions" className="v0-back-link">
            <ArrowLeft size={16} /> Riwayat Transaksi
          </Link>
        </div>

        <div className="v0-profile-form-header" style={{ marginBottom: '24px', textAlign: 'left' }}>
          <h1 className="v0-profile-form-main-title">Detail Tagihan Pembayaran</h1>
        </div>

        <div className="v0-profile-card">
          {/* Status & Expiry Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px dashed var(--color-border)', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-ink)' }}>
              <span>Status:</span>
              {isPaid ? (
                <span className="v0-badge optimal"><CheckCircle2 size={13} /> LUNAS</span>
              ) : isExpired ? (
                <span className="v0-badge alert">KADALUARSA</span>
              ) : (
                <span className="v0-badge attention">BELUM DIBAYAR</span>
              )}
            </div>
            {!isPaid && !isExpired && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--color-ink-muted)' }}>
                <Clock size={14} /> Batas Waktu: <strong style={{ color: 'var(--color-status-attention)', fontFamily: 'monospace', fontSize: '0.9375rem' }}>{timeLeft || '24:00:00'}</strong>
              </div>
            )}
          </div>

          {/* Invoice Items Summary */}
          <div style={{ background: 'var(--color-surface-muted)', padding: '16px', border: '1px solid var(--color-border-soft)', borderRadius: 'var(--radius-lg)', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84375rem', color: 'var(--color-ink-soft)' }}>
              <span>No. Tagihan:</span>
              <strong style={{ fontFamily: 'monospace', color: 'var(--color-teal)' }}>{invoice.merchant_ref}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84375rem', color: 'var(--color-ink-soft)' }}>
              <span>Produk:</span>
              <strong style={{ color: 'var(--color-ink)' }}>{invoice.plan_name || (invoice.merchant_ref?.includes('GLOW') ? 'Skincluv GLOW (Akses 30 Hari)' : 'Skincluv PRO (Akses 30 Hari)')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84375rem', color: 'var(--color-ink-soft)' }}>
              <span>Total Tagihan:</span>
              <strong style={{ color: 'var(--color-teal)', fontSize: '1.125rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                Rp {(invoice.total_amount_idr || invoice.amount_idr)?.toLocaleString('id-ID')}
              </strong>
            </div>
          </div>

          {/* Method-Specific Instruction Box */}
          <div className="v0-receipt-box" style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--color-teal)', marginBottom: '16px', fontWeight: 700 }}>
              {method.includes('QRIS') ? <QrCode size={20} /> : method.includes('MART') || method.includes('INDOMARET') ? <Store size={20} /> : <CreditCard size={20} />}
              <h3 style={{ fontSize: '1.0625rem', margin: 0, color: 'var(--color-teal)', fontWeight: 700 }}>Metode Pembayaran: {method}</h3>
            </div>

            {/* QRIS Display */}
            {method.includes('QRIS') && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                {qrUrl ? (
                  <div className="v0-qris-box">
                    <img src={qrUrl} alt="QRIS Code" style={{ width: '200px', height: '200px', display: 'block' }} />
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '32px', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--color-border)', color: 'var(--color-ink-muted)' }}>
                    <QrCode size={64} />
                    <p style={{ margin: 0, fontSize: '0.84375rem' }}>Buka halaman Tripay untuk memindai QRIS</p>
                  </div>
                )}
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-ink-soft)', maxWidth: '360px', lineHeight: 1.4, margin: '8px 0 0' }}>
                  Scan QR Code di atas menggunakan GoPay, OVO, ShopeePay, Dana, LinkAja, atau Mobile Banking kamu.
                </p>
              </div>
            )}

            {/* Virtual Account / Code Display */}
            {!method.includes('QRIS') && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-ink-muted)', fontWeight: 600 }}>
                  {method.includes('MART') || method.includes('INDOMARET') ? 'Kode Pembayaran Minimarket:' : 'Nomor Virtual Account:'}
                </span>
                <div className="v0-pay-code-box">
                  <span className="v0-pay-code-num">{payCode}</span>
                  <button type="button" className="v0-btn-action" onClick={() => copyToClipboard(payCode)}>
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    <span>{copied ? 'Tersalin!' : 'Salin'}</span>
                  </button>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', maxWidth: '340px', marginTop: '6px', margin: 0 }}>
                  Salin nomor di atas dan masukkan pada menu transfer Bank/Virtual Account kamu.
                </p>
              </div>
            )}
          </div>

          {/* Interactive Action Footer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'center' }}>
            <button
              type="button"
              className="v0-profile-save-btn"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => fetchInvoiceStatus(true)}
              disabled={isCheckingStatus || isPaid}
            >
              <RefreshCw size={16} className={isCheckingStatus ? 'animate-spin' : ''} />
              <span>{isCheckingStatus ? 'Mengecek ke Server...' : 'Cek Status Pembayaran'}</span>
            </button>

            {invoice.checkout_url && (
              <a href={invoice.checkout_url} target="_blank" rel="noreferrer" className="v0-btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                <span>Buka Halaman Pembayaran Tripay</span> <ExternalLink size={16} />
              </a>
            )}

            <Link to="/transactions" style={{ fontSize: '0.8125rem', color: 'var(--color-ink-muted)', textDecoration: 'none', marginTop: '4px', fontWeight: 600 }}>
              Lihat Semua Riwayat Transaksi Saya
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
