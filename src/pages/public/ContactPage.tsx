import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Mail, Phone, Clock, MessageSquare, ShieldCheck,
  CheckCircle2, Send, ArrowRight, Sparkles
} from 'lucide-react'
import { useScrollReveal } from '@/hooks/useScrollReveal'

const TOPIC_OPTIONS = [
  { value: 'transaksi', label: 'Kendala Pembayaran / Tagihan Tripay' },
  { value: 'refund', label: 'Permohonan Refund Dana' },
  { value: 'kuota', label: 'Pertanyaan Kuota Paket / AI Credits' },
  { value: 'privasi', label: 'Permohonan Privasi Data (UU PDP)' },
  { value: 'lainnya', label: 'Masukan Fitur / Obrolan Lainnya' }
]

export default function ContactPage() {
  useScrollReveal()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'transaksi',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="cluv-page cluv-surface-public">
      <section className="cluv-section">
        <div className="cluv-container is-md">
          {/* HEADER */}
          <header className="cluv-section-header cluv-reveal">
            <div className="cluv-badge is-teal cluv-mb-3">
              <MessageSquare size={14} />
              <span>Sahabat Customer Support</span>
            </div>
            <h1 className="cluv-title-hero">Ada yang Perlu Dibantu? Kami Siap Mendengarkan.</h1>
            <p className="cluv-lead cluv-mt-3">
              Punya pertanyaan seputar paket akses, verifikasi tagihan, atau sekadar mau tanya-tanya? Jangan sungkan, kami ada di sini untukmu.
            </p>
          </header>

          <div className="cluv-grid cols-2 cluv-reveal-group">
            {/* KOLOM KIRI: KANAL BANTUAN & JAM PELAYANAN */}
            <div className="cluv-flex-col cluv-gap-4">
              {/* KARTU 1: KANAL BANTUAN RESMI */}
              <div className="cluv-card">
                <div className="cluv-mb-4">
                  <div className="cluv-badge is-teal cluv-mb-2">
                    <Sparkles size={13} />
                    <span>Respons Cepat</span>
                  </div>
                  <h3 className="cluv-title-card cluv-mb-1">Kanal Komunikasi Langsung</h3>
                  <p className="cluv-body cluv-text-muted">
                    Pilih kanal yang paling nyaman buatmu untuk terhubung dengan tim Skincluv.
                  </p>
                </div>

                <div className="cluv-flex-col cluv-gap-3">
                  {/* WhatsApp Box */}
                  <div className="cluv-card-strip">
                    <div className="cluv-card-strip-main">
                      <div className="cluv-card-icon-wrap is-sm">
                        <Phone size={18} />
                      </div>
                      <div className="cluv-card-strip-body">
                        <div className="cluv-card-strip-title">
                          WhatsApp Sahabat CS
                        </div>
                        <p className="cluv-card-strip-desc">
                          Respon tercepat untuk kendala tagihan Tripay
                        </p>
                      </div>
                    </div>
                    <a
                      href="https://wa.me/6281234567890?text=Halo%20Admin%20Skincluv,%20saya%20butuh%20bantuan"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cluv-btn is-primary is-sm is-stack-mobile"
                    >
                      <span>Chat WhatsApp</span>
                      <ArrowRight size={13} />
                    </a>
                  </div>

                  {/* Email Box */}
                  <div className="cluv-card-strip is-neutral">
                    <div className="cluv-card-strip-main">
                      <div className="cluv-card-icon-wrap is-sm is-gold">
                        <Mail size={18} />
                      </div>
                      <div className="cluv-card-strip-body">
                        <div className="cluv-card-strip-title">
                          Email Dukungan &amp; Masukan
                        </div>
                        <p className="cluv-card-strip-desc">
                          Privasi data UU PDP, refund &amp; ide fitur
                        </p>
                      </div>
                    </div>
                    <a
                      href="mailto:support@skincluv.com"
                      className="cluv-btn is-secondary is-sm is-stack-mobile"
                    >
                      <span>Kirim Email</span>
                      <ArrowRight size={13} />
                    </a>
                  </div>
                </div>
              </div>

              {/* KARTU 2: JAM OPERASIONAL & KEAMANAN TRIPAY */}
              <div className="cluv-card">
                <div className="cluv-flex-row cluv-gap-3 cluv-mb-4">
                  <div className="cluv-card-icon-wrap is-sm is-gold cluv-flex-shrink-0">
                    <Clock size={18} />
                  </div>
                  <div>
                    <h3 className="cluv-title-card is-sm">
                      Jam Operasional Pelayanan
                    </h3>
                    <p className="cluv-caption cluv-line-normal">
                      <strong>Senin – Jumat:</strong> 09.00 – 18.00 WIB<br />
                      <strong>Sabtu – Minggu / Libur:</strong> 10.00 – 16.00 WIB (Piket Khusus Kendala Tagihan)
                    </p>
                  </div>
                </div>

                <div className="cluv-alert is-info is-sm cluv-mt-2">
                  <ShieldCheck size={18} className="cluv-alert-icon" />
                  <div className="cluv-alert-content">
                    <div className="cluv-alert-title">Jaminan Transaksi Berizin Resmi</div>
                    <p className="cluv-alert-message">
                      Seluruh transaksi digitalmu diproses secara resmi melalui mitra payment gateway berizin Bank Indonesia: <strong>PT Trikarya Pratama Sukses (Tripay)</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* KOLOM KANAN: FORMULIR PESAN SAHABAT */}
            <div className="cluv-card">
              <h3 className="cluv-title-card cluv-mb-2">Tinggalkan Pesan untuk Kami</h3>
              <p className="cluv-body cluv-mb-5">
                Tulis pesanmu di bawah ini, tim kami akan merespons melalui email secepat mungkin (maksimal 1 &times; 24 jam kerja).
              </p>

              {submitted ? (
                <div className="cluv-animate-fade cluv-text-center cluv-py-6">
                  <CheckCircle2 size={48} className="cluv-text-teal cluv-mx-auto cluv-mb-3" />
                  <h3 className="cluv-title-card cluv-mb-2">Pesanmu Telah Diterima!</h3>
                  <p className="cluv-body cluv-mb-4">
                    Terima kasih telah menyapa Skincluv. Catatanmu sudah kami simpan dan kami akan segera membalas ke alamat email <strong>{formData.email}</strong>.
                  </p>
                  <button
                    type="button"
                    className="cluv-btn is-secondary is-sm cluv-mx-auto"
                    onClick={() => setSubmitted(false)}
                  >
                    Kirim Pesan Lain
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="cluv-flex-col cluv-gap-4">
                  <div className="cluv-field">
                    <label htmlFor="contact-name" className="cluv-label">Nama Kamu</label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      placeholder="Tulis nama panggilanmu"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="cluv-input"
                    />
                  </div>

                  <div className="cluv-field">
                    <label htmlFor="contact-email" className="cluv-label">Alamat Email Kamu</label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      placeholder="emailkamu@contoh.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="cluv-input"
                    />
                  </div>

                  <div className="cluv-field">
                    <label htmlFor="contact-category" className="cluv-label">Topik yang Ingin Dibahas</label>
                    <select
                      id="contact-category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="cluv-select"
                    >
                      {TOPIC_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="cluv-field">
                    <label htmlFor="contact-message" className="cluv-label">Pesan atau Kendala yang Dialami</label>
                    <textarea
                      id="contact-message"
                      rows={4}
                      required
                      placeholder="Ceritakan kendala atau pertanyaanmu dengan santai (sertakan nomor referensi tagihan Tripay jika ada)..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="cluv-textarea"
                    />
                  </div>

                  <div className="cluv-mt-2">
                    <button type="submit" className="cluv-btn is-primary is-md is-block">
                      <Send size={16} />
                      <span>Kirim Pesan Sahabat</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

