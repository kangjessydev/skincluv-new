import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'
import { Copy, Check, RefreshCw, QrCode, CreditCard, Store, Clock, ExternalLink, ArrowLeft, ShieldAlert, CheckCircle2, ChevronRight, Crown, ShoppingBag, Sparkles, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Button, Badge } from '@/components/ui'

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
      <div className="cluv-page">
        <div className="cluv-focused-ledger">
          <div className="cluv-card cluv-empty cluv-text-center cluv-py-8">
            <RefreshCw size={32} className="animate-spin cluv-text-teal cluv-mx-auto cluv-mb-3" />
            <p className="cluv-body cluv-text-muted cluv-m-0">Memuat rincian transaksi...</p>
          </div>
        </div>
      </div>
    )
  }

  // =============================================================
  // MODE 1: ORDER REVIEW & METHOD SELECTION (No Reference Parameter)
  // =============================================================
  if (!reference) {
    return (
      <div className="cluv-page">
        <div className="cluv-focused-ledger">
          <div className="cluv-mb-4">
            <Link to="/pricing" className="cluv-back-link">
              <ArrowLeft size={16} />
              <span>Pilihan Paket</span>
            </Link>
          </div>

          <div className="cluv-mb-6">
            <h1 className="cluv-title-page">Checkout &amp; Review Pesanan</h1>
            <p className="cluv-caption cluv-text-muted">Periksa rincian pesanan dan pilih metode pembayaran favoritmu.</p>
          </div>

          <div className="cluv-flex-col cluv-gap-4">
            {/* Order Summary Card */}
            <div className="cluv-card">
              <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-mb-4">
                <ShoppingBag size={18} className="cluv-text-teal" />
                <h3 className="cluv-title-card cluv-m-0">Rincian Pesanan</h3>
              </div>

              <div className="cluv-flex-between cluv-items-center cluv-pb-4 cluv-border-b">
                <div className="cluv-flex-row cluv-items-center cluv-gap-3">
                  {isGlow ? (
                    <div className="cluv-card-icon-wrap is-sm is-teal">
                      <Sparkles size={20} />
                    </div>
                  ) : (
                    <div className="cluv-card-icon-wrap is-sm is-gold">
                      <Crown size={20} />
                    </div>
                  )}
                  <div>
                    <h4 className="cluv-font-bold cluv-text-dark cluv-m-0">{planTitle}</h4>
                    <p className="cluv-caption cluv-text-muted cluv-m-0">{planDesc}</p>
                  </div>
                </div>
                <div className="cluv-price-val cluv-text-teal cluv-font-bold cluv-m-0">{planPriceFormatted}</div>
              </div>

              <div className="cluv-mt-4 cluv-flex-col cluv-gap-1">
                <span className="cluv-micro cluv-text-muted cluv-uppercase cluv-font-bold">Pemesan:</span>
                <strong className="cluv-body cluv-font-bold cluv-text-dark">{profile?.full_name || 'Pelanggan Skincluv'}</strong>
                <span className="cluv-caption cluv-text-teal">{session?.user?.email}</span>
              </div>
            </div>

            {/* Payment Method Selector Card */}
            <div className="cluv-card">
              <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-mb-4">
                <CreditCard size={18} className="cluv-text-teal" />
                <h3 className="cluv-title-card cluv-m-0">Pilih Metode Pembayaran</h3>
              </div>

              <div className="cluv-channel-group">
                <div className="cluv-channel-category">
                  <QrCode size={14} />
                  <span>QRIS &amp; E-WALLET</span>
                </div>
                {PAYMENT_CHANNELS.filter(c => c.category === 'qris').map(ch => (
                  <label
                    key={ch.code}
                    className={`cluv-channel-option ${selectedMethod === ch.code ? 'is-selected' : ''}`}
                    onClick={() => setSelectedMethod(ch.code)}
                  >
                    <input type="radio" name="payment_method" value={ch.code} checked={selectedMethod === ch.code} readOnly />
                    <div className="cluv-channel-label">
                      <span>{ch.name}</span>
                      <Badge variant="teal" size="sm">{ch.iconLabel}</Badge>
                    </div>
                  </label>
                ))}

                <div className="cluv-channel-category">
                  <CreditCard size={14} />
                  <span>VIRTUAL ACCOUNT (BANK TRANSFER)</span>
                </div>
                {PAYMENT_CHANNELS.filter(c => c.category === 'va').map(ch => (
                  <label
                    key={ch.code}
                    className={`cluv-channel-option ${selectedMethod === ch.code ? 'is-selected' : ''}`}
                    onClick={() => setSelectedMethod(ch.code)}
                  >
                    <input type="radio" name="payment_method" value={ch.code} checked={selectedMethod === ch.code} readOnly />
                    <div className="cluv-channel-label">
                      <span>{ch.name}</span>
                      <Badge variant="slate" size="sm">{ch.iconLabel}</Badge>
                    </div>
                  </label>
                ))}

                <div className="cluv-channel-category">
                  <Store size={14} />
                  <span>GERAI RETAIL</span>
                </div>
                {PAYMENT_CHANNELS.filter(c => c.category === 'retail').map(ch => (
                  <label
                    key={ch.code}
                    className={`cluv-channel-option ${selectedMethod === ch.code ? 'is-selected' : ''}`}
                    onClick={() => setSelectedMethod(ch.code)}
                  >
                    <input type="radio" name="payment_method" value={ch.code} checked={selectedMethod === ch.code} readOnly />
                    <div className="cluv-channel-label">
                      <span>{ch.name}</span>
                      <Badge variant="gold" size="sm">{ch.iconLabel}</Badge>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Payment Total & Submit CTA */}
            <div className="cluv-card">
              <div className="cluv-receipt-box">
                <div className="cluv-receipt-row">
                  <span className="cluv-receipt-label">Subtotal Paket:</span>
                  <strong className="cluv-price-val cluv-text-teal cluv-m-0">{planPriceFormatted}</strong>
                </div>
                <div className="cluv-micro cluv-text-muted cluv-mt-1">
                  *Biaya administrasi bank/e-Wallet akan dihitung resmi oleh Tripay di halaman berikutnya.
                </div>
              </div>

              <div className="cluv-card-note cluv-mt-4">
                <ShieldCheck size={20} className="cluv-text-teal cluv-flex-shrink-0" />
                <div>
                  <strong className="cluv-font-bold cluv-text-teal">Pembayaran Aman &amp; Transparan:</strong>
                  <p className="cluv-caption cluv-line-relaxed cluv-mt-1 cluv-m-0">
                    Ini <strong>bukan langganan bulanan</strong>. Ini <strong>Paket Akses 30 Hari</strong> — sekali bayar, kuota langsung aktif. Saldo <strong>TIDAK AKAN</strong> terpotong otomatis di akhir periode. Kamu yang pegang kendali penuh.
                  </p>
                </div>
              </div>

              {errorMessage && (
                <div className="cluv-card is-danger cluv-mt-4">
                  <div className="cluv-flex-row cluv-items-center cluv-gap-3">
                    <ShieldAlert size={18} className="cluv-text-rose" />
                    <div>
                      <p className="cluv-body cluv-font-bold cluv-text-rose cluv-m-0">{errorMessage}</p>
                      {errorMessage.includes('Payment gateway not configured') && (
                        <span className="cluv-micro cluv-text-muted">
                          Tips: Kredensial Tripay (TRIPAY_API_KEY, TRIPAY_PRIVATE_KEY, TRIPAY_MERCHANT_CODE) belum dikonfigurasi di Supabase Secrets.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <Button
                variant="primary"
                size="md"
                block
                loading={isSubmitting}
                iconRight={!isSubmitting ? <ChevronRight size={16} /> : undefined}
                onClick={handleProceedToPayment}
                className="cluv-mt-5"
              >
                {isSubmitting ? 'Memproses Tagihan...' : 'Lanjut ke Pembayaran Tripay'}
              </Button>
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
      <div className="cluv-page">
        <div className="cluv-focused-ledger">
          <div className="cluv-card cluv-empty cluv-text-center cluv-py-8">
            <ShieldAlert size={48} className="cluv-text-rose cluv-mx-auto cluv-mb-3" />
            <h2 className="cluv-title-card cluv-mb-2">
              Transaksi Tidak Ditemukan
            </h2>
            <p className="cluv-body cluv-text-muted cluv-mb-5">
              Nomor referensi <code>{reference}</code> tidak valid atau tidak terdaftar.
            </p>
            <Button variant="secondary" size="md" to="/transactions">
              Lihat Riwayat Transaksi
            </Button>
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
    <div className="cluv-canvas-focused cluv-animate-fade">
      <div className="cluv-mb-4">
          <Link to="/transactions" className="cluv-back-link">
            <ArrowLeft size={16} />
            <span>Riwayat Transaksi</span>
          </Link>
        </div>

        <div className="cluv-mb-6">
          <h1 className="cluv-title-page">Detail Tagihan Pembayaran</h1>
        </div>

        <div className="cluv-card">
          {/* Status & Expiry Bar */}
          <div className="cluv-flex-between cluv-items-center cluv-pb-4 cluv-border-b cluv-mb-5">
            <div className="cluv-flex-row cluv-items-center cluv-gap-2">
              <span className="cluv-caption cluv-font-bold cluv-text-dark">Status:</span>
              {isPaid ? (
                <Badge variant="teal" size="sm"><CheckCircle2 size={13} /> LUNAS</Badge>
              ) : isExpired ? (
                <Badge variant="rose" size="sm">KADALUARSA</Badge>
              ) : (
                <Badge variant="gold" size="sm">BELUM DIBAYAR</Badge>
              )}
            </div>
            {!isPaid && !isExpired && (
              <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-caption cluv-text-muted">
                <Clock size={14} />
                <span>Batas Waktu:</span>
                <strong className="cluv-font-bold cluv-text-gold">{timeLeft || '24:00:00'}</strong>
              </div>
            )}
          </div>

          {/* Invoice Items Summary */}
          <div className="cluv-receipt-box cluv-mb-5">
            <div className="cluv-receipt-row">
              <span className="cluv-receipt-label">No. Tagihan:</span>
              <strong className="cluv-receipt-val cluv-text-teal">{invoice.merchant_ref}</strong>
            </div>
            <div className="cluv-receipt-row">
              <span className="cluv-receipt-label">Produk:</span>
              <strong className="cluv-receipt-val">{invoice.plan_name || (invoice.merchant_ref?.includes('GLOW') ? 'Skincluv GLOW (Akses 30 Hari)' : 'Skincluv PRO (Akses 30 Hari)')}</strong>
            </div>
            <div className="cluv-receipt-row">
              <span className="cluv-receipt-label">Total Tagihan:</span>
              <strong className="cluv-receipt-val cluv-text-teal cluv-font-bold">
                Rp {(invoice.total_amount_idr || invoice.amount_idr)?.toLocaleString('id-ID')}
              </strong>
            </div>
          </div>

          {/* Method-Specific Instruction Box */}
          <div className="cluv-card cluv-text-center cluv-mb-5">
            <div className="cluv-flex-row cluv-items-center cluv-justify-center cluv-gap-2 cluv-text-teal cluv-mb-4">
              {method.includes('QRIS') ? <QrCode size={20} /> : method.includes('MART') || method.includes('INDOMARET') ? <Store size={20} /> : <CreditCard size={20} />}
              <h3 className="cluv-title-card cluv-text-teal cluv-m-0">Metode Pembayaran: {method}</h3>
            </div>

            {/* QRIS Display */}
            {method.includes('QRIS') && (
              <div className="cluv-flex-col cluv-items-center cluv-gap-3">
                {qrUrl ? (
                  <div className="cluv-qr-box">
                    <img src={qrUrl} alt="QRIS Code" style={{ width: '200px', height: '200px', display: 'block' }} />
                  </div>
                ) : (
                  <div className="cluv-card cluv-empty cluv-text-center cluv-py-6 cluv-w-full">
                    <QrCode size={48} className="cluv-text-muted cluv-mx-auto cluv-mb-2" />
                    <p className="cluv-caption cluv-text-muted cluv-m-0">Buka halaman Tripay untuk memindai QRIS</p>
                  </div>
                )}
                <p className="cluv-caption cluv-text-muted cluv-max-w-md cluv-mx-auto cluv-m-0">
                  Scan QR Code di atas menggunakan GoPay, OVO, ShopeePay, Dana, LinkAja, atau Mobile Banking kamu.
                </p>
              </div>
            )}

            {/* Virtual Account / Code Display */}
            {!method.includes('QRIS') && (
              <div className="cluv-flex-col cluv-items-center cluv-gap-2">
                <span className="cluv-caption cluv-text-muted cluv-font-bold">
                  {method.includes('MART') || method.includes('INDOMARET') ? 'Kode Pembayaran Minimarket:' : 'Nomor Virtual Account:'}
                </span>
                <div className="cluv-code-box">
                  <span className="cluv-code-val">{payCode}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    iconLeft={copied ? <Check size={14} className="cluv-text-teal" /> : <Copy size={14} />}
                    onClick={() => copyToClipboard(payCode)}
                  >
                    {copied ? 'Tersalin!' : 'Salin'}
                  </Button>
                </div>
                <p className="cluv-micro cluv-text-muted cluv-max-w-sm cluv-mx-auto cluv-mt-1 cluv-m-0">
                  Salin nomor di atas dan masukkan pada menu transfer Bank/Virtual Account kamu.
                </p>
              </div>
            )}
          </div>

          {/* Interactive Action Footer */}
          <div className="cluv-flex-col cluv-gap-3 cluv-text-center">
            <Button
              variant="primary"
              size="md"
              block
              loading={isCheckingStatus}
              disabled={isPaid}
              iconLeft={!isCheckingStatus ? <RefreshCw size={16} /> : undefined}
              onClick={() => fetchInvoiceStatus(true)}
            >
              {isCheckingStatus ? 'Mengecek ke Server...' : 'Cek Status Pembayaran'}
            </Button>

            {invoice.checkout_url && (
              <Button
                variant="secondary"
                size="md"
                block
                href={invoice.checkout_url}
                target="_blank"
                rel="noreferrer"
                iconRight={<ExternalLink size={16} />}
              >
                Buka Halaman Pembayaran Tripay
              </Button>
            )}

            <Link to="/transactions" className="cluv-caption cluv-text-muted cluv-font-bold cluv-mt-1">
              Lihat Semua Riwayat Transaksi Saya
            </Link>
          </div>
        </div>
      </div>
  )
}
