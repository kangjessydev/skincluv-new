# Handoff 002: inspektur → frontend

- **Dari:** role-inspektur   **Untuk:** role-frontend
- **Tanggal:** 2026-10-27
- **Status:** done (Selesai dieksekusi oleh role-frontend)
- **Prioritas:** tinggi

## Masalah / Kebutuhan
Audit UI Anti-AI Slop menemukan beberapa celah aksesibilitas keyboard (WCAG 2.1), missing `aria-label` pada tombol ikon, ketiadaan `tabular-nums` pada tampilan angka/saldo finansial, serta 42 peringatan linter Oxlint (unused variables & imports) yang perlu dibersihkan untuk menyempurnakan kualitas antarmuka.

## Bukti
1. **Clickable Card Tanpa Keyboard Handler**: [src/components/ui/CoinConfirmModal.tsx:64-96](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/components/ui/CoinConfirmModal.tsx#L64-L96)
2. **Missing `aria-label` & `type="button"`**: [src/pages/app/ChatbotPage.tsx:808](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/ChatbotPage.tsx#L808), [ChatbotPage.tsx:945](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/ChatbotPage.tsx#L945), [CoinConfirmModal.tsx:40](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/components/ui/CoinConfirmModal.tsx#L40)
3. **Ketiadaan Tabular Numbers**: `src/styles/cluv/` belum mengekspor utilitas `.cluv-tabular-nums` atau `font-variant-numeric: tabular-nums` untuk angka harga, sisa kredit, dan saldo.
4. **42 Peringatan Linter Oxlint**: Output `npm run lint` menunjukkan unused imports (`AdminFinancialsPage.tsx`, `DashboardPage.tsx`, `MissionsPage.tsx`) dan unused variables (`AppPricingPage.tsx`, `AdminUsersPage.tsx`).

## Tindakan yang Disarankan
1. **Perbaiki Aksesibilitas Keyboard di `CoinConfirmModal.tsx`**:
   - Tambahkan handler `onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { onCancel(); navigate('/missions'); } }}` pada kartu misi, dan padanannya untuk upgrade paket. Atau ubah elemen pembungkus menjadi `<button type="button" className="option-card ...">`.
   - Tambahkan `type="button"` pada tombol close modal.
2. **Perbaiki Aksesibilitas di `ChatbotPage.tsx`**:
   - Tambahkan `type="button"`, `aria-label="Tutup modal memori"`, dan `aria-hidden="true"` pada ikon `<X>` di baris 808-810.
   - Tambahkan `type="button"`, `aria-label="Tutup riwayat sesi"`, dan `aria-hidden="true"` pada ikon `<X>` di baris 945-947.
3. **Tambahkan Standar Tabular Numbers**:
   - Definisikan class utilitas `.cluv-tabular-nums { font-variant-numeric: tabular-nums; }` di `src/styles/cluv/utilities.css` atau `typography.css`.
   - Terapkan pada tampilan saldo kredit di `CoinConfirmModal.tsx:128-133` dan komponen harga/saldo lainnya.
4. **Bersihkan 42 Warning Oxlint**:
   - Hapus unused import dan variabel yang tidak terpakai agar `npm run lint` mencapai 0 errors dan 0 warnings.

## Di Luar Cakupan
- Dilarang mengubah alur logika bisnis RPC atau pemotongan koin.
- Dilarang mengubah skema basis data di `supabase/migrations/`.
- Dilarang mengubah layout utama atau menghapus fitur yang sudah ada.

## Kriteria Selesai
- `npm run build` (`tsc -b && vite build`) tetap lulus 100% 0 error.
- `npm run lint` (`oxlint`) bersih dari 42 warning.
- Aksesibilitas keyboard pada modal dan drawer terverifikasi berfungsi via Tab + Enter/Space.

## Disetujui User
ya
