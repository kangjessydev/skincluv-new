import { Link } from 'react-router-dom'
import { FileText, Cpu, ShieldCheck, ArrowRight, Activity } from 'lucide-react'

export default function AdminDashboardPage() {
  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>
          Admin Overview
        </h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
          Pusat kendali konfigurasi AI, model, API key, dan sistem Skincluv.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
          marginBottom: 32,
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
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 6px 0' }}>
              Prompt & AI Features
            </h2>
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
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 6px 0' }}>
              Model & API Key
            </h2>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
              Konfigurasi model LLM (Gemini, Claude, GPT) dan simpan API key secara terenkripsi ke Vault.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#16a34a', marginTop: 20 }}>
            Kelola Model <ArrowRight size={14} />
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
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 6px 0' }}>
              Keamanan RBAC & Vault
            </h2>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
              Sistem diamankan dengan PostgreSQL RLS level-database dan Supabase Vault enkripsi AEAD.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#059669', marginTop: 20 }}>
            <Activity size={14} /> Sistem Aktif & Terlindungi
          </div>
        </div>
      </div>
    </div>
  )
}
