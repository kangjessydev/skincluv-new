# Formula Arsitektur: Decoupled Multi-Tier Face Validation Engine

Dokumen ini mendokumentasikan spesifikasi formula dan arsitektur validasi citra wajah untuk Skincluv AI.

---

## 1. Latar Belakang Masalah (Akar Masalah AI)

1. **Generative Completion Bias:**
   Ketika Multimodal LLM (seperti Gemini Vision) diberikan tugas ganda dalam satu prompt (*Classification Gate* + *Deep Skin Extraction*), LLM cenderung mengabaikan instruksi penolakan negatif karena terdorong untuk melengkapi skema output yang panjang (*helpful generative bias*). Akibatnya, gambar anime (seperti Tanjiro) atau foto wajah buram tetap dianalisis dan diberi skor.
2. **Whole-Image Blur Calculation Flaw:**
   Menghitung *Laplacian Edge Variance* pada seluruh gambar sering terkecoh oleh latar belakang atau baju yang berkontras tinggi, padahal area wajahnya mengalami *motion blur*.

---

## 2. Diagram Alur Arsitektur (Formula 3-Tier)

```
[Foto Diunggah Pengguna]
          │
          ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│ TIER 1: CLIENT-SIDE FACE-ROI MATHEMATICAL FILTER (< 30ms, 0 Biaya)            │
│ 1. Canvas Luma Analysis:                                                      │
│    $L = 0.299R + 0.587G + 0.114B$ (Memastikan pencahayaan $28 \le L \le 238$) │
│ 2. MediaPipe 468 Face Mesh:                                                   │
│    Mendeteksi bounding box wajah $[x_{min}, y_{min}, x_{max}, y_{max}]$.      │
│ 3. Face-ROI Laplacian Variance:                                               │
│    $Var(L_{ROI}) = \frac{1}{N}\sum (L_i - \mu)^2$ khusus pada kotak wajah.    │
│    Jika $Var(L_{ROI}) < 45 \rightarrow$ REJECT: Motion Blur / Buram!         │
└───────────────────────────────────────┬───────────────────────────────────────┘
                                        │ (Jika Lolos)
                                        ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│ TIER 2: DEDICATED AI CLASSIFIER GATEKEEPER (< 400ms, 0 Biaya Koin)            │
│ • Panggilan Gemini Vision KHUSUS Klasifikasi Biner (Tanpa Skema Analisis).    │
│ • Menilai keaslian foto manusia asli biologis vs:                             │
│   1. AI-Generated Faces (Midjourney, DALL-E, Stable Diffusion, AI Avatars)    │
│   2. Anime / Kartun 2D/3D / Ilustrasi / Lukisan / Patung (REJECT_AI_OR_ANIME) │
│   3. Hewan / Botol Skincare / Objek Mati (REJECT_NON_HUMAN)                   │
│   4. Motion Blur / Out-of-Focus (REJECT_BLUR)                                 │
│ • Output: { verdict: "PASS" | "REJECT_...", reason: "..." }                   │
│ • Jika Gagal $\rightarrow$ Tampilkan alasan spesifik, koin 0 terpotong.       │
└───────────────────────────────────────┬───────────────────────────────────────┘
                                        │ (JIKA DAN HANYA JIKA verdict === "PASS")
                                        ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│ TIER 3: CLINICAL SKIN ANALYSIS & SMART PRODUCT MATCHER                        │
│ • Konsumsi Koin / Kuota dilakukan di sini.                                    │
│ • Analisis 3-Area Granular (Dahi, T-Zone & Pipi, Dagu) + Tone Gen Z Pro.      │
│ • Smart Product Recommendation Ranking (#1, #2, #3) + Direct Marketplace Link.│
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Formula Matematis Face-ROI Laplacian

Untuk menghindari bias background, ketajaman dihitung eksklusif pada matriks piksel wajah:

$$\text{Kernel Laplacian } K = \begin{bmatrix} 0 & 1 & 0 \\ 1 & -4 & 1 \\ 0 & 1 & 0 \end{bmatrix}$$

$$\mu = \frac{1}{M \times N} \sum_{x=1}^M \sum_{y=1}^N (I * K)(x, y)$$

$$\text{Variance } \sigma^2 = \frac{1}{M \times N} \sum_{x=1}^M \sum_{y=1}^N \left( (I * K)(x, y) - \mu \right)^2$$

- **Threshold $\sigma^2 < 45$:** Foto wajah buram / goyang (*motion blur*) $\rightarrow$ **Ditolak**.
- **Threshold $\sigma^2 \ge 45$:** Foto wajah fokus dan memiliki detail pori/tekstur $\rightarrow$ **Lolos**.
