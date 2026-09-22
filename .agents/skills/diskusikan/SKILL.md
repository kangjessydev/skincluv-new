---
name: diskusikan
description: Menyusun paket RFC (Request for Comments) arsitektur produksi untuk direview oleh dewan AI luar (Claude, ChatGPT, DeepSeek, Kimi). Dipicu ketika user mengetik /diskusikan [topik] atau meminta peer-review arsitektur lintas AI.
---

# Workflow `/diskusikan` (Multi-AI RFC Generator)

Gunakan skill ini setiap kali user mengetik perintah `/diskusikan [topik]` atau meminta bahan diskusi untuk AI lain (Claude, ChatGPT, DeepSeek, Kimi).

## Prosedur Eksekusi:

1. **Investigasi Ground Truth**:
   - Cari file terkait fitur yang diminta user (`grep_search` / `view_file`).
   - Cek skema database dan migration terbaru yang relevan.
   - Cek Edge Function `supabase/functions/` dan komponen UI di `src/`.

2. **Buat Dokumen RFC**:
   - Tulis file baru di: `docs/ai_sync/RFC_[TIMESTAMP]_[SLUG_TOPIK].md`.
   - Gunakan template standar berikut:

```markdown
# [RFC] Konsultasi Arsitektur Produksi: [Nama Topik]
**Target Reviewer**: [Claude (Architect) / ChatGPT (Security Red Team) / DeepSeek (Performance Math) / Kimi (Dermatology Research)]
**Tanggal**: [ISO Date]
**Status Codebase**: Linked Supabase Live DB + React Vite SPA + Deno Edge Functions

---

## 1. Konteks & State Kode Saat Ini
- **Komponen Utama**: [Path file + baris penting]
- **Tabel & RLS DB**: [DDL / Policy RLS]
- **Logika Edge Function**: [Kutipan implementasi penting]

## 2. Sasaran & Masalah yang Ingin Dipecahkan
[Jelaskan apa yang ingin dicapai agar siap level enterprise / production-ready]

## 3. Pertanyaan Spesifik untuk Reviewer (Tolong Kritik Keras)
1. **Security & Data Integrity**: [Pertanyaan tentang RLS, bypass token, atau injection]
2. **Edge Cases & Concurrency**: [Pertanyaan tentang race condition, timeout, atau saldo koin]
3. **Clean Code & Architecture**: [Pertanyaan tentang maintainability dan decoupling]

## 4. Invarian yang Tidak Boleh Dirusak
- Baca `AGENTS.md` di root repo untuk melihat aturan kritis (misal `universal_ai` quota anchor, `face_validation` zero-credit gatekeeper, dsb).
```

3. **Output ke User**:
   - Berikan teks ringkas dalam format markdown code block siap-copy (ready to copy-paste).
   - Jelaskan kepada user AI mana yang paling direkomendasikan untuk topik tersebut (misal: "Untuk topik ini, paling cocok dikirim ke Claude untuk arsitektur, dan ChatGPT o1 untuk red team security").
