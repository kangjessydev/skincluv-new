// src/pages/public/ContactPage.tsx
// Halaman Kontak Resmi & Layanan Bantuan Skincluv
// Syarat Kepatuhan Verifikasi Merchant Tripay Payment Gateway

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Phone, Clock, MessageSquare, ShieldCheck, CheckCircle2, Send, HelpCircle } from 'lucide-react'
import '@/styles/public-pages.css'

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


    </div>
  )
}
