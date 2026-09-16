import { Link } from 'react-router-dom'
import {
  FileText,
  Cpu,
  Target,
  CreditCard,
  Package,
  ShieldCheck,
  ArrowRight,
  Activity,
  BookOpen,
  FlaskConical,
  BrainCircuit,
  FileCode,
} from 'lucide-react'

export default function AdminDashboardPage() {
  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>
          Admin Overview
        </h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
          Pusat kendali konfigurasi AI, model, API key, kamus bahan kosmetik, formula semantic cache, dan fine-tuning training center.
        </p>
      </div>

      {/* Section 1: Konfigurasi Sistem */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#374151', margin: 0 }}>
          Konfigurasi Sistem AI & Bisnis
        </h2>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '2px 0 0 0' }}>
          Atur parameter operasional, model LLM, prompt engineering, gamifikasi, dan paket.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20,
          marginBottom: 40,
        }}
      >
        <Link
          to="/admin/prompts"
          style={{
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            padding: 24,
            textDecoration: 'none',
            color: 'inherit',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <FileText size={20} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 6px 0' }}>
              Prompt & Fitur AI
            </h3>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
              Atur system prompt aktif, riwayat versi prompt, dan catatan kalibrasi per fitur AI.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#2563eb', marginTop: 20 }}>
            Kelola Prompt <ArrowRight size={14} />
          </div>
        </Link>

        <Link
          to="/admin/models"
          style={{
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            padding: 24,
            textDecoration: 'none',
            color: 'inherit',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: '#f0fdf4',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Cpu size={20} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 6px 0' }}>
              Model & API Key
            </h3>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
              Konfigurasi model LLM (Gemini, Claude, GPT) dan simpan API key secara terenkripsi ke Vault.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#16a34a', marginTop: 20 }}>
            Kelola Model <ArrowRight size={14} />
          </div>
        </Link>

        <Link
          to="/admin/missions"
          style={{
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            padding: 24,
            textDecoration: 'none',
            color: 'inherit',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: '#fef3c7',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Target size={20} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 6px 0' }}>
              Misi Glow
            </h3>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
              Kelola misi harian, mingguan, target count, cooldown, dan reward koin/credit pengguna.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#d97706', marginTop: 20 }}>
            Kelola Misi <ArrowRight size={14} />
          </div>
        </Link>

        <Link
          to="/admin/pricing"
          style={{
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            padding: 24,
            textDecoration: 'none',
            color: 'inherit',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: '#e0e7ff',
                color: '#4f46e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <CreditCard size={20} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 6px 0' }}>
              Paket & Kuota
            </h3>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
              Atur harga paket membership (Free, Glow, Pro) dan matriks kuota bulanan tiap fitur AI.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#4f46e5', marginTop: 20 }}>
            Kelola Paket <ArrowRight size={14} />
          </div>
        </Link>

        <Link
          to="/admin/products"
          style={{
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            padding: 24,
            textDecoration: 'none',
            color: 'inherit',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: '#fae8ff',
                color: '#a21caf',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Package size={20} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 6px 0' }}>
              Produk Rekomendasi
            </h3>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
              Katalog produk skincare untuk rekomendasi engine AI di Scan Wajah dan Skinsistant.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#a21caf', marginTop: 20 }}>
            Kelola Produk <ArrowRight size={14} />
          </div>
        </Link>

        <div
          style={{
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: '#fdf4ff',
                color: '#c026d3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <ShieldCheck size={20} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 6px 0' }}>
              Keamanan RBAC & Vault
            </h3>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
              Sistem diamankan dengan PostgreSQL RLS level-database dan Supabase Vault enkripsi AEAD.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#059669', marginTop: 20 }}>
            <Activity size={14} /> Sistem Aktif & Terlindungi
          </div>
        </div>
      </div>

      {/* Section 2: AI Knowledge & Training Hub */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#374151', margin: 0 }}>
          AI Knowledge & Training Hub (Autonomous Data Flywheel)
        </h2>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '2px 0 0 0' }}>
          Basis data pengetahuan kosmetik, formula semantic cache, memori klinis pasien, dan fine-tuning training center.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20,
        }}
      >
        <Link
          to="/admin/knowledge/ingredients"
          style={{
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            padding: 24,
            textDecoration: 'none',
            color: 'inherit',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: '#e0e7ff',
                color: '#4f46e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <BookOpen size={20} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 6px 0' }}>
              Kamus Bahan AI (Knowledge Base)
            </h3>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
              Ensiklopedia bahan skincare terstandar yang secara otomatis dipelajari dan diperkaya oleh AI dari setiap scan pengguna.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#4f46e5', marginTop: 20 }}>
            Buka Kamus Bahan <ArrowRight size={14} />
          </div>
        </Link>

        <Link
          to="/admin/knowledge/formulas"
          style={{
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            padding: 24,
            textDecoration: 'none',
            color: 'inherit',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: '#fdf2f8',
                color: '#db2777',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <FlaskConical size={20} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 6px 0' }}>
              Formula & Semantic Cache
            </h3>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
              Big data formula produk yang menghemat ribuan token AI dan menghadirkan respons scan secepat kilat (&lt;0.3 detik).
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#db2777', marginTop: 20 }}>
            Lihat Formula Cache <ArrowRight size={14} />
          </div>
        </Link>

        <Link
          to="/admin/memory/clinical"
          style={{
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            padding: 24,
            textDecoration: 'none',
            color: 'inherit',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: '#ede9fe',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <BrainCircuit size={20} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 6px 0' }}>
              Memori Klinis Pasien (Episodic)
            </h3>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
              Fakta klinis riwayat alergi, sensitivitas, dan reaksi treatment per pengguna yang disuntikkan ke chatbot konsultasi.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#7c3aed', marginTop: 20 }}>
            Lihat Memori Klinis <ArrowRight size={14} />
          </div>
        </Link>

        <Link
          to="/admin/training/datasets"
          style={{
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            padding: 24,
            textDecoration: 'none',
            color: 'inherit',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: '#fef3c7',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <FileCode size={20} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 6px 0' }}>
              Pusat Dataset & Fine-Tuning
            </h3>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
              Repositori pasangan instruksi ground-truth siap ekspor format JSONL untuk fine-tuning model AI apa pun (Vertex/OpenAI).
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#d97706', marginTop: 20 }}>
            Kurasi & Ekspor JSONL <ArrowRight size={14} />
          </div>
        </Link>

        <Link
          to="/admin/memory/logs"
          style={{
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            padding: 24,
            textDecoration: 'none',
            color: 'inherit',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: '#f3f4f6',
                color: '#4b5563',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Activity size={20} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 6px 0' }}>
              Log Metrik & Observabilitas
            </h3>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
              Telemetri performa latensi, jumlah token yang digunakan, status eksekusi, serta feedback kepuasan user.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#4b5563', marginTop: 20 }}>
            Lihat Metrik & Log <ArrowRight size={14} />
          </div>
        </Link>
      </div>
    </div>
  )
}
