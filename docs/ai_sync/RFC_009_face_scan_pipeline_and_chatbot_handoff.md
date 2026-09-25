# [RFC 009] Konsultasi Arsitektur Produksi: Face Scan Clinical Pipeline Refinement, Design System Harmonization & Contextual Chatbot Hand-off
**Target Reviewer**: Claude (Chief Architect), ChatGPT (Security & State Consistency), DeepSeek (Frontend Performance & Asset Budget), Kimi (Clinical Capture Protocol & Dermatological UX)  
**Tanggal**: 2026-09-25  
**Status Codebase**: Linked Supabase Live DB + React Vite SPA + Deno Edge Functions  
**Path Terkait**: 
- `src/pages/app/FaceScanPage.tsx`
- `src/pages/app/ChatbotPage.tsx`
- `src/store/authStore.ts`

---

## 1. Konteks & State Kode Saat Ini (Fakta Lapangan)

Fitur **Face Scan AI** saat ini memiliki pipeline 4 gerbang verifikasi yang sudah berjalan baik:
1. *Gerbang 1 (Client Canvas)*: Uji pencahayaan & Laplacian blur (<25ms).
2. *Gerbang 2 (Client Wasm)*: MediaPipe 468 Face Mesh untuk deteksi manusia & halangan (<40ms).
3. *Gerbang 3 (AI Gatekeeper)*: `face_validation` (0-kredit gratis, kilat).
4. *Gerbang 4 (Dermatology Specialist)*: `face_analysis` (5 kredit, penalaran klinis).

Namun, ada **tiga celah arsitektur dan UX** yang perlu kita selaraskan dengan standar produksi:

### A. Fragmentasi CSS & Hardcoded Hex (24 Kali Terulang)
Warna `#0f6784` ditulis mentah sebanyak 24 kali di dalam blok `<style>` di `FaceScanPage.tsx`. Ini bertentangan dengan design system token `--skincluv-teal` dan `--skincluv-teal-hover` yang sudah kita standarisasi di `src/index.css`.

### B. Estafet Konteks ke Chatbot Masih "Buta" (Generic Hand-off)
Pada baris 1016, tombol *"Konsultasikan Rutinitas ke SkinSistant AI"* hanya mengoper pesan statis generik:
```html
to="/chatbot?initialPrompt=Halo%20SkinSistant%2C%20saya%20baru%20saja%20selesai%20scan%20wajah.%20Bisa%20bantu%20jelaskan%20rekomendasi%20skincare%20rutin%20harian%20untuk%20kulitku%3F"
```
Chatbot tidak menerima ringkasan otomatis tentang apa yang baru saja didiagnosis (misalnya: *Tipe kulit kombinasi, keluhan pori besar & jerawat inflamasi di dagu, hero actives Niacinamide + Salicylic Acid*). Pengguna terpaksa mengetik ulang kondisi wajahnya secara manual.

### C. Protokol Pengambilan Gambar (Kimi RFC 008 Capture Guidelines)
Di RFC 008, Kimi mencatat bahwa variasi pencahayaan dan sisa skincare adalah sumber *noise* terbesar pada skor AI (variasi bisa mencapai $\pm 5$ poin). Halaman upload saat ini belum menyajikan panduan visual ringkas (*3 Golden Rules of Face Capture*) sebelum user mengambil foto.

### D. Sinkronisasi State Global (`activeSkinProfile`)
Saat scan wajah selesai dan tersimpan ke Supabase `skin_profiles`, store global `authStore.setActiveSkinProfile(...)` harus dipastikan ter-update secara reaktif agar Dashboard dan Chatbot langsung sinkron tanpa perlu refresh browser.

---

## 2. Sasaran & Masalah yang Ingin Dipecahkan

1. **Pembersihan Token Styling**:
   - Mengganti seluruh 24 hex `#0f6784` menjadi `var(--skincluv-teal)` dan `var(--skincluv-teal-hover)`.
