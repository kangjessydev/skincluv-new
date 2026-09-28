# Konsensus Dewan AI: RFC 017 — Pre-Launch Cross-Surface Unification, Invariant 19 Regulatory Cleansing, & Database Invariant Hardening

**Tanggal Konsensus**: 2026-09-28  
**Partisipan Dewan AI**:
1. **ChatGPT (OpenAI o1 / GPT-4o)** — Security Red Teamer & Concurrency Auditor
2. **Kimi (Moonshot)** — Clinical Skincare & Regulatory Researcher (BPOM / Permenkes)
3. **DeepSeek (R1 / V3)** — Mathematical & Performance Optimizer
4. **Antigravity (Google DeepMind)** — Lead Engineer & Runtime Builder

**Status Dokumen**: RATIFIKASI RESMI (UNANIMOUS APPROVAL WITH CONCURRENT AMENDMENTS)

---

## 1. Rangkuman Eksekutif & Terobosan Analisis

Dewan AI menyetujui secara aklamasi implementasi perbaikan pra-peluncuran (**RFC 017**) dengan 5 pilar arsitektur dan kepatuhan hukum:

1. **Eskalasi Regulasi Kemenkes (Temuan Kimi)**:
   * Isu kata *"Diagnosis"* bukan sekadar pelanggaran etiket klaim kosmetik BPOM, melainkan **risiko pidana klasifikasi lintas-jalur ke Izin Edar Alat Kesehatan (AKD / *Software as a Medical Device* - SaMD, Permenkes No. 62/2017)**. Perangkat lunak yang mengklaim fungsi diagnostik wajib berizin edar Kemenkes.
   * Cleansing kata wajib menyapu residu register medis lainnya: kata *"dermatologis"* dan *"klinis"* disapu bersamaan dari seluruh antarmuka aktif pengguna.
2. **Immutability Ledger & Zero Bloat (Temuan DeepSeek & ChatGPT)**:
   * Menolak opsi UPDATE langsung pada `ai_request_logs` untuk rating pengguna.
   * `ai_request_logs` dijaga tetap *append-only* murni (melindungi efisiensi BRIN index dan mencegah *table bloat*). Umpan balik dipisahkan ke tabel atomik `ai_feedback` dengan RPC `record_ai_feedback`.
3. **Database-Level Invariant Enforcement (Temuan ChatGPT & DeepSeek)**:
   * Proteksi UI (`disabled`) tidak cukup. Invarian 1 (`universal_ai`) dan Invarian 2 (`face_validation = 0`) wajib dikunci mutlak di level PostgreSQL `CHECK` constraint.
4. **Pemulihan Funnel Konversi (Temuan DeepSeek)**:
   * Perbaikan broken route `/wallet` -> `/pricing` diproyeksikan mengembalikan konversi upgrade sebesar **5–15%** (menghilangkan friction salah halaman ke `/profile`). Rute `/wallet` dipertahankan sebagai redirect 301/SPA ke `/pricing` demi backward compatibility.
5. **Pemisahan Otorisasi Admin Bridge (Temuan ChatGPT)**:
   * State UI hanya mengatur visibilitas tombol. Menu `Admin Control Center` diekspos melalui *allowlist permission* yang ketat (`canAccessAdmin`), diletakkan secara elegan di dalam User Profile Dropdown (desktop) dan Profile Page (mobile), tanpa mengotori sidebar pengguna biasa.
6. **Penonaktifan Orphan Feature**:
   * Halaman `AdminTrainingDatasets` dinonaktifkan sementara dari menu navigasi Control Center untuk mencegah ilusi pipeline training yang belum memiliki proses *redaction / de-identification* data pengguna.

---

## 2. Resolusi Teknis & Rencana Tindakan

