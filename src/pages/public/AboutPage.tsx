// src/pages/public/AboutPage.tsx
// Halaman Profil, Visi, dan Metodologi Skincluv

import { Link } from 'react-router-dom'
import { Sparkles, ShieldCheck, Heart, Eye, Target, ArrowRight, Award, BookOpen } from 'lucide-react'
import '@/styles/public-pages.css'

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


    </div>
  )
}
