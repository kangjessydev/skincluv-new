-- ==============================================================================
-- Migration 085: Seed Face Scan Golden Benchmark Exemplars (RFC 022)
-- Menyematkan 5 profil acuan kebenaran (Ground Truth Gold Standard)
-- ke dalam public.ai_training_datasets untuk verifikasi akurasi scan wajah.
-- ==============================================================================

INSERT INTO public.ai_training_datasets (
  feature_slug,
  system_prompt,
  user_input,
  ideal_response,
  quality_tier,
  quality_score,
  is_few_shot_exemplar,
  domain_tags
)
VALUES
-- ------------------------------------------------------------------------------
-- GB-01: Severe Acne & Oily Skin Profile
-- ------------------------------------------------------------------------------
(
  'face_analysis',
  'Standar Forensik Optik & Analisis Kondisi Kulit Wajah Gen Z Pro (RFC 022)',
  '[Golden Benchmark GB-01]: Citra close-up wajah dengan sebum berlebih mengkilap di dahi dan hidung, pori-pori melebar, dan beberapa papula/pustula jerawat aktif di pipi.',
  '{
    "is_valid_face": true,
    "overall_score": 58,
    "skin_status_title": "Kondisi Kulit: Sebum Tinggi & Indikasi Jerawat Aktif",
    "analysis_notes": "Sobat, wajahmu lagi ngalamin sebum overload nih terutama di area T-zone! Ada beberapa bintik peradangan jerawat aktif yang butuh soothing care biar nggak makin meradang. Tenang, skin barrier masih bisa diperbaiki dengan rutinitas bahan aktif yang tepat.",
    "skin_type": "oily",
    "skin_concerns": ["acne", "large_pores", "excess_sebum"],
    "area_evaluations": [
      {
        "id": "forehead",
        "area_name": "Dahi (Forehead)",
        "score": 60,
        "status": "Perlu Perhatian",
        "finding": "Kilap minyak terlihat jelas dengan tekstur pori yang sedikit tersumbat sebum.",
        "analogy": "Area dahi kayak jalanan licin abis hujan gerimis, minyaknya cukup intens.",
        "action_plan": "Gunakan gentle cleanser low pH dan toner berbahan BHA ringan."
      },
      {
        "id": "tzone_cheeks",
        "area_name": "Hidung & Pipi (T-Zone & Cheeks)",
        "score": 54,
        "status": "Waspada",
        "finding": "Terdeteksi pustula dan kemerahan eritema di pipi kanan-kiri serta pori-pori tampak melebar.",
        "analogy": "Pori-pori di pipi lagi lembur produksi minyak, bikin jerawat gampang numpang lewat.",
        "action_plan": "Fokus calming dengan serum Niacinamide atau Centella Asiatica, hindari scrub fisik."
      },
      {
        "id": "chin_lips",
        "area_name": "Dagu & Sekitar Mulut (Chin & Perioral)",
        "score": 62,
        "status": "Perlu Perhatian",
        "finding": "Sedikit komedo tertutup (closed comedones) tanpa kista inflamasi besar.",
        "analogy": "Dagu masih relatif aman, tapi ada tanda-tanda komedo mulai ngantre.",
        "action_plan": "Jaga kebersihan area dagu dari sentuhan tangan dan sisa pasta gigi."
      }
    ],
    "tips_avoid": ["Scrub wajah berbutir kasar", "Minyak kelapa / mineral oil berat", "Memencet jerawat"],
    "tips_reduce": ["Makanan tinggi indeks glikemik", "Begadang dan stres"],
    "tips_do": ["Double cleansing malam hari", "Gunakan sunscreen oil-free bertekstur gel"],
    "recommended_ingredients": [
      {
        "name": "Salicylic Acid 1-2% (BHA)",
        "purpose": "Membersihkan sumbatan sebum dan pori-pori dari dalam secara lembut",
        "priority": "essential"
      },
      {
        "name": "Niacinamide 5%",
        "purpose": "Mengontrol produksi sebum harian dan menyamarkan noda kemerahan",
        "priority": "essential"
      },
      {
        "name": "Centella Asiatica (Cica)",
        "purpose": "Menenangkan peradangan jerawat dan mempercepat pemulihan kulit",
        "priority": "recommended"
      }
    ]
  }'::jsonb,
  'gold',
  1.0,
  true,
  ARRAY['golden_benchmark', 'gb-01', 'acne_oily', 'ground_truth']
),

