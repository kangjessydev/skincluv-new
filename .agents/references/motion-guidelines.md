# Panduan Motion & Animasi UI (Anti-AI Slop)

Dokumen standar untuk `role-frontend` dan `role-motion`. Animasi bertujuan memberikan **umpan balik fungsional** dan **orientasi spasial**, bukan sekadar hiasan kosmetik lambat yang membuang waktu user.

---

## 1. Aturan Keemasan (Golden Rules)
1. **Cepat & Responsif:** Durasi animasi fungsional berada di rentang **120ms – 250ms**. Di atas 350ms membuat aplikasi terasa lemot, kecuali untuk perpindahan halaman layar penuh (maksimal 400ms).
2. **Hanya Kompositor GPU:** HANYA animasikan `transform` (translate, scale, rotate) dan `opacity`. JANGAN PERNAH menganimasikan `width`, `height`, `top`, `left`, `margin`, atau `padding` karena memicu reflow/layout-shift (CLS) dan membebani CPU.
3. **Patuhi Aksesibilitas (`prefers-reduced-motion`):**
   ```css
   @media (prefers-reduced-motion: reduce) {
     *, ::before, ::after {
       animation-duration: 0.01ms !important;
       animation-iteration-count: 1 !important;
       transition-duration: 0.01ms !important;
       scroll-behavior: auto !important;
     }
   }
   ```
4. **Alami (Easing Physics):** Hindari easing `linear` untuk gerakan elemen visual. Gunakan kurva bezier yang meniru fisika dunia nyata: cepat di awal, melambat di akhir (*ease-out*).

---

## 2. Token Durasi & Easing Baku
| Token | Nilai / Kurva | Kegunaan |
|---|---|---|
| `duration-instant` | `100ms` | State klik tombol, toggle checkbox/switch |
| `duration-fast` | `150ms - 200ms` | Hover effect, tooltip, dropdown menu popover |
| `duration-normal` | `250ms - 300ms` | Modal dialog, slide-over drawer, accordion expand |
| `duration-slow` | `350ms - 450ms` | Transisi rute halaman penuh, onboarding carousel |
| `ease-out-standard` | `cubic-bezier(0.16, 1, 0.3, 1)` | Elemen masuk ke layar (Decelerate curve) |
| `ease-in-standard` | `cubic-bezier(0.7, 0, 0.84, 0)` | Elemen keluar dari layar (Accelerate curve) |
| `ease-spring` | `spring(mass: 1, stiffness: 260, damping: 20)` | Interaksi dinamis (drag, swipe, toggle bouncy) |

---

## 3. Katalog Pola Animasi Sesuai Kebutuhan

### A. Micro-Interactions (Tombol & Input)
- **Hover:** Peningkatan kontras ringan atau elevasi halus (`transform: translateY(-1px)` + bayangan lembut `shadow-sm` -> `shadow-md`). Durasi 150ms.
- **Active / Tap:** Efek tekan fisik (`transform: scale(0.97)` atau `translateY(0)`). Durasi 80-100ms.
- **Input Focus:** Cincin fokus (*focus ring*) membesar dengan transisi opacity, bukan melompat secara tiba-tiba.

### B. Feedback & Loading States
- **Skeleton Shimmer:** Efek gelombang kilap linier berulang (durasi 1.5s - 2s) dengan opasitas rendah (10% - 20%) untuk menandakan data sedang ditarik.
- **Spinner / Indeterminate Bar:** Gerakan berulang yang konstan untuk aksi yang memakan waktu > 500ms.
- **Success Checkmark:** Animasi path SVG `stroke-dasharray` yang menggambar tanda centang seketika setelah mutasi data berhasil.

### C. Dialog, Modal & Sheet (Orientasi Spasial)
- **Masuk (Enter):** Mulai dari `scale(0.95)` dan `opacity: 0`, bergerak ke `scale(1)` dan `opacity: 1` dengan `ease-out-standard` (durasi 200ms).
- **Keluar (Exit):** Berlawanan arah dengan durasi lebih cepat (150ms) menggunakan `ease-in-standard`.
- **Backdrop (Overlay):** Fade in murni `opacity: 0` -> `opacity: 1` (durasi 200ms).

### D. List & Data Table Orchestration (Staggering)
- Jika memuat daftar item baru, terapkan stagger delay 30ms - 50ms antar item (maksimal 5-7 item pertama) agar user melihat aliran data tanpa membuat layar berkedip kacau.

---

## 4. Pemilihan Teknologi (Kapan CSS vs Library)
- **Gunakan Vanilla CSS / Tailwind (Default):** Untuk 90% interaksi standar (hover, active, transition modal, dropdown, spinner). Ringan, nol dependensi JS, 60fps terjamin.
- **Gunakan Motion (Framer Motion / Motion One):** Jika membutuhkan exit animation (`AnimatePresence`), gestur drag/swipe, layout animations yang kompleks (FLIP technique), atau physics spring.
- **Gunakan GSAP:** Khusus jika membangun landing page imersif dengan timeline animasi berantai yang sinkron dengan scroll mouse (*ScrollTrigger*).