### A. Regulasi & Reframe Invarian 19 (Kimi & ChatGPT)
* **Reframe Invarian 19**: Berubah dari aturan blacklist kata sederhana menjadi **Non-Therapeutic Product Claim Boundary**.
* **Daftar Substitusi Wording Antarmuka**:
  1. `"Diagnosis dermatologis AI menunjukkan..."` -> `"Analisis kulit berbasis AI menunjukkan..."`
  2. `"Lihat Detail Diagnosis"` -> `"Lihat Detail Analisis"`
  3. `"Dapatkan diagnosis 16 parameter klinis..."` -> `"Pemetaan 16 parameter kondisi kulit dari satu foto"`
  4. `<span className="af-label">Diagnosis Klinis:</span>` -> `<span>Hasil Analisis:</span>`
  5. `<h3>Laporan Diagnosis Kulit</h3>` -> `<h3>Laporan Analisis Kulit</h3>`
  6. Parameter 16 observasi dibatasi pada penampakan visual kosmetik (pori, minyak, hidrasi, noda, garis halus), tanpa klaim patologi atau lesi penyakit.

### B. Standardisasi Terminologi & Invarian 23 (ChatGPT)
* **Adopsi Invarian 23**: *Canonical User-Facing Vocabulary*.
  * Permukaan Pengguna: **Credits / AI Credits**, **Skinsistant AI** (alias pendek: *Skinsistant*), **Skin Assessment**, **Analisis Komposisi**, **Paket Akses**, **Riwayat Tagihan**.
  * Internal Database: Tabel tetap menggunakan `coin_balances`, `coin_transactions`, `ai_features.credit_cost`. Tidak melakukan rename skema database demi zero migration risk.
  * Footer [PublicLayout.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/components/layout/PublicLayout.tsx): Ubah `"Sistem Koin Misi Harian"` menjadi `"Sistem AI Credits & Misi"`.

### C. Basis Data & Integritas Akuntansi (DeepSeek & ChatGPT)
* **Migration 081**:
  ```sql
  -- 1. Lock Invarian 2: face_validation wajib 0 credit
  ALTER TABLE public.ai_features
    ADD CONSTRAINT chk_face_validation_zero_cost
    CHECK (slug != 'face_validation' OR credit_cost = 0);

  -- 2. Lock Invarian 1: universal_ai wajib selalu aktif
  ALTER TABLE public.ai_features
    ADD CONSTRAINT chk_universal_ai_active
    CHECK (slug != 'universal_ai' OR is_active = true);

  -- 3. Tabel terisolasi ai_feedback
  CREATE TABLE IF NOT EXISTS public.ai_feedback (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    log_id      uuid NOT NULL REFERENCES public.ai_request_logs(id) ON DELETE CASCADE,
    user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    feedback    smallint NOT NULL CHECK (feedback IN (-1, 0, 1)),
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (log_id, user_id)
  );

  CREATE INDEX IF NOT EXISTS idx_ai_feedback_log ON public.ai_feedback (log_id);
  CREATE INDEX IF NOT EXISTS idx_ai_feedback_user ON public.ai_feedback (user_id, created_at DESC);

  ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can manage own feedback" ON public.ai_feedback
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Admins can view all feedback" ON public.ai_feedback
    FOR SELECT TO authenticated
    USING (public.is_admin());

  -- 4. RPC Atomik record_ai_feedback
  CREATE OR REPLACE FUNCTION public.record_ai_feedback(
    p_log_id uuid,
    p_feedback smallint
  )
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, pg_temp
  AS $$
  BEGIN
    IF p_feedback NOT IN (-1, 0, 1) THEN
      RAISE EXCEPTION 'Feedback value must be -1, 0, or 1';
    END IF;

    INSERT INTO public.ai_feedback (log_id, user_id, feedback)
    SELECT p_log_id, auth.uid(), p_feedback
    WHERE EXISTS (
      SELECT 1 FROM public.ai_request_logs
      WHERE id = p_log_id AND user_id = auth.uid()
    )
    ON CONFLICT (log_id, user_id) DO UPDATE
    SET feedback = EXCLUDED.feedback,
        created_at = now();

    RETURN true;
  END;
  $$;

  GRANT EXECUTE ON FUNCTION public.record_ai_feedback(uuid, smallint) TO authenticated;
  ```

