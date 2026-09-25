# 🏛️ AI Council Consensus Notes — RFC 006

**Topik**: Integrasi Chatbot Skinsistant dengan Rekam Jejak Scan Wajah & Komposisi Produk  
**Dokumen Induk**: [`docs/ai_sync/RFC_006_chatbot_multimodal_and_scan_integration.md`](./RFC_006_chatbot_multimodal_and_scan_integration.md)  
**Tanggal Mulai**: 25 September 2026  
**Status**: In Progress (Review dari Claude telah diterima)

---

## 1. Reviewer: Claude (Chief Software Architect)
**Status**: ✅ APPROVED (Design & Architectural Alignment)

### Poin Masukan Claude:
1. **Format Injeksi RAG: Bullet-Point Teks (Bukan JSON)**
   - Konsisten dengan pola yang sudah terbukti di codebase (`[MEMORI PASIEN TERVERIFIKASI]`, `[REFERENSI BAHAN TERVERIFIKASI SKINCLUV]`).
   - Mencegah overhead sintaks JSON (tanda kurung, kutip, field name berulang) sehingga hemat token.
   - Model seperti Qwen (Groq) jauh lebih andal dalam melakukan penalaran dari teks natural terstruktur.
2. **Pola Query Database: Tetap `Promise.all` di Edge Function (Bukan RPC Baru)**
   - `invoke-ai` sudah memiliki pola paralel `Promise.all` yang mapan untuk mengambil profil dan memori.
   - Cukup tambahkan query `face_scans` (limit 1) dan `ingredient_scans` (limit 3) ke dalam `Promise.all` yang sama.
   - Menghindari pembuatan RPC baru yang tidak perlu dan menjaga kesederhanaan skema DB.
3. **Action CTA Marker: Strict Enum Marker + Fallback Teks Biasa**
   - Respon chatbot tetap berupa teks natural murni (tidak mengubah kontrak response menjadi JSON).
   - Chatbot cukup menyematkan marker kecil di akhir respon: `[ACTION:FACE_SCAN]` atau `[ACTION:INGREDIENT_SCAN]`.
   - Frontend/Backend memisahkan (*strip*) marker tersebut dari bubble teks dan merender Action Button yang sesuai.
   - **Fail-safe critical**: Jika marker tidak dikenali atau parsing gagal, sistem otomatis menampilkan respon sebagai teks biasa tanpa tombol CTA (zero-crash guarantee).
4. **Keamanan Prompt Injection (Tanggapan Silang ke ChatGPT)**:
   - Aman secara konstruksi (*secure by design*) karena query `face_scans` dan `ingredient_scans` dibatasi oleh `WHERE user_id = user.id` dari token JWT otentikasi server-side, bukan dari string yang diketik pengguna di chat.

---

## 2. Reviewer: ChatGPT (Security Red Teamer & Concurrency)
**Status**: ⏳ Menunggu tanggapan pengguna

---

## 3. Reviewer: DeepSeek (Mathematical & Tokenomics Optimizer)
**Status**: ⏳ Menunggu tanggapan pengguna

---

## 4. Reviewer: Kimi (Clinical Skincare Researcher)
**Status**: ⏳ Menunggu tanggapan pengguna

---

## 5. Rangkuman Tindakan Sementara (Lead Engineer Antigravity)
- [x] Mencatat konsensus arsitektural dari Claude.
- [ ] Menunggu review keamanan dari ChatGPT terkait granular toggle consent (`chatbot_face_scan_consent`, `chatbot_ingredient_scan_consent`).
- [ ] Menunggu review tokenomics DeepSeek & validasi klinis Kimi.
