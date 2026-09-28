// src/pages/public/AboutPage.tsx
// Halaman Profil, Visi, dan Metodologi Skincluv

import { Link } from 'react-router-dom'
import { Sparkles, ShieldCheck, Heart, Eye, Target, ArrowRight, Award, BookOpen } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="about-page animate-fade-in">
      {/* HERO SECTION */}
      <section className="about-hero">
        <div className="about-container">
          <span className="about-badge"><Sparkles size={14} /> TENTANG SKINCLUV</span>
          <h1>Edukasi Skincare Mandiri Tanpa Klaim Berlebihan</h1>
          <p className="about-hero-desc">
            Skincluv lahir dari keresahan akan maraknya *overclaim* industri kecantikan dan kebingungan masyarakat dalam memahami bahan aktif produk perawatan kulit harian. Kami membangun teknologi cerdas untuk membantu Anda memahami kondisi kulit secara mandiri, rasional, dan preventif.
          </p>
        </div>
      </section>

      {/* CORE VALUES */}
      <section className="about-values-section">
        <div className="about-container">
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon"><Eye size={24} /></div>
              <h3>Transparansi Bahan Aktif</h3>
              <p>Membantu konsumen membaca daftar komposisi kosmetik (INCI list) secara objektif tanpa terpengaruh gimik pemasaran.</p>
            </div>

            <div className="value-card">
              <div className="value-icon"><ShieldCheck size={24} /></div>
              <h3>Privasi Biometrik Mutlak</h3>
              <p>Foto wajah adalah data pribadi berharga. Kami mematuhi UU PDP No. 27/2022 dan tidak pernah memperjualbelikan foto Anda.</p>
            </div>

            <div className="value-card">
              <div className="value-icon"><BookOpen size={24} /></div>
              <h3>Berbasis Literatur Terbuka</h3>
              <p>Evaluasi kompatibilitas bahan aktif bersumber dari referensi dermatologi terpercaya, bukan halusinasi kecerdasan buatan semata.</p>
            </div>
          </div>
        </div>
      </section>

      {/* NON-THERAPEUTIC DEMARCATION */}
      <section className="about-mission-section">
        <div className="about-container">
          <div className="mission-content-box">
            <div className="mission-text">
              <h2>Batas Etika &amp; Batasan Layanan Kami</h2>
              <p>
                Di Skincluv, kami memegang teguh prinsip kehati-hatian. Kami secara tegas <strong>bukan fasilitas telemedisin klinis dan bukan alat kesehatan</strong>. Kami tidak mendiagnosis penyakit dan tidak meresepkan obat.
              </p>
              <p>
                Peran kami adalah sebagai <em>pendamping edukatif cerdas</em> yang membantu Anda mengidentifikasi kecenderungan kondisi kulit, memantau konsistensi rutinitas, dan menghindari pencampuran (*layering*) bahan aktif yang berpotensi memicu iritasi.
              </p>
              <div className="mission-actions">
                <Link to="/medical-disclaimer" className="btn btn-outline btn-sm">
                  Baca Penyangkalan Medis Lengkap &rarr;
                </Link>
                <Link to="/pricing" className="btn btn-primary btn-sm">
                  Lihat Pilihan Paket Akses <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .about-page {
          background: var(--color-surface-bg, #f8fafc);
          padding-bottom: 80px;
        }

        .about-container {
          max-width: 1120px;
          margin: 0 auto;
          padding: 0 var(--space-lg, 24px);
        }

        /* HERO */
        .about-hero {
          padding: 72px 0 56px;
          text-align: center;
          background: linear-gradient(180deg, #ffffff 0%, var(--color-surface-bg, #f8fafc) 100%);
        }

        .about-badge {
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
          margin-bottom: 16px;
        }

        .about-hero h1 {
          font-family: var(--font-heading, sans-serif);
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--color-text-main, #0f172a);
          line-height: 1.2;
          max-width: 840px;
          margin: 0 auto 20px;
        }

        @media (max-width: 640px) {
          .about-hero h1 {
            font-size: 1.875rem;
          }
        }

        .about-hero-desc {
          font-size: 1.0625rem;
          color: var(--color-text-muted, #64748b);
          line-height: 1.7;
          max-width: 760px;
          margin: 0 auto;
        }

        /* VALUES */
        .about-values-section {
          padding: 40px 0 60px;
        }

        .values-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }

        @media (min-width: 768px) {
          .values-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .value-card {
          background: #ffffff;
          border: 1px solid var(--color-secondary-container, #e2e8f0);
          border-radius: var(--radius-xl, 16px);
          padding: 32px 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .value-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: #e0f2fe;
          color: var(--color-primary, #0f6784);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }

        .value-card h3 {
          font-family: var(--font-heading, sans-serif);
          font-size: 1.125rem;
          font-weight: 800;
          color: var(--color-text-main, #0f172a);
          margin: 0 0 10px 0;
        }

        .value-card p {
          font-size: 0.875rem;
          color: var(--color-text-muted, #64748b);
          line-height: 1.6;
          margin: 0;
        }

        /* MISSION */
        .mission-content-box {
          background: #ffffff;
          border: 1px solid var(--color-secondary-container, #e2e8f0);
          border-radius: var(--radius-2xl, 20px);
          padding: 48px 36px;
          box-shadow: 0 8px 24px rgba(15, 103, 132, 0.04);
        }

        .mission-text h2 {
          font-family: var(--font-heading, sans-serif);
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--color-text-main, #0f172a);
          margin: 0 0 16px 0;
        }

        .mission-text p {
          font-size: 0.9375rem;
          color: var(--color-text-muted, #64748b);
          line-height: 1.7;
          margin: 0 0 16px 0;
          max-width: 840px;
        }

        .mission-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 28px;
        }
      `}</style>
    </div>
  )
}