### D. Perbaikan Funnel Navigasi & Broken Routes
1. [TransactionHistoryPage.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/TransactionHistoryPage.tsx):
   * Back-link: `to="/profile"` (*"Kembali ke Profil"*).
   * Upgrade button: `to="/pricing"` (*"Upgrade ke PRO"*).
2. [PaymentSuccessPage.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/PaymentSuccessPage.tsx):
   * Ganti tombol sekunder dari `"Ke Wallet"` menjadi `"Riwayat Tagihan"` (`to="/transactions"`).
3. [App.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/App.tsx):
   * Ubah redirect `/wallet` dari `/profile` menjadi `/pricing`.

### E. Jembatan Navigasi Admin Control Center
1. [AppLayout.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/components/layout/AppLayout.tsx):
   * Cek otorisasi staf: `canAccessAdmin = isAdmin || userRoles.some(r => ['super_admin', 'tech_lead', 'business_lead', 'support_agent', 'clinical_reviewer', 'admin'].includes(r))`.
   * Jika `canAccessAdmin === true`, tambahkan item `"Admin Control Center"` (ikon `ShieldCheck`) di dalam popover dropdown profil pengguna desktop.
2. [ProfilePage.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/ProfilePage.tsx):
   * Tambahkan tautan menu navigasi `"Admin Control Center"` jika `canAccessAdmin === true`.
3. [AdminLayout.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/components/admin/AdminLayout.tsx):
   * Sembunyikan item navigasi `/admin/training/datasets` dari sidebar Control Center produksi sampai modul *redaction pipeline* selesai.

### F. Penyelarasan Desain RegisterPage
* [RegisterPage.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/auth/RegisterPage.tsx) diselaraskan sepenuhnya dengan [LoginPage.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/auth/LoginPage.tsx):
  * Tipografi heading serif *Fraunces* (32px).
  * Tombol Google putih elegan ber-border tipis halus dengan logo SVG Google multi-warna.
  * Tombol navigasi `<- Kembali`.
  * Indikator keamanan data kulit (*trust shield badge*).
  * Field input rounded 10px.

---

## 3. Jadwal Eksekusi Terstruktur

Perbaikan akan dieksekusi secara bertahap, modular, dan terverifikasi:

* **Tahap 1**: Deploy Migration 081 (DB constraints untuk Invarian 1 & 2, tabel `ai_feedback` + RPC `record_ai_feedback`, sinkronisasi types TypeScript).
* **Tahap 2**: Regulatory Cleansing (penyapuan kata *diagnosis, dermatologis, klinis* pada [DashboardPage.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/DashboardPage.tsx), [FaceScanPage.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/FaceScanPage.tsx), [ScanHistoryPage.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/ScanHistoryPage.tsx), [FaceScanDetailModal.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/components/scans/FaceScanDetailModal.tsx)).
* **Tahap 3**: Pemulihan Funnel Konversi & Konsistensi Terminologi (perbaikan link `/wallet` -> `/pricing` di [TransactionHistoryPage.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/TransactionHistoryPage.tsx), [PaymentSuccessPage.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/PaymentSuccessPage.tsx), [App.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/App.tsx), dan standardisasi istilah di footer [PublicLayout.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/components/layout/PublicLayout.tsx)).
* **Tahap 4**: Jembatan Navigasi Admin & Penonaktifan Orphan Menu ([AppLayout.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/components/layout/AppLayout.tsx), [ProfilePage.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/ProfilePage.tsx), [AdminLayout.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/components/admin/AdminLayout.tsx)).
* **Tahap 5**: Penyelarasan Desain [RegisterPage.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/auth/RegisterPage.tsx) ke standar editorial [LoginPage.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/auth/LoginPage.tsx).
* **Tahap 6**: Uji Kompilasi (`tsc -b && vite build`) dan Verifikasi Kesiapan Peluncuran.
