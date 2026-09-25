# 🏛️ Konsensus Dewan AI: RFC 009 — Face Scan Clinical Pipeline, Memory Lifecycle, BPOM Compliance & Secure Chatbot Hand-off

Dokumen ini mencatat kesepakatan bulat dan keputusan arsitektur produksi antara **ChatGPT (Security Red Team & State Consistency)**, **DeepSeek (Frontend Performance & Asset Budget)**, **Kimi (Clinical Dermatologist & BPOM Regulatory)**, dan **Antigravity (Lead Engineer & Runtime Builder)** untuk RFC 009.

---

## 1. Matriks Keputusan Dewan AI

| Aspek Arsitektur | Kondisi Lama | Masukan Dewan AI | Keputusan Final Disepakati |
| :--- | :--- | :--- | :--- |
| **Estafet ke Chatbot (Hand-off)** | Mengirim teks diagnosis mentah lewat query param URL `?initialPrompt=...` | **ChatGPT**: Fatal security risk (manipulasi user & prompt injection).<br>**DeepSeek**: URL overflow (>2.000 char) di browser mobile. | **Secure ID Transport**: Cukup bawa `/chatbot?scan_id=<UUID>` (~45 char). Chatbot mengambil data klinis ringkas lewat RPC terverifikasi di server (`get_face_scan_chat_context`). |
| **Persetujuan Data (UU PDP Consent)** | Diagnosis otomatis masuk ke LLM chatbot | **ChatGPT**: Hak penyimpanan scan (`face_scans`) terpisah dari izin pemakaian memori di chatbot. | **Verifikasi Consent di Server**: Jika user mematikan izin scan di pengaturan chatbot, RPC tidak menyuntikkan data wajah ke konteks LLM. |
| **Siklus Memori MediaPipe Wasm** | Instance dibuat ulang & camera track tidak di-stop saat navigasi | **DeepSeek**: Memori bocor 45–120 MB per siklus (Wasm heap + WebGL GPU + video buffer). HP mid-range bisa crash setelah 5–10 kali navigasi. | **Explicit Lifecycle & Cleanup**: <br>1. Hentikan kamera (`track.stop()`).<br>2. Singleton FaceLandmarker dengan refcount + 5 detik grace period.<br>3. `refineLandmarks: false` (hemat 30% memori & CPU). |
| **Kepatuhan Regulasi BPOM (PerBPOM 3/2022)** | Menggunakan kata "Diagnosis", "Obat", "Menghilangkan jerawat", dan `match_score: 98%` palsu | **Kimi**: Skincluv adalah alat asesmen kosmetik, bukan klinik medis. Pelanggaran berat jika mengklaim fungsi obat. | **Bahasa Kosmetik Beretika**:<br>• Gunakan "Hasil Analisis Kulit" / "Temuan Terpantau".<br>• Gunakan kata kerja kosmetik (*membantu, merawat, menjaga, mengurangi tampilan*).<br>• Tambahkan micro-disclaimer di tiap kartu bahan: *"Bahan kosmetik, bukan obat — hasil bervariasi tiap orang."*<br>• Hapus skor palsu 98/94, ganti label kualitatif prioritas (*Utama / Pendukung*). |
| **Capture Guidance di Upload** | Tidak ada panduan pengambilan foto | **Kimi**: Variasi cahaya & sisa krim adalah sumber noise skor #1 (deviasi $\pm 5$ poin). | **3 Golden Rules of Face Capture**: Tampilkan kartu panduan ramah (Cahaya merata → Wajah bersih → Jarak pas ±30 cm). |
| **Design System Token** | 24 raw hex `#0f6784` di `<style>` block | **Seluruh Dewan**: Tidak konsisten dengan master tokens. | **Refactor Token CSS**: Ganti semua hex `#0f6784` ke `var(--skincluv-teal)` dan `var(--skincluv-teal-hover)`. |

---

## 2. Kontrak Data Hand-off Chatbot (`get_face_scan_chat_context`)

```sql
CREATE OR REPLACE FUNCTION public.get_face_scan_chat_context(p_scan_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_scan record;
  v_consent boolean;
  v_result jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  -- 1. Cek Consent UU PDP (RFC 006)
  SELECT COALESCE(chatbot_face_scan_consent, chatbot_scan_master_consent, true)
  INTO v_consent
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_consent = false THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'User has disabled face scan context consent'
    );
  END IF;

  -- 2. Ambil data scan dengan verifikasi kepemilikan mutlak
  SELECT id, overall_score, skin_status_title, skin_type, skin_concerns, analysis_notes, created_at
  INTO v_scan
  FROM public.face_scans
  WHERE id = p_scan_id AND user_id = v_user_id;

  IF v_scan.id IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Scan not found or unauthorized'
    );
  END IF;

  -- 3. Proyeksikan DTO ringkas dan aman
  v_result := jsonb_build_object(
    'allowed', true,
    'scan_id', v_scan.id,
    'scanned_at', v_scan.created_at,
    'skin_type', v_scan.skin_type,
    'overall_score', v_scan.overall_score,
    'status_title', v_scan.skin_status_title,
    'concerns', v_scan.skin_concerns,
    'summary_notes', v_scan.analysis_notes
  );

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_face_scan_chat_context(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_face_scan_chat_context(uuid) TO authenticated;
```

---

## 3. Rencana Eksekusi Antigravity (Step-by-Step)

1. **Step 1: Migrasi Database (Migration 061)**
   - Buat fungsi RPC `public.get_face_scan_chat_context(p_scan_id uuid)`.
   - Apply migrasi ke live Supabase database.
2. **Step 2: Lifecycle & Memory Optimization (`src/lib/faceMesh.ts` & `FaceScanPage.tsx`)**
   - Pastikan camera stream tracks di-stop saat unmount.
   - Set `refineLandmarks: false` untuk menghemat 30% memori.
3. **Step 3: Capture Guidance & Copywriting BPOM (`FaceScanPage.tsx`)**
   - Tampilkan kartu panduan ramah 3 Aturan Emas sebelum upload/kamera.
   - Standarisasi istilah: ganti klaim medis menjadi manfaat kosmetik terverifikasi BPOM.
   - Tambahkan micro-disclaimer di kartu rekomendasi bahan.
4. **Step 4: Secure Hand-off ke Chatbot**
   - Ganti `initialPrompt` panjang di URL menjadi navigasi `/chatbot?scan_id=${scanId}`.
   - Di `ChatbotPage.tsx`, tangkap `scan_id`, panggil RPC `get_face_scan_chat_context`, dan sambut user dengan konteks yang aman.
5. **Step 5: Design Token Cleanup & Reaktivitas State**
   - Bersihkan seluruh 24 hex `#0f6784` menjadi `var(--skincluv-teal)`.
   - Pastikan `authStore.setActiveSkinProfile` dipanggil seketika setelah insert database berhasil.
6. **Step 6: Verifikasi & Build Clean**
   - Uji `npm run build` (`tsc -b && vite build`) untuk memastikan 0 error.
