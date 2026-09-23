# 🌿 RFC 004: Validasi Klinis Skincare, Kontraindikasi & Regulasi BPOM RI

**Tanggal**: 2026-09-23  
**Auditor**: Kimi / Moonshot (Clinical Skincare & Regulatory Researcher)  
**Tingkat Urgensi**: 🟢 P2 - Domain Expertise, Safety Guardrails & BPOM Compliance

---

## 1. Matriks Kontraindikasi Fatal Bahan Aktif

Kimi merekomendasikan interaksi bahan aktif **tidak diserahkan pada ingatan bebas LLM**, melainkan disimpan dalam tabel database deterministik `ingredient_interactions` agar verifikasi 100% bebas halusinasi:

| Pasangan Bahan | Level | Risiko Klinis | Solusi & Aturan Sistem |
| :--- | :---: | :--- | :--- |
| **Retinoid + AHA Dosis Tinggi** | 🔴 Fatal | Kerusakan skin barrier berat, eritema, chemical burn | Pisahkan malam bergantian (selang hari). |
| **Benzoyl Peroxide (BPO) + Tretinoin** | 🔴 Fatal | Oksidasi tretinoin (inaktif total) + iritasi berat | BPO di pagi hari, Tretinoin di malam hari. |
| **BPO + Hydroquinone** | 🔴 Fatal | Oksidasi hidrokuinon memicu **Ochronosis Exogenus** (noda hitam permanen) | Dilarang keras digabung. (HQ wajib resep dokter). |
| **AHA + BHA Simultan Dosis Tinggi** | 🔴 Fatal | Penurunan pH ganda drastis, barrier burn | Selang hari atau pilih salah satu eksfoliator. |
| **Vit C (L-Ascorbic) + Copper Peptide** | 🔴 Fatal | Oksidasi ion tembaga → kedua zat inaktif | Vit C pagi, Copper Peptide malam. |
| **Eksfoliator Kimia + Scrub Fisik** | 🔴 Fatal | Luka mikro (*micro-tears*), hiperpigmentasi pasca-inflamasi | Hapus scrub kasar dari saran jika user pakai AHA/Retinol. |
| **Retinoid/AHA + Tanpa Sunscreen** | 🔴 Fatal | Fotosensitivitas tinggi, memicu flek hitam | **Hard Rule**: Sistem wajib menyuntikkan reminder SPF otomatis. |
| **Vit C Murni + Niacinamide** | 🟢 Mitos | Formulasi kosmetik modern sudah stabil | **Boleh dilayer** (efek sinergis mencerahkan). |

---

## 2. Kepatuhan Regulasi BPOM RI (PerBPOM No. 3/2022 & No. 18/2024)

### A. Frasa Terlarang vs Frasa yang Diizinkan:
- ❌ Dilarang: *"Menghilangkan jerawat"* ➔ ✅ Boleh: *"Merawat kulit berjerawat"*
- ❌ Dilarang: *"Menghilangkan kerutan/garis halus"* ➔ ✅ Boleh: *"Membantu menyamarkan tampilan garis halus"*
- ❌ Dilarang: *"100% ampuh tanpa efek samping"* ➔ ✅ Boleh: *"Telah teruji secara dermatologis"*
- ❌ Dilarang: Mengklaim menyembuhkan penyakit (psoriasis, dermatitis kronis) atau mengubah fungsi fisiologis permanen.

### B. Deteksi Bahan Berbahaya & Ilegal:
Sistem OCR/Scanner harus memiliki filter *red flag* untuk zat terlarang tanpa resep:
- **Merkuri** (kerusakan ginjal & saraf).
- **Asam Retinoat / Tretinoin** (teratogenik, dilarang di kosmetik bebas).
- **Hidrokuinon** (risiko ochronosis eksogen permanen).
- **Steroid / Deksametason** (atrofi kulit).

---

## 3. Desain Struktur Knowledge Base Bahan Aktif

Schema tabel `active_ingredients` di PostgreSQL:
- `inci_name` (Text, Unique) & `synonyms` (Text[])
- `category` (Text: retinoid, exfoliator, antioxidant, soothing, dll.)
- `is_drug_only` (Boolean: jika true, chatbot dilarang merekomendasikannya sebagai kosmetik bebas)
- `comedogenic_rating` (Integer 0–5 skala Kligman)
- `pregnancy_safe` (Boolean) & `photosensitizing` (Boolean: trigger reminder sunscreen)
- `optimal_ph_min` & `optimal_ph_max`
- `usage_time` ('am' | 'pm' | 'both')
- `evidence_level` (Text: 'meta-analysis' | 'clinical-trial' | 'in-vitro')