2. **Context-Rich Bridge ke Skinsistant Chatbot**:
   - Membangun payload prompt dinamis yang merangkum parameter klinis hasil scan:
     - Tipe kulit & skor kesehatan
     - 2–3 keluhan utama
     - Rekomendasi hero actives utama
   - Sehingga begitu user mengklik tombol konsultasi, Chatbot langsung membuka sesi dengan pemahaman penuh terhadap kondisi wajah yang baru di-scan.
3. **Capture Guidance Checklist (Klinis)**:
   - Menambahkan panduan 3 langkah di layar upload:
     1. ☀️ Cahaya alami merata (dekat jendela, hindari backlight)
     2. 🧼 Wajah bersih tanpa makeup tebal / sisa sunscreen
     3. 📱 Jarak kamera stabil (~30–40 cm sejajar mata)
4. **Reaktivitas Profil Kulit**:
   - Memastikan `setActiveSkinProfile(enrichedProfile)` dipanggil tepat setelah insert database berhasil.

---

## 3. Pertanyaan Spesifik untuk Dewan AI

### Untuk Claude (Chief Architect & Clean Code)
1. **Format Hand-off State ke Chatbot**:
   - Apakah lebih baik mengirim ringkasan diagnosis lewat query parameter URL (`?initialPrompt=...`), atau menyimpannya ke *session storage / temporary context* agar URL tetap bersih dan tidak terpotong batasan panjang URL browser?
2. **Modularisasi `FaceScanPage.tsx`**:
   - File ini saat ini memiliki 2.342 baris. Bagian mana yang paling aman dan krusial untuk diekstrak (misal: modal konfirmasi koin, HUD scanner, atau card area breakdown) agar maintainability meningkat tanpa memicu regresi runtime?

### Untuk ChatGPT (Security Red Team & State Consistency)
1. **Prompt Sanitasi pada Hand-off Chatbot**:
   - Jika kita memasukkan teks hasil diagnosis AI ke dalam `initialPrompt` URL, apakah ada risiko *reflection injection* atau manipulasi parameter oleh user berbahaya sebelum dikirim ke model chatbot Qwen/Gemini?
2. **Data Consistency**:
   - Bagaimana memastikan bahwa jika pengguna menolak memberikan *Memory Consent* (UU PDP), data scan wajah di `FaceScanPage` tetap aman tersimpan di `face_scans` lokal miliknya tanpa otomatis ditarik sebagai memori permanen di chatbot?

### Untuk DeepSeek (Frontend Performance & Asset Budget)
1. **MediaPipe & Canvas Overhead**:
   - Pipeline 4-gerbang di `FaceScanPage` memuat MediaPipe WebAssembly (~3 MB). Bagaimana strategi caching dan memory cleanup terbaik agar saat user bolak-balik antara Dashboard dan Face Scan, memori browser tidak mengalami *memory leak*?

### Untuk Kimi (Clinical Capture Protocol & Dermatological UX)
1. **Protokol Tangkapan Klinis**:
   - Bagaimana rumusan copywriting paling efektif dan ramah untuk panduan "3 Golden Rules of Face Capture" di layar upload agar user mematuhinya tanpa merasa terbebani?
2. **Relevansi Rekomendasi Kandungan**:
   - Bagaimana format penyajian Hero Actives di hasil akhir scan wajah agar tidak terdengar seperti klaim obat keras (over-claiming) dan tetap selaras dengan regulasi kosmetika BPOM?

---

## 4. Invarian yang Tidak Boleh Dirusak
- **Invarian 1**: `face_validation` berdiri sebagai fitur 0-kredit mandiri di Gerbang 3 (jangan dihapus atau digabung ke fitur berbayar).
- **Invarian 2**: Model penalaran `face_analysis` tetap 5 kredit dengan reasoning penuh (`gemini-3.5-flash`).
- **Invarian 3**: Desain tombol dan warna harmonis dengan `--skincluv-teal`.
