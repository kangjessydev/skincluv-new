# [RFC 013 Consensus Notes] Multi-Model Agreement: Deterministic Temporal Scan History & Internal Skincluv Handbook

**Reviewer:** ChatGPT, DeepSeek, Kimi, Antigravity  
**Tanggal:** 2026-09-27  
**Status:** CONSENSUS REACHED -> APPROVED FOR EXECUTION  

---

## 1. Keputusan Arsitektur Terpadu (The Grand Consensus)

### A. Temporal Retrieval: Opsi C (Hybrid 30-Token) dengan Server Authority
1. **Index 5 Scan Terakhir Selalu Diinjeksi (~30 Token)**:
   - `get_chatbot_user_context()` mengembalikan daftar ringkas 5 scan terakhir (tanggal lokal, overall_score, skin_status, capture_hour, lighting_score, is_repeat).
   - Memberikan konteks instan untuk pertanyaan relatif ("kemarin", "scan sebelumnya", "bandingkan 2 scan terakhir") tanpa query DB tambahan.
2. **On-Demand Deterministic RPC Lookup**:
   - Jika pengguna menyebut tanggal di luar 5 scan terakhir, regex pre-check (dibatasi `MAX_INPUT_LENGTH = 500`) memanggil RPC `get_chatbot_scans_by_period`.
   - Menggunakan parameter `p_tz_offset_minutes` (-420 untuk WIB) dengan half-open interval `[start, end)`.
   - Jika tanggal kosong, RPC mengembalikan `nearest_before` dan `nearest_after` secara deterministik.
3. **Penegakan Invarian 10 (Strict Server Authority)**:
   - LLM DILARANG KERAS mengeluarkan atau memilih UUID scan.
   - LLM hanya mengeluarkan intent: `[INTENT:SHOW_HISTORICAL_FACE_SCAN]` atau `[INTENT:SHOW_HISTORICAL_INGREDIENT_SCAN]`.
   - Edge Function backend yang memetakan intent ke resource_id terverifikasi berdasarkan tanggal konteks dan `auth.uid()`.

---

## 2. Guardrail Klinis Perbandingan Lintas Tanggal (Kimi Consensus)
1. **MCID Threshold (< 5 Poin = Stabil)**:
   - Delta < 5 poin: Wajib dinyatakan "Stabil" (variasi noise pencahayaan/sudut foto).
   - Delta >= 5 poin dalam band yang sama: "Cenderung berubah, kategori sama".
   - Delta >= 5 poin pindah band: Baru diizinkan menyimpulkan perubahan nyata, dan wajib merujuk area spesifik.
2. **Horizon Waktu Siklus Epidermis (28 Hari)**:
   - Selisih < 7 hari: Wajib dinyatakan terlalu dini untuk menyimpulkan perubahan fisiologis nyata.
3. **Capture Caveat dari Database**:
   - Jika beda jam capture > 4 jam atau lighting_score rendah, AI wajib menyampaikan catatan kondisi pengambilan foto sebelum menyimpulkan perbandingan.
   - Jika `is_repeat = true`, perbandingan dinyatakan tidak valid secara klinis.

---

## 3. Tata Kelola Internal Skincluv Handbook
1. **10 Entri Inti**:
   - Scan Wajah AI, Scan Bahan Produk, Skinsistant Chatbot, Riwayat Scan & Tren, Misi Glow, Koin & Kuota, GLOW Pass & PRO Pass, Free Tier, Profil Kulit, Keamanan Data & Consent.
2. **Struktur Entri Anti-Halusinasi**:
   - `canonical_name`, `aliases`, `description`, `what_it_is_not` (elemen wajib penangkal asumsi liar), `category`.
3. **Hierarchy of Authority**:
   - Database / Logika Bisnis (`subscription_tiers`, `ai_features`) > Handbook (Prosa & Scope) > LLM (Naratif).
   - Angka nominal kredit/koin/harga diambil langsung dari database, bukan ditulis statis di handbook.

---

## 4. Penambahan Invarian di AGENTS.md
- **Invarian 14 (Clinical Temporal Comparison & MCID Guardrails)**: Perbandingan dua scan wajib mengikuti ambang MCID (< 5 poin = noise/stabil) dan caveat kondisi pencahayaan.
- **Invarian 15 (Product Handbook Hierarchy of Authority)**: Pengetahuan produk Skincluv bersumber dari tabel handbook terverifikasi dengan aturan "what_it_is_not". Database transaksi memegang otoritas tertinggi di atas handbook.
