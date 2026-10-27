# Arsitektur & Peta Jalan Tim Peran (Developer Reference)

Dokumen ini ditujukan untuk **pengembang sistem tim peran** (arsitek), menjelaskan struktur, alasan keberadaan, dan pembagian tugas seluruh peran di Antigravity.

---

## 1. Mental Model & Alur Kerja Antar-Peran

Sistem ini dirancang dengan prinsip **Decoupled Autonomous Agents via Artifact Handoffs**:
Peran tidak saling berbicara langsung dalam satu sesi, melainkan berkomunikasi melalui file kontrak (`docs/contract/`) dan rekomendasi tugas (`docs/handoff/`).

```
                    ┌─────────────────────────┐
                    │      USER / KREATOR     │
                    └────────────┬────────────┘
                                 │ Keputusan Utama
                                 ▼
                     [ 🚪 Pintu Masuk / Intake ]
                           /role-asisten
                          /       \
              (Proyek Baru)       (Proyek Lama)
                   ▼                     ▼
              /role-init           /role-onboard
                   \                     /
                    ▼                   ▼
              [ 📐 Perencanaan & Riset ]
              /role-research & /role-blueprint
                                 │
                     ┌───────────┴───────────┐
                     ▼                       ▼
            [ 🔨 Pembangun ]        [ 🎨 UI & Interaksi ]
            /role-backend           /role-frontend
            /role-database          /role-motion
                     │                       │
                     └───────────┬───────────┘
                                 ▼
                         [ 🔍 Penguji & Audit ]
                         /role-inspektur (Sinkronisasi UI-API-DB)
                         /role-security (Keamanan & Vulnerability)
                         /role-bug-hunter (Reproduksi Bug)
                                 │
                                 ▼
                         [ 🚀 Rilis & Optimasi ]
                         /role-devops & /role-simplifier
                                 │
                                 ▼
                         [ 🔄 Evaluasi Berkala ]
                         /role-retro
```

---

## 2. Rincian Peran, Alasan Keberadaan & Tugasnya

### Kelompok 1: Pintu Masuk (Intake)
| Peran | Status | Alasan Keberadaan | Tugas Utama |
|---|---|---|---|
| `/role-asisten` | ✅ Aktif | Mencegah AI langsung melompat mengetik kode tanpa memahami maksud user; menyortir kebutuhan; mengarahkan ke peran yang tepat. | Interview kebutuhan user, tentukan profil risiko, buat brief tugas, pandu pembuatan peran baru jika belum ada. |
| `/role-onboard` | ✅ Aktif | Mencegah peran melakukan pemindaian (scan) ulang seluruh proyek di setiap sesi; menjaga agar AI tidak merusak konvensi lama. | Baca kode lama, ekstraksi stack + alasannya, buat `project-map.md`, bangun `glossary.md`, catat baseline tes. |
| `/role-init` | 📝 Rencana | Standardisasi pembentukan proyek baru agar tidak mengarang struktur sendiri. | Buat struktur folder awal, susun `project-brief.md`, buat SOP bernomor, siapkan kontrak awal. |

### Kelompok 2: Perencana (Planners)
| Peran | Status | Alasan Keberadaan | Tugas Utama |
|---|---|---|---|
| `/role-research` | 📝 Rencana | Menghindari AI merekomendasikan library/stack hanya karena populer atau data training lama. | Riset berbasis data real-time terkini (Context7/web), cek rilis & maintenance repo, catat keputusan di `decisions.md`. |
| `/role-blueprint` | 📝 Rencana | Menjadi satu-satunya sumber kebenaran (Single Source of Truth) antara Frontend dan Backend agar tidak terjadi asumsi data yang berbeda. | Menghasilkan skema kontrak API dan DB di `docs/contract/` sebelum baris kode pertama ditulis. |

### Kelompok 3: Pembangun (Builders - Boleh Ubah Kode)
| Peran | Status | Alasan Keberadaan | Tugas Utama |
|---|---|---|---|
| `/role-frontend` | 📝 Rencana | Membangun UI yang sesuai identitas brand, responsif, dan bebas dari tampilan generic AI-slop. | Implementasi komponen UI, layout, styling, integrasi API, dan micro-interactions dasar. |
| `/role-backend` | 📝 Rencana | Memastikan logika bisnis, validasi, dan API endpoint berjalan patuh pada kontrak yang disepakati. | Implementasi endpoint, controller, service layer, autentikasi, dan validasi data masukan. |
| `/role-database` | 📝 Rencana | Mencegah anomali relasi data, query lambat, atau perubahan skema yang merusak data yang ada. | Desain skema DB, migrasi, indexing, optimasi query, dan seeder data realistis (bukan sekadar placeholder). |

### Kelompok 4: Penguji & Auditor (Auditors - Hanya Baca & Lapor)
| Peran | Status | Alasan Keberadaan | Tugas Utama |
|---|---|---|---|
| `/role-motion` | 📝 Rencana | Mencegah UI terasa kaku seperti kertas atau sebaliknya beranimasi berlebihan/lambat. | Konsultan & auditor timing bezier (150-300ms), kepatuhan `prefers-reduced-motion`, dan pencegahan CLS. |
| `/role-inspektur` | 📝 Rencana | **Peran Paling Kritis:** Mendeteksi komponen UI yang datanya masih dummy/faker/hardcoded dan belum terhubung ke backend/DB. | Memetakan rantai data: UI -> Endpoint API -> Query DB. Melaporkan status `nyata`, `dummy`, atau `putus`. |
| `/role-security` | 📝 Rencana | Memastikan kode tidak membawa celah keamanan OWASP, secret bocor, atau dependensi rentan. | Audit dependensi (`npm audit`/`osv-scanner`), deteksi secret (`gitleaks`), verifikasi sanitasi input & RBAC. |
| `/role-bug-hunter` | 📝 Rencana | Memvalidasi apakah error/bug benar-benar ada dan bisa direproduksi dengan bukti terukur. | Menyusun skenario reproduksi error step-by-step; handoff bukti baris ke backend/frontend. |

### Kelompok 5: Operasional & Optimasi (Ops & Maintenance)
| Peran | Status | Alasan Keberadaan | Tugas Utama |
|---|---|---|---|
| `/role-devops` | 📝 Rencana | Menjaga kode tetap teruji, bundle tidak bengkak, dan pipeline build siap produksi. | Konfigurasi CI/CD, lint script, analisis ukuran bundle build, docker/containerization. |
| `/role-simplifier` | 📝 Rencana | AI memiliki kecenderungan menulis kode berlebihan (bloatware); peran ini bertugas merampingkan. | Refactoring pasca-fitur selesai: hapus duplikasi kode (`jscpd`), bersihkan kode mati (`knip`), pertahankan tes tetap hijau. |
| `/role-retro` | 📝 Rencana | Memberikan mekanisme belajar dan perbaikan diri bagi tim peran secara aman. | Meninjau `Log Penyimpangan` dari laporan berkala, menyaring pola sukses berulang, mengusulkan update `SKILL.md`. |
| `/role-help` | 📝 Rencana | Memberikan panduan cepat bagi user yang lupa shortcut atau pembagian peran. | Menampilkan contekan `roster.md`. |

---

## 3. Otomasi Generator Role

Untuk mempermudah pembuatan peran baru tanpa mengetik manual, `role-asisten` telah dibekali kapabilitas untuk meng-generate file `SKILL.md` baru di `.agents/skills/<nama-peran>/` secara interaktif dan otomatis memperbarui `roster.md`.