-- ------------------------------------------------------------------------------
-- GB-02: Dry & Compromised Barrier Skin Profile
-- ------------------------------------------------------------------------------
(
  'face_analysis',
  'Standar Forensik Optik & Analisis Kondisi Kulit Wajah Gen Z Pro (RFC 022)',
  '[Golden Benchmark GB-02]: Citra close-up wajah dengan kulit sangat kering kusam, tampak mikro-flaking (kulit mengelupas halus di tepi cuping hidung dan pipi), serta rona kemerahan sensitif.',
  '{
    "is_valid_face": true,
    "overall_score": 62,
    "skin_status_title": "Kondisi Kulit: Dehidrasi & Skin Barrier Perlu Dipulihkan",
    "analysis_notes": "Kulitmu lagi mengirim sinyal SOS kehausan, Sobat! Kadar air sangat minim dan pelindung terluar kulit (barrier) lagi tipis banget, makanya gampang merah dan agak perih. Kuncinya sekarang: stop eksfoliasi dulu, fokus perbaikan hidrasi!",
    "skin_type": "dry",
    "skin_concerns": ["dryness", "redness", "barrier_compromised"],
    "area_evaluations": [
      {
        "id": "forehead",
        "area_name": "Dahi (Forehead)",
        "score": 68,
        "status": "Perlu Perhatian",
        "finding": "Garis dehidrasi halus tampak saat tersenyum, tidak ada sebum berlebih.",
        "analogy": "Dahi kayak tanah kering kemarau, butuh guyuran hidrasi mendalam.",
        "action_plan": "Pakai hydrating toner berlapis (metode pat-pat)."
      },
      {
        "id": "tzone_cheeks",
        "area_name": "Hidung & Pipi (T-Zone & Cheeks)",
        "score": 58,
        "status": "Waspada",
        "finding": "Pipi menunjukkan eritema kemerahan dengan mikro-flaking di sekitar cuping hidung.",
        "analogy": "Pipi lagi protes karena pelindungnya tipis, gampang reaktif kena cuaca panas.",
        "action_plan": "Oleskan barrier cream kaya Ceramide tebal-tebal di malam hari."
      },
      {
        "id": "chin_lips",
        "area_name": "Dagu & Sekitar Mulut (Chin & Perioral)",
        "score": 64,
        "status": "Perlu Perhatian",
        "finding": "Tepi bibir kering dan bersisik halus.",
        "analogy": "Area sekitar mulut gersang, butuh pelembap oklusif.",
        "action_plan": "Kunci hidrasi dengan petroleum jelly atau balm bibir."
      }
    ],
    "tips_avoid": ["Sabun cuci muka berbusa banyak (SLS/SLES)", "AHA/BHA atau retinol selama 2 minggu", "Cuci muka dengan air panas"],
    "tips_reduce": ["Terpapar AC terlalu lama tanpa pelembap"],
    "tips_do": ["Pakai pelembap bertekstur krim kaya lipid", "Reapply sunscreen berformula melembapkan"],
    "recommended_ingredients": [
      {
        "name": "Ceramide Complex (NP/AP/EOP)",
        "purpose": "Menambal lipid pelindung kulit terluar yang bocor agar kelembapan terkunci",
        "priority": "essential"
      },
      {
        "name": "Hyaluronic Acid Multi-Molecular",
        "purpose": "Menarik dan mengikat molekul air ke lapisan dermis yang dehidrasi",
        "priority": "essential"
      },
      {
        "name": "Panthenol (Vitamin B5)",
        "purpose": "Menenangkan sensasi perih kemerahan dan mempercepat regenerasi sel",
        "priority": "recommended"
      }
    ]
  }'::jsonb,
  'gold',
  1.0,
  true,
  ARRAY['golden_benchmark', 'gb-02', 'dry_barrier', 'ground_truth']
),

