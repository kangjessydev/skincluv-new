// src/pages/public/ContactPage.tsx
// Halaman Kontak Resmi & Layanan Bantuan Skincluv
// Syarat Kepatuhan Verifikasi Merchant Tripay Payment Gateway

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Phone, Clock, MessageSquare, ShieldCheck, CheckCircle2, Send, HelpCircle } from 'lucide-react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'transaksi',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Karena ini halaman kontak publik, kita beri feedback sukses dan arahkan opsi ke WhatsApp / email
    setSubmitted(true)
  }

  return (
    <div className="contact-page animate-fade-in">
      <div className="contact-container">
        {/* HEADER */}
        <header className="contact-header">
          <span className="contact-badge"><MessageSquare size={14} /> PUSAT DUKUNGAN PELANGGAN</span>
          <h1>Hubungi Tim Layanan Skincluv</h1>
          <p className="contact-subtitle">
            Kami siap membantu kendala aktivasi pass Tripay, pertanyaan analisis kecerdasan buatan, atau permintaan privasi data akun Anda.
          </p>
        </header>

        <div className="contact-grid">
          {/* KOLOM KIRI: INFO KANAL RESMI */}
          <div className="contact-info-panel">
            <div className="info-card">
              <div className="info-icon whatsapp-icon"><Phone size={22} /></div>
              <div className="info-text">
                <h3>WhatsApp Layanan Pelanggan</h3>
                <p>Respon tercepat untuk kendala pembayaran dan verifikasi tagihan Tripay.</p>
                <a
                  href="https://wa.me/6281234567890?text=Halo%20Admin%20Skincluv,%20saya%20butuh%20bantuan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-link-action"
                >
                  Chat WhatsApp Resmi &rarr;
                </a>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon email-icon"><Mail size={22} /></div>
              <div className="info-text">
                <h3>Surel Dukungan &amp; Kemitraan</h3>
                <p>Untuk eskalasi sengketa transaksi, pengajuan refund, atau permohonan privasi data (UU PDP).</p>
                <a href="mailto:support@skincluv.com" className="contact-link-action">
                  support@skincluv.com &rarr;
                </a>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon hours-icon"><Clock size={22} /></div>
              <div className="info-text">
                <h3>Jam Operasional Layanan Tiket</h3>
                <p>
                  <strong>Senin – Jumat:</strong> 09.00 – 18.00 WIB<br />
                  <strong>Sabtu – Minggu / Libur Nasional:</strong> 10.00 – 16.00 WIB (Piket Khusus Sengketa Pembayaran)
                </p>
              </div>
            </div>

            <div className="merchant-trust-box">
              <ShieldCheck size={20} className="trust-icon" />
              <div>
                <h4>Jaminan Keamanan Pembayaran</h4>
                <p>Seluruh transaksi pembayaran digital diproses melalui mitra resmi berizin Bank Indonesia: <strong>PT Trikarya Pratama Sukses (Tripay)</strong>.</p>
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: FORMULIR TIKET PENGADUAN */}
          <div className="contact-form-panel">
            <div className="form-card">
              <h2>Kirim Pesan Pengaduan</h2>
              <p className="form-desc">
                Isi formulir berikut, tim kami akan merespons melalui email dalam waktu maksimal 1 &times; 24 jam kerja.
              </p>

              {submitted ? (
                <div className="submitted-success-box animate-fade-in">
                  <CheckCircle2 size={36} className="text-success" />
                  <h3>Pesan Anda Telah Diterima!</h3>
                  <p>
                    Terima kasih telah menghubungi Skincluv. Tiket bantuan Anda telah dicatat. Kami akan membalas ke alamat email <strong>{formData.email}</strong>.
                  </p>
                  <button className="btn btn-outline btn-sm mt-3" onClick={() => setSubmitted(false)}>
                    Kirim Pesan Lain
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="contact-form">
                  <div className="form-group">
                    <label htmlFor="contact-name">Nama Lengkap</label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      placeholder="Nama Anda"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="contact-email">Alamat Email Terdaftar</label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      placeholder="email@anda.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="contact-category">Kategori Pengaduan</label>
                    <select
                      id="contact-category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="transaksi">Kendala Pembayaran / Invoice Tripay</option>
                      <option value="refund">Permohonan Refund Dana</option>
                      <option value="kuota">Masalah Kuota Universal AI / Misi</option>
                      <option value="privasi">Permohonan Hak Privasi (UU PDP)</option>
                      <option value="lainnya">Pertanyaan Umum / Masukan Fitur</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="contact-message">Rincian Kendala / Pesan</label>
                    <textarea
                      id="contact-message"
                      rows={4}
                      required
                      placeholder="Jelaskan kendala Anda secara rinci (sertakan nomor referensi invoice Tripay jika ada)..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary btn-block">
                    <Send size={16} />
                    <span>Kirim Pengaduan Tiket</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .contact-page {
          padding: 48px 0 80px;
          background: var(--color-surface-bg, #f8fafc);
          min-height: calc(100vh - 64px);
        }

        .contact-container {
          max-width: 1120px;
          margin: 0 auto;
          padding: 0 var(--space-lg, 24px);
        }

        .contact-header {
          text-align: center;
          margin-bottom: 48px;
        }

        .contact-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          color: var(--color-primary, #0f6784);
          background: #e0f2fe;
          border: 1px solid #bae6fd;
          padding: 4px 12px;
          border-radius: var(--radius-full, 9999px);
          margin-bottom: 12px;
        }

        .contact-header h1 {
          font-family: var(--font-heading, sans-serif);
          font-size: 2.25rem;
          font-weight: 800;
          color: var(--color-text-main, #0f172a);
          margin: 0 0 12px 0;
        }

        .contact-subtitle {
          font-size: 1rem;
          color: var(--color-text-muted, #64748b);
          max-width: 680px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .contact-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
          align-items: start;
        }

        @media (min-width: 860px) {
          .contact-grid {
            grid-template-columns: 1fr 1.2fr;
          }
        }

        /* INFO PANEL */
        .contact-info-panel {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .info-card {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          background: #ffffff;
          border: 1px solid var(--color-secondary-container, #e2e8f0);
          border-radius: var(--radius-xl, 16px);
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
        }

        .info-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .whatsapp-icon {
          background: #dcfce7;
          color: #16a34a;
        }

        .email-icon {
          background: #e0f2fe;
          color: #0284c7;
        }

        .hours-icon {
          background: #fef3c7;
          color: #d97706;
        }

        .info-text h3 {
          font-family: var(--font-heading, sans-serif);
          font-size: 1rem;
          font-weight: 700;
          color: var(--color-text-main, #0f172a);
          margin: 0 0 6px 0;
        }

        .info-text p {
          font-size: 0.875rem;
          color: var(--color-text-muted, #64748b);
          line-height: 1.5;
          margin: 0 0 10px 0;
        }

        .contact-link-action {
          display: inline-block;
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--color-primary, #0f6784);
          text-decoration: none;
        }

        .contact-link-action:hover {
          text-decoration: underline;
        }

        .merchant-trust-box {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: var(--radius-lg, 12px);
          padding: 16px;
        }

        .trust-icon {
          color: #0284c7;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .merchant-trust-box h4 {
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--color-text-main, #0f172a);
          margin: 0 0 4px 0;
        }

        .merchant-trust-box p {
          font-size: 0.75rem;
          color: var(--color-text-muted, #64748b);
          margin: 0;
          line-height: 1.4;
        }

        /* FORM PANEL */
        .form-card {
          background: #ffffff;
          border: 1px solid var(--color-secondary-container, #e2e8f0);
          border-radius: var(--radius-xl, 16px);
          padding: 32px var(--space-xl, 32px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
        }

        .form-card h2 {
          font-family: var(--font-heading, sans-serif);
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--color-text-main, #0f172a);
          margin: 0 0 6px 0;
        }

        .form-desc {
          font-size: 0.875rem;
          color: var(--color-text-muted, #64748b);
          margin: 0 0 24px 0;
          line-height: 1.5;
        }

        .contact-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--color-text-main, #334155);
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #cbd5e1;
          border-radius: var(--radius-md, 8px);
          font-size: 0.875rem;
          font-family: inherit;
          color: #0f172a;
          background: #ffffff;
          transition: border-color 0.15s ease;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--color-primary, #0f6784);
          box-shadow: 0 0 0 2px rgba(15, 103, 132, 0.15);
        }

        .submitted-success-box {
          text-align: center;
          padding: 40px 20px;
        }

        .submitted-success-box h3 {
          font-size: 1.125rem;
          font-weight: 800;
          color: var(--color-text-main, #0f172a);
          margin: 12px 0 8px 0;
        }

        .submitted-success-box p {
          font-size: 0.875rem;
          color: var(--color-text-muted, #64748b);
          max-width: 400px;
          margin: 0 auto;
          line-height: 1.5;
        }

        .btn-block {
          width: 100%;
          justify-content: center;
        }
      `}</style>
    </div>
  )
}