-- ------------------------------------------------------------------------------
-- GB-04: Clear & Normal Healthy Skin Profile
-- ------------------------------------------------------------------------------
(
  'face_analysis',
  'Standar Forensik Optik & Analisis Kondisi Kulit Wajah Gen Z Pro (RFC 022)',
  '[Golden Benchmark GB-04]: Citra close-up wajah bersih, rona sirkulasi sehat merata, tekstur halus tanpa lesi jerawat aktif, pori-pori normal dan hidrasi seimbang.',
  '{
    "is_valid_face": true,
    "overall_score": 92,
    "skin_status_title": "Kondisi Kulit: Sangat Optimal & Barrier Sehat Prima",
    "analysis_notes": "Glow level maksimal! Kulitmu berada di kondisi prima impian banyak orang: hidrasi seimbang, barrier kokoh, dan rona wajah segar alami. Fokus utamamu adalah menjaga dan memproteksi status optimal ini dari paparan sinar UV dan polusi.",
    "skin_type": "normal",
    "skin_concerns": ["mild_dullness"],
    "area_evaluations": [
      {
        "id": "forehead",
        "area_name": "Dahi (Forehead)",
        "score": 94,
        "status": "Optimal",
        "finding": "Tekstur halus, pantulan cahaya alami sehat tanpa sebum berlebih.",
        "analogy": "Dahi mulus licin kayak jalan tol baru diaspal!",
        "action_plan": "Cukup bersihkan secara rutin dan gunakan pelembap ringan."
      },
      {
        "id": "tzone_cheeks",
        "area_name": "Hidung & Pipi (T-Zone & Cheeks)",
        "score": 90,
        "status": "Optimal",
        "finding": "Pori-pori teratur, kelembapan pipi sangat baik tanpa tanda inflamasi.",
        "analogy": "Pipi kenyal dan glowing natural, skin goals banget!",
        "action_plan": "Pertahankan penggunaan sunscreen harian minimal SPF 30+ PA++++."
      },
      {
        "id": "chin_lips",
        "area_name": "Dagu & Sekitar Mulut (Chin & Perioral)",
        "score": 92,
        "status": "Optimal",
        "finding": "Area dagu bersih merata tanpa komedo atau noda hitam.",
        "analogy": "Area dagu stabil dan tenang sentosa.",
        "action_plan": "Rutin ganti sarung bantal untuk mencegah bakteri menempel."
      }
    ],
    "tips_avoid": ["Eksfoliasi berlebihan (cukup 1x seminggu)", "Melewatkan sunscreen di pagi/siang hari"],
    "tips_reduce": ["Menyentuh wajah dengan tangan yang belum dicuci"],
    "tips_do": ["Rutin pakai sunscreen setiap hari", "Gunakan antioksidan untuk menangkal radikal bebas"],
    "recommended_ingredients": [
      {
        "name": "Vitamin C (Ethyl Ascorbic Acid)",
        "purpose": "Memberikan proteksi antioksidan dan mempertahankan kecerahan alami kulit",
        "priority": "essential"
      },
      {
        "name": "Broad-Spectrum Sunscreen UV Filters",
        "purpose": "Melindungi kolagen kulit dari penuaan dini akibat paparan UV",
        "priority": "essential"
      },
      {
        "name": "Green Tea / EGCG Extract",
        "purpose": "Menjaga pertahanan sel dari polusi perkotaan",
        "priority": "optional"
      }
    ]
  }'::jsonb,
  'gold',
  1.0,
  true,
  ARRAY['golden_benchmark', 'gb-04', 'clear_normal', 'ground_truth']
),

-- ------------------------------------------------------------------------------
-- GB-05: Gatekeeper Negative Control (Rejection Profile)
-- ------------------------------------------------------------------------------
(
  'face_analysis',
  'Standar Forensik Optik & Analisis Kondisi Kulit Wajah Gen Z Pro (RFC 022)',
  '[Golden Benchmark GB-05]: Citra karakter animasi 2D, gambar AI sintetis, produk botol kosmetik, atau foto bukan wajah manusia asli.',
  '{
    "is_valid_face": false,
    "reason": "Foto yang Anda unggah terdeteksi sebagai karakter non-biologis / ilustrasi / bukan wajah manusia asli. Harap unggah foto wajah asli Anda di pencahayaan yang cukup."
  }'::jsonb,
  'gold',
  1.0,
  true,
  ARRAY['golden_benchmark', 'gb-05', 'negative_gatekeeper', 'ground_truth']
)
ON CONFLICT DO NOTHING;
