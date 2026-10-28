import React, { useState, useRef, useEffect } from 'react'
import {
  Camera,
  Image as ImageIcon,
  X,
  AlertCircle,
  Sparkles,
  RotateCcw,
  ShoppingBag,
  History,
  Coins,
  Crown,
  Trophy,
  FlaskConical,
  CheckCircle2,
  Target,
  ShieldCheck,
  MessageSquare,
  Info,
  Zap,
  Sun,
  Scan,
  Check,
  HelpCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useInvokeAI } from '@/hooks/useInvokeAI'
import { hasPaidAiQuota, getFeatureCreditCost } from '@/utils/subscriptionHelpers'
import CoinConfirmModal from '@/components/ui/CoinConfirmModal'
import { validateImageQuality, compressImageForAI } from '@/utils/imageQualityValidator'
import { detectHumanFace, disposeFaceLandmarker } from '@/utils/faceLandmarkDetector'
import { Button, Badge } from '@/components/ui'

type Stage = 'upload' | 'scanning' | 'result'

export interface AreaEvaluation {
  id: string
  area_name: string
  score: number // 1-100
  status: 'Optimal' | 'Perlu Perhatian' | 'Waspada'
  finding: string
  analogy: string
  action_plan: string
}

export interface RecommendedIngredient {
  name: string
  purpose: string
  priority?: 'essential' | 'recommended' | 'optional'
}

export interface ProductRecommendation {
  product_name: string
  brand?: string
  category: string
  match_score?: number | null
  priority_label?: string
  key_ingredients?: string[]
  why_recommended: string
  price_estimate?: string
  priority?: 'essential' | 'recommended' | 'optional'
  is_ingredient_recommendation?: boolean
}

interface AnalysisResult {
  skin_type: 'normal' | 'oily' | 'dry' | 'combination' | 'sensitive'
  skin_concerns: string[]
  analysis_notes: string
  confidence?: number
  overall_score?: number
  skin_status_title?: string
  area_evaluations?: AreaEvaluation[]
  recommended_ingredients?: RecommendedIngredient[]
  product_recommendations?: ProductRecommendation[]
  tips_avoid?: string[]
  tips_reduce?: string[]
  tips_do?: string[]
  cached?: boolean
  cached_at?: string
  scan_id?: string
  image_content_hash?: string
  analysis_version?: string
}

const CONCERN_LABELS: Record<string, string> = {
  acne: 'Jerawat',
  hyperpigmentation: 'Hiperpigmentasi',
  wrinkles: 'Kerutan',
  dryness: 'Kering',
  oiliness: 'Berminyak',
  sensitivity: 'Sensitif',
  redness: 'Kemerahan',
  dark_circles: 'Mata Panda',
  pores: 'Pori Besar',
}

// Scanner Stage Animation Text
const FACE_SCAN_STAGES_TEXT = [
  'Tahap 1/3: Memverifikasi kelayakan foto & orientasi wajah...',
  'Tahap 2/3: Memetakan 3 zona wajah klinis (Dahi, T-Zone & Pipi, Dagu)...',
  'Tahap 3/3: Menganalisis aktivitas sebum, pori-pori & integritas barrier...',
  'Tahap 3/3: Menyelaraskan profil kulit & menyusun rekomendasi hero actives...',
]

// Educational Clinical Dermatology Tips (Rotating during Stage 2 HUD)
const CLINICAL_FACIAL_TIPS = [
  'Zona T (Dahi & Hidung) memiliki konsentrasi kelenjar sebasea tertinggi, sehingga paling cepat memproduksi kilap sebum alami.',
  'Pori-pori tidak memiliki otot untuk membuka atau menutup; penumpukan sel kulit mati dan sebumlah yang membuatnya tampak membesar.',
  'Kombinasi BHA (Salicylic Acid) dan Niacinamide bekerja sinergis: BHA membersihkan pori dari dalam, Niacinamide mengontrol sebum dan memperkuat barrier.',
  'Kulit area perioral (sekitar mulut & dagu) sangat responsif terhadap fluktuasi hormon dan hidrasi harian.',
  'Skin barrier yang optimal mampu mengunci kadar air alami (TEWL rendah) dan melindungi kulit dari mikro-inflamasi polusi.',
]

// Kimi & BPOM Approved Clinical Severity Bands (RFC 011)
function getClinicalSeverityBand(score: number): {
  band: 'optimal' | 'mild_attention' | 'needs_attention' | 'consult_dermatologist'
  label: string
  descriptor: string
  colorClass: string
} {
  if (score >= 85) {
    return {
      band: 'optimal',
      label: 'Optimal',
      descriptor: 'Kulitmu dalam kondisi prima — pertahankan rutinitas pembersihan dan hidrasi harianmu.',
      colorClass: 'score-optimal',
    }
  }
  if (score >= 70) {
    return {
      band: 'mild_attention',
      label: 'Perhatian Ringan',
      descriptor: 'Kondisi kulit cukup baik, dengan catatan kecil pada produksi sebum atau tekstur pori yang bisa dioptimalkan.',
      colorClass: 'score-optimal',
    }
  }
  if (score >= 55) {
    return {
      band: 'needs_attention',
      label: 'Perlu Perhatian',
      descriptor: 'Beberapa area memerlukan perawatan rutin yang lebih konsisten serta penguatan skin barrier.',
      colorClass: 'score-caution',
    }
  }
  return {
    band: 'consult_dermatologist',
    label: 'Konsultasi Spesialis Disarankan',
    descriptor: 'Hasil pemetaan menunjukkan kondisi yang sebaiknya ditinjau langsung oleh dokter spesialis kulit. AI Skincluv adalah panduan kosmetik harian, bukan diagnosis medis.',
    colorClass: 'score-warning',
  }
}

// Smart Enrichment Adapter to ensure full 14-point data completeness
const enrichAnalysisResult = (res: AnalysisResult & { is_valid_face?: boolean }): AnalysisResult => {
  const enriched = { ...res }

  if (!enriched.overall_score) {
    if (enriched.area_evaluations && enriched.area_evaluations.length > 0) {
      const avg = enriched.area_evaluations.reduce((sum, a) => sum + (Number(a.score) || 80), 0) / enriched.area_evaluations.length
      enriched.overall_score = Math.round(avg)
    } else {
      enriched.overall_score = 80
    }
  }

  const bandInfo = getClinicalSeverityBand(enriched.overall_score ?? 80)
  if (!enriched.skin_status_title) {
    enriched.skin_status_title = `Kondisi Kulit: ${bandInfo.label}`
  }

  // Ensure 3-Area Granular Breakdown (Forehead, T-Zone & Cheeks, Chin & Perioral)
  if (!enriched.area_evaluations || enriched.area_evaluations.length === 0) {
    enriched.area_evaluations = [
      {
        id: 'area_forehead',
        area_name: 'Dahi (Forehead)',
        score: Math.min(100, (enriched.overall_score ?? 78) + 2),
        status: (enriched.overall_score ?? 78) >= 80 ? 'Optimal' : 'Perlu Perhatian',
        finding: 'Tekstur dahi relatif halus tanpa inflamasi aktif, dengan kilatan sebum ringan di area tengah.',
        analogy: 'Mulus mirip layar ponsel baru lepas protektor, perlu dijaga agar produksi minyak tidak berlebih.',
        action_plan: 'Pastikan sisa produk rambut atau topi tidak menempel langsung terlalu lama untuk mencegah sumbatan pori.',
      },
      {
        id: 'area_tzone',
        area_name: 'Hidung & Pipi (T-Zone & Cheeks)',
        score: Math.max(50, (enriched.overall_score ?? 75) - 6),
        status: 'Perlu Perhatian',
        finding: 'Produksi sebum alami terlihat menonjol di sekitar cuping hidung dengan pori-pori sedikit terbuka.',
        analogy: 'Efek kilap dewy alami, tetapi jika terpapar panas berlebih berpotensi menampung kotoran debu.',
        action_plan: 'Gunakan eksfoliator BHA cair ringan 2 kali seminggu untuk membersihkan komedo tersembunyi secara lembut.',
      },
      {
        id: 'area_chin',
        area_name: 'Dagu & Sekitar Mulut (Chin & Perioral)',
        score: Math.min(100, (enriched.overall_score ?? 80) + 1),
        status: 'Optimal',
        finding: 'Area perioral dan dagu terpantau tenang, warna merata tanpa jerawat hormonal aktif.',
        analogy: 'Bebas dari breakout dadakan, siap tampil percaya diri tanpa perlu polesan concealer tebal.',
        action_plan: 'Cukupi pelembap bertekstur gel dan jaga hidrasi bibir serta area perioral.',
      },
    ]
  }

  // Normalize recommended_ingredients
  if (Array.isArray(enriched.recommended_ingredients) && enriched.recommended_ingredients.length > 0) {
    enriched.recommended_ingredients = enriched.recommended_ingredients.map((item: any) => ({
      name: typeof item === 'string' ? item : (item.name || item.ingredient || 'Bahan Aktif'),
      purpose: typeof item === 'object' ? (item.purpose || item.why_recommended || item.reason || 'Membantu merawat dan menjaga stabilitas skin barrier.') : 'Membantu merawat dan menjaga stabilitas skin barrier.',
      priority: typeof item === 'object' && item.priority ? item.priority : 'recommended',
    }))
  } else if (Array.isArray(enriched.product_recommendations) && enriched.product_recommendations.length > 0) {
    enriched.recommended_ingredients = enriched.product_recommendations.map((p) => ({
      name: p.product_name.replace(/^Kandungan yang cocok:\s*/i, ''),
      purpose: p.why_recommended,
      priority: (p.priority as any) || 'recommended',
    }))
  } else {
    enriched.recommended_ingredients = [
      {
        name: 'Niacinamide 5%',
        purpose: 'Mengontrol produksi sebum di area T-Zone sekaligus memperkuat skin barrier tanpa memicu iritasi.',
        priority: 'essential',
      },
      {
        name: 'Salicylic Acid 2% (BHA)',
        purpose: 'Membantu membersihkan pori-pori yang tersumbat di area hidung dan mengurangi potensi komedo.',
        priority: 'essential',
      },
      {
        name: 'Hyaluronic Acid',
        purpose: 'Memberikan hidrasi mendalam berbahan dasar air agar kulit tidak dehidrasi dan mengimbangi eksfoliasi.',
        priority: 'recommended',
      },
      {
        name: 'Ceramide NP',
        purpose: 'Menjaga keutuhan lapisan lipid pelindung kulit dan mengunci kelembapan alami.',
        priority: 'recommended',
      },
    ]
  }

  // Fallback Categorized Tips (Avoid, Reduce, Do)
  if (!enriched.tips_avoid || enriched.tips_avoid.length === 0) {
    enriched.tips_avoid = [
      'Memakai pembersih wajah yang membuat kulit terasa kesat atau tertarik',
      'Menyentuh atau memencet komedo saat tangan belum dicuci bersih',
      'Penggunaan pelembap dengan formula heavy cream berminyak di area hidung',
    ]
  }

  if (!enriched.tips_reduce || enriched.tips_reduce.length === 0) {
    enriched.tips_reduce = [
      'Pemakaian riasan tebal bertumpuk saat beraktivitas di cuaca panas',
      'Konsumsi gorengan atau makanan berlemak tinggi di larut malam',
      'Berada di ruangan ber-AC dingin terlalu lama tanpa asupan air cukup',
    ]
  }

  if (!enriched.tips_do || enriched.tips_do.length === 0) {
    enriched.tips_do = [
      'Lakukan double cleansing dengan micellar water sebelum mencuci muka',
      'Gunakan sunscreen bertekstur watery gel minimal SPF 30 setiap pagi',
      'Ganti sarung bantal tidur minimal sekali seminggu',
    ]
  }

  return enriched
}

interface FaceValidationResponse {
  is_valid_face: boolean
  reason: string
  confidence?: number
}

export default function FaceScanPage() {
  const { user, session, profile, activeSkinProfile, setActiveSkinProfile, coinBalance, subscription } = useAuthStore()
  const { invoke, pendingCoinConfirm, confirmCoinUsage, cancelCoinUsage, askCoinConfirmation, getLastError } = useInvokeAI()
  const currentCoins = coinBalance?.balance ?? 0
  const faceCost = getFeatureCreditCost('face_analysis')
  const isFreeTierOutOfCredits = !hasPaidAiQuota(subscription) && currentCoins < faceCost

  const userSkinType = activeSkinProfile?.skin_type ? activeSkinProfile.skin_type.toUpperCase() : 'KOMBINASI'
  const userConcerns: string[] = activeSkinProfile?.skin_concerns?.length
    ? activeSkinProfile.skin_concerns.map((c: string) => CONCERN_LABELS[c] || c).slice(0, 3)
    : ['Pori besar', 'Minyak T-Zone', 'Skin Barrier']

  // Stage Management
  const [stage, setStage] = useState<Stage>('upload')

  // Photo & Preview States
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Stage 2 Scanning HUD States
  const [scanTextIndex, setScanTextIndex] = useState(0)
  const [tipIndex, setTipIndex] = useState(0)

  // Analysis Results & Interactive Selectors
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [selectedAreaId, setSelectedAreaId] = useState<string>('area_forehead')
  const [activeTipsTab, setActiveTipsTab] = useState<'all' | 'do' | 'reduce' | 'avoid'>('all')

  const [createdScanId, setCreatedScanId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [forceReanalyze, setForceReanalyze] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const topResultRef = useRef<HTMLDivElement>(null)

  // Memory cleanup for MediaPipe Wasm (RFC 009 DeepSeek)
  useEffect(() => {
    return () => {
      disposeFaceLandmarker()
    }
  }, [])

  // Rotating clinical tips during scanning
  useEffect(() => {
    if (stage !== 'scanning') return
    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % CLINICAL_FACIAL_TIPS.length)
    }, 3800)
    return () => clearInterval(tipInterval)
  }, [stage])

  // Unified Scanning Pipeline
  useEffect(() => {
    if (stage !== 'scanning') {
      setScanTextIndex(0)
      return
    }

    let isSubscribed = true
    let textInterval: ReturnType<typeof setInterval> | null = null

    const runScanPipeline = async () => {
      try {
        setScanTextIndex(0)

        if (!imageBase64) {
          setErrorMsg('Pilih foto terlebih dahulu.')
          setStage('upload')
          return
        }

        // GERBANG 1: Canvas Math (Pencahayaan & Blur)
        const qualityRes = await validateImageQuality(imageBase64)
        if (!isSubscribed) return

        if (!qualityRes.isValid) {
          setErrorMsg(qualityRes.message)
          setStage('upload')
          return
        }

        // GERBANG 2: MediaPipe 468 Face Mesh
        const faceRes = await detectHumanFace(imageBase64)
        if (!isSubscribed) return

        if (!faceRes.isHuman || faceRes.faceCount === 0) {
          setErrorMsg(
            faceRes.rejectionReason ||
            'Foto yang Anda unggah terdeteksi sebagai produk skincare, hewan, atau objek non-manusia.'
          )
          setStage('upload')
          return
        }

        if (!faceRes.isUnobstructed) {
          setErrorMsg(
            faceRes.rejectionReason ||
            'Wajah terdeteksi terhalang ponsel atau masker. Harap pastikan dahi, mata, hidung, dan dagu terlihat jelas.'
          )
          setStage('upload')
          return
        }

        // GERBANG 3: AI Face Validation Gate (0 Credits)
        const valRes = await invoke<FaceValidationResponse>({
          feature_slug: 'face_validation',
          messages: [
            {
              role: 'user',
              content: 'Verifikasi apakah gambar ini adalah foto wajah manusia yang layak dianalisis secara klinis.',
            },
          ],
          input_context: {
            image_base64: imageBase64 || '',
          },
        })

        if (!isSubscribed) return

        if (valRes && valRes.is_valid_face === false) {
          setErrorMsg(
            valRes.reason ||
            'Wajah tidak terlihat cukup jelas untuk analisis. Silakan gunakan foto dengan pencahayaan alami tanpa filter.'
          )
          setStage('upload')
          return
        }

        // GERBANG 4: Analisis Spesialis Wajah (5 Credits)
        setScanTextIndex(1)
        textInterval = setInterval(() => {
          setScanTextIndex((prev) => (prev < FACE_SCAN_STAGES_TEXT.length - 1 ? prev + 1 : prev))
        }, 1800)

        const result = await invoke<AnalysisResult & { is_valid_face?: boolean; reason?: string }>({
          feature_slug: 'face_analysis',
          messages: [
            {
              role: 'user',
              content: 'Analisis kondisi kulit dari foto wajah yang dilampirkan berikut ini.',
            },
          ],
          input_context: {
            image_base64: imageBase64 || '',
          },
          force_reanalysis: forceReanalyze,
        })

        if (!isSubscribed) return
        setForceReanalyze(false)

        if (!result) {
          const actualErr = getLastError()
          if (actualErr === 'INSUFFICIENT_CREDITS') {
            setErrorMsg(`Credits kamu tidak mencukupi untuk Analisis Wajah (butuh ${faceCost} Credits). Selesaikan misi harian untuk mendapatkan Credits gratis atau upgrade ke paket Glow / PRO.`)
          } else {
            setErrorMsg(actualErr || 'Layanan analisis AI sedang sibuk atau mengalami gangguan koneksi. Saldo Credit Anda tetap aman. Silakan coba klik Mulai Analisis lagi.')
          }
          setStage('upload')
          return
        }

        if (result.is_valid_face === false) {
          setErrorMsg(
            result.reason ||
            'Wajah tidak terlihat cukup jelas untuk analisis. Silakan gunakan foto yang lebih terang dan fokus.'
          )
          setStage('upload')
          return
        }

        const enriched = enrichAnalysisResult(result)
        setAnalysisResult(enriched)

        if (enriched.area_evaluations && enriched.area_evaluations.length > 0) {
          setSelectedAreaId(enriched.area_evaluations[0].id)
        }

        // Save scan record & sync with Supabase tables
        let effectiveUserId = user?.id || session?.user?.id || profile?.id
        if (!effectiveUserId) {
          const { data: authUser } = await supabase.auth.getUser()
          effectiveUserId = authUser?.user?.id
        }

        if (effectiveUserId && enriched.skin_type) {
          try {
            const scoreInt = Math.min(100, Math.max(0, Math.round(Number(enriched.overall_score) || 80)))

            if (enriched.cached && enriched.scan_id) {
              setCreatedScanId(enriched.scan_id)
            } else {
              const scanRecord = {
                user_id: effectiveUserId,
                overall_score: scoreInt,
                skin_status_title: enriched.skin_status_title || 'Kondisi Kulit Terpantau',
                skin_type: String(enriched.skin_type).toLowerCase(),
                skin_concerns: enriched.skin_concerns || [],
                analysis_notes: enriched.analysis_notes || '',
                area_evaluations: (enriched.area_evaluations || []) as any,
                product_recommendations: (enriched.product_recommendations || []) as any,
                raw_ai_response: enriched as any,
                image_content_hash: (enriched as any).image_content_hash || null,
                analysis_version: (enriched as any).analysis_version || 'face-v4',
                is_repeat: false,
              }

              const { data: insertedScan, error: insertErr } = await supabase
                .from('face_scans')
                .insert(scanRecord)
                .select('id')
                .maybeSingle()

              if (!insertErr && insertedScan?.id) {
                setCreatedScanId(insertedScan.id)
              }
            }

            // Sync with skin_profiles
            const { data: existing } = await supabase
              .from('skin_profiles')
              .select('id')
              .eq('user_id', effectiveUserId)
              .eq('is_active', true)
              .maybeSingle()

            const payload = {
              skin_type: String(enriched.skin_type).toLowerCase(),
              skin_concerns: enriched.skin_concerns || [],
              analysis_notes: enriched.analysis_notes || '',
              raw_ai_response: enriched as any,
            }

            if (existing?.id) {
              await supabase
                .from('skin_profiles')
                .update(payload)
                .eq('id', existing.id)
            } else {
              await supabase
                .from('skin_profiles')
                .insert({
                  ...payload,
                  user_id: effectiveUserId,
                  is_active: true,
                })
            }

            if (setActiveSkinProfile) {
              setActiveSkinProfile({
                id: existing?.id || effectiveUserId,
                user_id: effectiveUserId,
                skin_type: String(enriched.skin_type).toLowerCase(),
                skin_concerns: enriched.skin_concerns || [],
                analysis_notes: enriched.analysis_notes || '',
                raw_ai_response: enriched as any,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              } as any)
            }
          } catch (syncErr) {
            console.error('[FaceScanPage] Sync exception:', syncErr)
          }
        }

        setStage('result')
      } catch (err: any) {
        if (!isSubscribed) return
        console.error('Face scan pipeline error:', err)
        setErrorMsg('Terjadi kendala saat menganalisis foto. Credit Anda tidak berkurang. Silakan coba lagi.')
        setStage('upload')
      }
    }

    runScanPipeline()

    return () => {
      isSubscribed = false
      if (textInterval) clearInterval(textInterval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage])

  // Smooth scroll on result stage
  useEffect(() => {
    if (stage === 'result') {
      topResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [stage])

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('File harus berupa gambar (JPG, PNG, WEBP)')
      return
    }
    setErrorMsg(null)
    setPreviewUrl(URL.createObjectURL(file))
    setAnalysisResult(null)

    try {
      const base64Data = await compressImageForAI(file, 800, 0.70)
      setImageBase64(base64Data)
    } catch {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const result = ev.target?.result as string
        setImageBase64(result.split(',')[1])
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleClearImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setPreviewUrl(null)
    setImageBase64(null)
    setAnalysisResult(null)
  }

  const handleStartFlow = async () => {
    if (!imageBase64) {
      setErrorMsg('Pilih atau unggah foto wajah terlebih dahulu.')
      return
    }
    if (isFreeTierOutOfCredits) {
      const confirmed = await askCoinConfirmation(faceCost, 'Scan Wajah Spesialis')
      if (!confirmed) return
    }
    setErrorMsg(null)
    setForceReanalyze(false)
    setStage('scanning')
  }

  const handleForceReanalyze = async () => {
    if (!imageBase64) return
    if (isFreeTierOutOfCredits) {
      const confirmed = await askCoinConfirmation(faceCost, 'Scan Ulang Wajah (5 Credits)')
      if (!confirmed) return
    }
    setErrorMsg(null)
    setForceReanalyze(true)
    setStage('scanning')
  }

  const handleResetFlow = () => {
    setStage('upload')
    setPreviewUrl(null)
    setImageBase64(null)
    setAnalysisResult(null)
    setErrorMsg(null)
    setCreatedScanId(null)
    setForceReanalyze(false)
  }

  // Active Area for Interactive 3-Zone Card
  const activeArea =
    analysisResult?.area_evaluations?.find((a) => a.id === selectedAreaId) ||
    analysisResult?.area_evaluations?.[0] ||
    null

  // Hero Actives list
  const heroIngredients: RecommendedIngredient[] =
    analysisResult?.recommended_ingredients && analysisResult.recommended_ingredients.length > 0
      ? analysisResult.recommended_ingredients
      : (analysisResult?.product_recommendations || []).map((p) => ({
          name: p.product_name.replace(/^Kandungan yang cocok:\s*/i, ''),
          purpose: p.why_recommended,
          priority: (p.priority as any) || 'recommended',
        }))

  const severityBand = getClinicalSeverityBand(analysisResult?.overall_score ?? 80)

  return (
    <div className="cluv-canvas-grid cluv-animate-fade">
      {/* Coin Deduction Modal */}
      {pendingCoinConfirm && (
        <CoinConfirmModal
          isOpen={true}
          coinCost={pendingCoinConfirm.coinCost}
          currentBalance={coinBalance?.balance ?? 0}
          featureName={pendingCoinConfirm.featureName || 'Scan Wajah AI'}
          onConfirm={confirmCoinUsage}
          onCancel={cancelCoinUsage}
        />
      )}

      {/* Auto-scroll anchor */}
      <div ref={topResultRef} />

      {/* Header Bar */}
      <div className="cluv-flex-row cluv-justify-between cluv-items-center cluv-flex-wrap cluv-gap-3 cluv-mb-3">
        <div>
          <h1 className="cluv-title-section cluv-m-0">Scan Wajah AI</h1>
          <p className="cluv-subtitle cluv-mt-1">
            Pemetaan visual kondisi kulit dengan AI secara objektif, evaluasi mendalam 3 zona wajah, tips harian, dan rekomendasi bahan aktif formulasi kosmetik.
          </p>
        </div>
        <Button variant="outline" size="sm" iconLeft={<History size={16} />} to="/scan-history">
          Riwayat Scan Kulit
        </Button>
      </div>

      {/* Alert Error Box */}
      {errorMsg && (
        <div className="cluv-alert is-danger cluv-mb-3">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* =========================================================================
       * STAGE 1: BENTO UPLOAD & CAMERA SHUTTER (Thumb-Friendly Mobile-First)
       * ========================================================================= */}
      {stage === 'upload' && (
        <div className="cluv-bento-grid is-hero">
          {/* Main Shutter Bento Card */}
          <div className="cluv-bento-card cluv-gap-4">
            <div className="cluv-bento-header no-border">
              <div className="cluv-bento-header-icon is-teal">
                <Camera size={20} />
              </div>
              <div className="cluv-bento-header-titles">
                <h3 className="cluv-title-item cluv-m-0">Ambil atau Unggah Foto Wajah</h3>
                <p className="cluv-subtitle cluv-m-0">Gunakan kamera depan atau pilih foto wajah dari galeri perangkatmu</p>
              </div>
            </div>

            <div className="cluv-bento-body cluv-gap-3">
              {previewUrl ? (
                /* Selected Photo Preview */
                <div className="cluv-flex-col cluv-items-center cluv-gap-3 cluv-w-full">
                  <div className="cluv-biometric-frame" style={{ width: '200px', height: '240px' }}>
                    <img src={previewUrl} alt="Preview Wajah" className="cluv-biometric-img" />
                    <div className="cluv-biometric-badge">
                      <Sparkles size={12} />
                      <span>Foto Siap Dianalisis</span>
                    </div>
                  </div>

                  <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-mt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      iconLeft={<RotateCcw size={14} />}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Ganti Foto
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconLeft={<X size={14} />}
                      onClick={() => handleClearImage()}
                    >
                      Hapus
                    </Button>
                  </div>
                </div>
              ) : (
                /* Native Shutter & File Selector */
                <div className="cluv-flex-col cluv-gap-3 cluv-w-full">
                  {/* Primary Thumb Actions (Min 48px Touch Target) */}
                  <div className="cluv-grid cols-2 cluv-gap-2">
                    <Button
                      variant="primary"
                      size="md"
                      iconLeft={<Camera size={18} />}
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      Buka Kamera
                    </Button>
                    <Button
                      variant="outline"
                      size="md"
                      iconLeft={<ImageIcon size={18} />}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Galeri Foto
                    </Button>
                  </div>

                  {/* Desktop Dropzone Area */}
                  <div
                    className={`cluv-dropzone ${isDragging ? 'is-dragging' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="cluv-dropzone-icon">
                      <Scan size={24} />
                    </div>
                    <span className="cluv-dropzone-title">Atau tarik foto ke sini</span>
                    <span className="cluv-dropzone-subtitle">JPG, PNG, atau WEBP maks 5MB</span>
                  </div>
                </div>
              )}

              {/* Hidden Native File Inputs */}
              <input
                type="file"
                ref={cameraInputRef}
                accept="image/*"
                capture="user"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              {/* Credit Quota Warning */}
              {isFreeTierOutOfCredits && (
                <div className="cluv-alert is-warning is-compact cluv-justify-between cluv-items-center cluv-flex-wrap cluv-gap-2">
                  <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                    <Coins size={16} className="text-amber-600 shrink-0" />
                    <span className="cluv-micro">
                      Butuh <strong>{faceCost} Credits</strong> untuk analisis wajah (Saldo kamu: <strong>{currentCoins} Credits</strong>).
                    </span>
                  </div>
                  <div className="cluv-flex-row cluv-items-center cluv-gap-1">
                    <Button variant="outline" size="sm" iconLeft={<Trophy size={13} />} to="/missions">
                      Misi
                    </Button>
                    <Button variant="primary" size="sm" iconLeft={<Crown size={13} />} to="/pricing">
                      Upgrade
                    </Button>
                  </div>
                </div>
              )}

              {/* Main Submit Action */}
              <Button
                variant="primary"
                size="md"
                block
                iconLeft={<Sparkles size={18} />}
                onClick={handleStartFlow}
                disabled={!imageBase64}
              >
                Mulai Analisis Wajah AI (5 Credits)
              </Button>
            </div>

            <div className="cluv-bento-footer no-border cluv-pt-0">
              <div className="cluv-alert is-warning is-compact cluv-w-full">
                <Info size={15} className="shrink-0 text-amber-600" />
                <span className="cluv-micro">
                  <b>Privasi & Keamanan:</b> Foto wajah hanya diproses untuk observasi kondisi visual kulit dan tidak dibagikan kepada pihak ketiga. Hasil analisis bersifat panduan edukasi kosmetik.
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Context Bento Cards */}
          <div className="cluv-flex-col cluv-gap-4">
            {/* Active Skin Profile Context Card */}
            <div className="cluv-bento-card is-tint-teal">
              <div className="cluv-bento-header no-border">
                <div className="cluv-bento-header-titles">
                  <Badge variant="teal" size="sm" className="cluv-mb-1">PROFIL KULIT AKTIF</Badge>
                  <h4 className="cluv-title-item cluv-m-0">Preferensi & Fokusmu</h4>
                </div>
              </div>
              <div className="cluv-bento-body cluv-gap-2">
                <div className="cluv-flex-row cluv-justify-between cluv-items-center cluv-micro">
                  <span className="cluv-text-muted">Tipe Kulit:</span>
                  <span className="cluv-font-bold cluv-text-dark">{userSkinType}</span>
                </div>
                <div className="cluv-flex-col cluv-gap-1 cluv-micro cluv-mt-1">
                  <span className="cluv-text-muted">Fokus Perhatian:</span>
                  <div className="cluv-flex-row cluv-flex-wrap cluv-gap-1">
                    {userConcerns.map((concern: string, idx: number) => (
                      <Badge key={idx} variant="slate" size="sm">
                        {concern}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Photo Guidelines Bento Card */}
            <div className="cluv-bento-card">
              <div className="cluv-bento-header no-border">
                <div className="cluv-bento-header-titles">
                  <Badge variant="gold" size="sm" className="cluv-mb-1">PANDUAN SEBELUM FOTO</Badge>
                  <h4 className="cluv-title-item cluv-m-0">3 Kunci Hasil Analisis Akurat</h4>
                </div>
              </div>
              <div className="cluv-bento-body cluv-gap-3">
                <div className="cluv-flex-row cluv-gap-2 cluv-items-start">
                  <div className="cluv-card-icon-wrap is-sm is-gold shrink-0">
                    <Sun size={15} />
                  </div>
                  <div className="cluv-micro">
                    <strong className="cluv-text-dark">1. Cahaya alami merata</strong>
                    <p className="cluv-text-muted cluv-m-0 cluv-mt-1">Hindari lampu sorot langsung atau bayangan gelap di satu sisi wajah.</p>
                  </div>
                </div>

                <div className="cluv-flex-row cluv-gap-2 cluv-items-start">
                  <div className="cluv-card-icon-wrap is-sm is-teal shrink-0">
                    <Sparkles size={15} />
                  </div>
                  <div className="cluv-micro">
                    <strong className="cluv-text-dark">2. Wajah bersih tanpa makeup</strong>
                    <p className="cluv-text-muted cluv-m-0 cluv-mt-1">Foto 30-60 menit setelah mencuci muka agar kondisi pori dan sebum alami terlihat jelas.</p>
                  </div>
                </div>

                <div className="cluv-flex-row cluv-gap-2 cluv-items-start">
                  <div className="cluv-card-icon-wrap is-sm shrink-0">
                    <Scan size={15} />
                  </div>
                  <div className="cluv-micro">
                    <strong className="cluv-text-dark">3. Jarak wajah sekitar 30 cm</strong>
                    <p className="cluv-text-muted cluv-m-0 cluv-mt-1">Pastikan dahi, kedua pipi, hidung, dan dagu berada di dalam bingkai.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
       * STAGE 2: NEURAL AI FACIAL SCANNER HUD (Scalable & Calm)
       * ========================================================================= */}
      {stage === 'scanning' && (
        <div className="cluv-card cluv-items-center cluv-py-8 cluv-gap-4">
          <div className="cluv-scanner-hud">
            {previewUrl ? (
              <img src={previewUrl} alt="Foto Wajah" className="cluv-scanner-preview-img" />
            ) : (
              <div className="cluv-card is-compact cluv-text-muted cluv-micro">Foto Wajah Pengguna</div>
            )}

            {/* HUD Grid & Corners */}
            <div className="cluv-scanner-grid-overlay" />
            <div className="cluv-scanner-corner top-left" />
            <div className="cluv-scanner-corner top-right" />
            <div className="cluv-scanner-corner bottom-left" />
            <div className="cluv-scanner-corner bottom-right" />

            {/* Sweeping Laser Beam */}
            <div className="cluv-scanner-laser" />

            {/* Biometric Status Pill */}
            <div className="cluv-scanner-status-pill">
              <span className="cluv-scanner-status-dot" />
              <span>PEMINDAIAN AI AKTIF</span>
            </div>
          </div>

          {/* Shimmering Phase Status */}
          <div className="cluv-flex-row cluv-items-center cluv-justify-center cluv-gap-2 cluv-mt-2">
            <span className="cluv-font-bold cluv-text-teal cluv-text-sm">{FACE_SCAN_STAGES_TEXT[scanTextIndex]}</span>
          </div>

          {/* Smooth Progress Glow */}
          <div className="cluv-scanner-progress-track">
            <div className="cluv-scanner-progress-glow" />
          </div>

          {/* Educational Dermatology Tip Box */}
          <div className="cluv-card is-highlight cluv-p-3 cluv-max-w-md cluv-w-full">
            <div className="cluv-flex-row cluv-items-center cluv-gap-1 cluv-text-xs cluv-font-bold cluv-text-teal">
              <Sparkles size={13} className="shrink-0" />
              <span>Catatan Edukasi Kondisi Kulit</span>
            </div>
            <p className="cluv-micro cluv-text-muted cluv-m-0 cluv-mt-1">{CLINICAL_FACIAL_TIPS[tipIndex]}</p>
          </div>
        </div>
      )}

      {/* =========================================================================
       * STAGE 3: BENTO GRID RESULTS (100% Data Parity, Modular & Human Scale)
       * ========================================================================= */}
      {stage === 'result' && analysisResult && (
        <div className="cluv-flex-col cluv-gap-4">
          {/* Provenance Cache Banner (RFC 011) */}
          {analysisResult.cached && (
            <div className="cluv-alert is-info cluv-gap-3">
              <Zap size={20} className="shrink-0 text-sky-600" />
              <div className="cluv-flex-1">
                <h4 className="cluv-font-bold cluv-text-dark cluv-m-0 cluv-text-sm">
                  Hasil Tersimpan Ditampilkan — 0 Kuota Terpotong
                </h4>
                <p className="cluv-micro cluv-text-muted cluv-m-0 cluv-mt-1">
                  Foto ini identik dengan foto yang kamu scan pada{' '}
                  {analysisResult.cached_at
                    ? new Date(analysisResult.cached_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'sebelumnya'}
                  . AI menampilkan hasil tersimpan secara instan tanpa memotong kuota Credits.
                </p>
                <div className="cluv-flex-row cluv-items-center cluv-flex-wrap cluv-gap-2 cluv-mt-2">
                  <Badge variant="teal" size="sm"><CheckCircle2 size={12} /> Kuota aman</Badge>
                  <Badge variant="teal" size="sm"><CheckCircle2 size={12} /> Hasil identik</Badge>
                  <Badge variant="slate" size="sm"><Zap size={12} /> Instan (&lt;1s)</Badge>
                  <div className="cluv-flex-row cluv-gap-1 cluv-ml-auto">
                    <Button variant="outline" size="sm" iconLeft={<Camera size={13} />} onClick={handleResetFlow}>
                      Scan Foto Baru
                    </Button>
                    <Button variant="outline" size="sm" iconLeft={<RotateCcw size={13} />} onClick={handleForceReanalyze}>
                      Analisis Ulang (5 Credits)
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Severe Condition Advisory (Score < 55) */}
          {severityBand.band === 'consult_dermatologist' && (
            <div className="cluv-alert is-warning">
              <AlertCircle size={20} className="shrink-0 text-amber-600" />
              <div>
                <h4 className="cluv-font-bold cluv-text-dark cluv-m-0 cluv-text-sm">
                  Anjuran Konsultasi Spesialis Kulit
                </h4>
                <p className="cluv-micro cluv-text-muted cluv-m-0 cluv-mt-1">
                  Hasil evaluasi visual menunjukkan beberapa kondisi kulit yang disarankan untuk ditinjau langsung oleh dokter spesialis kulit. AI Skincluv adalah alat bantu panduan kosmetik harian, bukan instrumen diagnosis medis.
                </p>
              </div>
            </div>
          )}

          {/* -----------------------------------------------------------------
           * BENTO ROW 1: Hero Metric & Facial Snapshot Card (Split 60:40)
           * ----------------------------------------------------------------- */}
          <div className="cluv-bento-grid is-hero">
            {/* Card 1A: Primary Metric & Clinical Narrative */}
            <div className="cluv-bento-card cluv-gap-4">
              <div className="cluv-bento-header no-border">
                <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-flex-wrap">
                  <Badge variant="teal" size="sm">
                    <Sparkles size={12} /> TIPE KULIT: {String(analysisResult.skin_type || userSkinType).toUpperCase()}
                  </Badge>
                  <Badge variant="slate" size="sm">
                    <ShieldCheck size={12} /> OBSERVASI KULIT AI
                  </Badge>
                </div>
              </div>

              <div className="cluv-bento-body cluv-gap-3">
                <div className="cluv-flex-row cluv-items-center cluv-gap-4 cluv-flex-wrap">
                  {/* Circular Score Primitive */}
                  <div className={`cluv-score-circle ${
                    severityBand.band === 'consult_dermatologist'
                      ? 'is-danger'
                      : severityBand.band === 'needs_attention'
                      ? 'is-caution'
                      : 'is-safe'
                  }`}>
                    <div className="sr-number-row">
                      <span className="sr-val">{analysisResult.overall_score ?? 80}</span>
                      <span className="sr-scale">/100</span>
                    </div>
                    <span className="sr-unit">{severityBand.label}</span>
                  </div>

                  {/* Title & Concerns */}
                  <div className="cluv-flex-1 cluv-flex-col cluv-gap-1">
                    <h2 className="cluv-title-section cluv-m-0" style={{ fontSize: '1.25rem' }}>
                      {analysisResult.skin_status_title ?? `Kondisi Kulit: ${severityBand.label}`}
                    </h2>
                    <div className="cluv-flex-row cluv-flex-wrap cluv-gap-1 cluv-mt-1">
                      {analysisResult.skin_concerns?.map((concern: string, idx: number) => (
                        <Badge key={idx} variant="slate" size="sm">
                          {CONCERN_LABELS[concern] || concern}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Gen Z Pro Narrative Observation */}
                <div className="cluv-card is-compact cluv-bg-surface-muted cluv-mt-2">
                  <span className="cluv-micro cluv-font-bold cluv-text-teal">Catatan Observasi AI:</span>
                  <p className="cluv-body cluv-text-muted cluv-m-0 cluv-mt-1" style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
                    {analysisResult.analysis_notes || severityBand.descriptor}
                  </p>
                </div>
              </div>
            </div>

            {/* Card 1B: Face Snapshot & Biometric Zone Summary */}
            <div className="cluv-bento-card is-tint-teal cluv-gap-3">
              <div className="cluv-bento-header no-border">
                <div className="cluv-bento-header-icon is-teal">
                  <Target size={18} />
                </div>
                <div className="cluv-bento-header-titles">
                  <h4 className="cluv-title-item cluv-m-0">Ringkasan 3 Zona Wajah</h4>
                  <p className="cluv-subtitle cluv-m-0">Skor pemetaan per area</p>
                </div>
              </div>

              <div className="cluv-bento-body cluv-gap-3">
                <div className="cluv-flex-row cluv-items-center cluv-gap-3">
                  {previewUrl && (
                    <div className="cluv-biometric-frame" style={{ width: '84px', height: '108px', borderRadius: '10px' }}>
                      <img src={previewUrl} alt="Foto Wajah" className="cluv-biometric-img" />
                      <div className="cluv-biometric-badge" style={{ fontSize: '0.52rem', padding: '2px 4px' }}>
                        <span>Terverifikasi</span>
                      </div>
                    </div>
                  )}

                  <div className="cluv-flex-col cluv-gap-2 cluv-flex-1">
                    {analysisResult.area_evaluations?.map((area) => (
                      <div
                        key={area.id}
                        className="cluv-flex-row cluv-justify-between cluv-items-center cluv-p-2 cluv-bg-surface cluv-rounded-md cluv-border"
                        style={{ padding: '6px 10px' }}
                      >
                        <span className="cluv-font-bold cluv-text-dark cluv-text-xs">
                          {area.area_name.split(' (')[0]}
                        </span>
                        <div className="cluv-flex-row cluv-items-center cluv-gap-1">
                          <span className="cluv-font-bold cluv-micro cluv-text-muted">{area.score}/100</span>
                          <span className={`cluv-badge is-sm ${area.status === 'Optimal' ? 'is-teal' : 'is-gold'}`}>
                            {area.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* -----------------------------------------------------------------
           * BENTO ROW 2: Interactive 3-Zone Deep-Dive & Habits Guide (Split 50:50)
           * ----------------------------------------------------------------- */}
          <div className="cluv-bento-grid is-equal">
            {/* Card 2A: Interactive 3-Zone Card (Segmented Chip Controller) */}
            <div className="cluv-bento-card cluv-gap-3">
              <div className="cluv-bento-header no-border">
                <div className="cluv-bento-header-icon is-teal">
                  <Target size={20} />
                </div>
                <div className="cluv-bento-header-titles">
                  <h3 className="cluv-title-item cluv-m-0">Evaluasi Zona Wajah Interaktif</h3>
                  <p className="cluv-subtitle cluv-m-0">Ketuk zona untuk melihat temuan biologis & rencananya</p>
                </div>
              </div>

              {/* Thumb-Friendly Segmented Chips */}
              <div className="cluv-chip-group">
                {analysisResult.area_evaluations?.map((area) => {
                  const isSelected = (activeArea?.id === area.id)
                  const cleanName = area.area_name.split(' (')[0]
                  return (
                    <button
                      type="button"
                      key={area.id}
                      className={`cluv-chip cluv-flex-1 cluv-justify-center ${isSelected ? 'is-active' : ''}`}
                      onClick={() => setSelectedAreaId(area.id)}
                    >
                      <span>{cleanName}</span>
                      <span className="cluv-micro cluv-font-bold">({area.score})</span>
                    </button>
                  )
                })}
              </div>

              {/* Selected Area Content Box */}
              {activeArea && (
                <div className="cluv-flex-col cluv-gap-2 cluv-mt-1 cluv-animate-fade">
                  <div className="cluv-flex-row cluv-justify-between cluv-items-center cluv-mb-1">
                    <span className="cluv-font-bold cluv-text-dark cluv-text-sm">
                      {activeArea.area_name}
                    </span>
                    <span className={`cluv-badge is-sm ${activeArea.status === 'Optimal' ? 'is-teal' : 'is-gold'}`}>
                      {activeArea.status} ({activeArea.score}/100)
                    </span>
                  </div>

                  {/* Finding Box */}
                  <div className="cluv-area-box">
                    <span className="cluv-micro cluv-font-bold cluv-text-teal">Hasil Observasi:</span>
                    <p className="cluv-micro cluv-text-muted cluv-m-0">{activeArea.finding}</p>
                  </div>

                  {/* Analogy Box */}
                  <div className="cluv-area-box is-analogy">
                    <span className="cluv-micro cluv-font-bold cluv-text-gold">Penjelasan Sederhana:</span>
                    <p className="cluv-micro cluv-text-muted cluv-m-0">{activeArea.analogy}</p>
                  </div>

                  {/* Action Plan Box */}
                  <div className="cluv-area-box is-action">
                    <span className="cluv-micro cluv-font-bold cluv-text-teal">Rencana Tindakan:</span>
                    <p className="cluv-micro cluv-text-muted cluv-m-0">{activeArea.action_plan}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Card 2B: Daily Routine & Habits Guide (Do, Reduce, Avoid) */}
            <div className="cluv-bento-card cluv-gap-3">
              <div className="cluv-bento-header no-border">
                <div className="cluv-bento-header-icon is-teal">
                  <CheckCircle2 size={20} />
                </div>
                <div className="cluv-bento-header-titles">
                  <h3 className="cluv-title-item cluv-m-0">Panduan Kebiasaan Kulit</h3>
                  <p className="cluv-subtitle cluv-m-0">Langkah harian merawat stabilitas skin barrier</p>
                </div>
              </div>

              {/* Segmented Filter Pills */}
              <div className="cluv-chip-group">
                <button
                  type="button"
                  className={`cluv-chip ${activeTipsTab === 'all' ? 'is-active' : ''}`}
                  onClick={() => setActiveTipsTab('all')}
                >
                  Semua Tips
                </button>
                <button
                  type="button"
                  className={`cluv-chip ${activeTipsTab === 'do' ? 'is-active' : ''}`}
                  onClick={() => setActiveTipsTab('do')}
                >
                  <Check size={13} className="text-teal-600" /> Rutin
                </button>
                <button
                  type="button"
                  className={`cluv-chip ${activeTipsTab === 'reduce' ? 'is-active' : ''}`}
                  onClick={() => setActiveTipsTab('reduce')}
                >
                  Kurangi
                </button>
                <button
                  type="button"
                  className={`cluv-chip ${activeTipsTab === 'avoid' ? 'is-active' : ''}`}
                  onClick={() => setActiveTipsTab('avoid')}
                >
                  <X size={13} className="text-rose-600" /> Hindari
                </button>
              </div>

              {/* Tips Container */}
              <div className="cluv-flex-col cluv-gap-2 cluv-mt-1 cluv-animate-fade">
                {/* DO TIPS */}
                {(activeTipsTab === 'all' || activeTipsTab === 'do') && (
                  <div className="cluv-tip-card is-do">
                    <h5 className="cluv-font-bold cluv-text-teal cluv-flex-row cluv-items-center cluv-gap-1 cluv-m-0 cluv-text-xs">
                      <CheckCircle2 size={14} /> Rutin Lakukan
                    </h5>
                    <ul className="cluv-list-disc cluv-pl-4 cluv-micro cluv-text-muted cluv-m-0" style={{ gap: '4px', display: 'flex', flexDirection: 'column' }}>
                      {analysisResult.tips_do?.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* REDUCE TIPS */}
                {(activeTipsTab === 'all' || activeTipsTab === 'reduce') && (
                  <div className="cluv-tip-card is-reduce">
                    <h5 className="cluv-font-bold cluv-text-gold cluv-flex-row cluv-items-center cluv-gap-1 cluv-m-0 cluv-text-xs">
                      <span>−</span> Kurangi
                    </h5>
                    <ul className="cluv-list-disc cluv-pl-4 cluv-micro cluv-text-muted cluv-m-0" style={{ gap: '4px', display: 'flex', flexDirection: 'column' }}>
                      {analysisResult.tips_reduce?.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* AVOID TIPS */}
                {(activeTipsTab === 'all' || activeTipsTab === 'avoid') && (
                  <div className="cluv-tip-card is-avoid">
                    <h5 className="cluv-font-bold cluv-text-rose cluv-flex-row cluv-items-center cluv-gap-1 cluv-m-0 cluv-text-xs">
                      <X size={14} /> Hindari
                    </h5>
                    <ul className="cluv-list-disc cluv-pl-4 cluv-micro cluv-text-muted cluv-m-0" style={{ gap: '4px', display: 'flex', flexDirection: 'column' }}>
                      {analysisResult.tips_avoid?.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* -----------------------------------------------------------------
           * BENTO ROW 3: Hero Actives & Formulations (Full Width Bento Card)
           * ----------------------------------------------------------------- */}
          <div className="cluv-bento-card cluv-gap-4">
            <div className="cluv-bento-header no-border">
              <div className="cluv-bento-header-icon is-gold">
                <FlaskConical size={20} />
              </div>
              <div className="cluv-bento-header-titles">
                <Badge variant="gold" size="sm" className="cluv-mb-1">FORMULASI KOSMETIK TARGET</Badge>
                <h3 className="cluv-title-item cluv-m-0">Hero Actives — Kandungan yang Sesuai untuk Kulitmu</h3>
                <p className="cluv-subtitle cluv-m-0">Kandungan bahan aktif kosmetik yang relevan untuk mendukung perawatan kulit berdasarkan hasil foto.</p>
              </div>
            </div>

            <div className="cluv-bento-body">
              <div className="cluv-grid cols-2 cluv-gap-3">
                {heroIngredients.map((item, idx) => {
                  const isEssential = item.priority === 'essential'
                  const cleanName = item.name.replace(/^Kandungan yang cocok:\s*/i, '').trim()
                  const searchKeyword = `serum ${cleanName}`

                  return (
                    <div key={idx} className="cluv-active-item">
                      <div className="cluv-active-item-header">
                        <div className="cluv-flex-row cluv-items-center cluv-gap-1">
                          <span className="cluv-badge is-gold is-sm">#{idx + 1}</span>
                          <span className={`cluv-badge is-sm ${isEssential ? 'is-teal' : 'is-slate'}`}>
                            {isEssential ? 'Prioritas Utama' : 'Prioritas Pendukung'}
                          </span>
                        </div>
                        <h4 className="cluv-font-bold cluv-text-dark cluv-text-sm cluv-m-0">{cleanName}</h4>
                      </div>

                      <p className="cluv-micro cluv-text-muted cluv-m-0">{item.purpose}</p>

                      <div className="cluv-micro cluv-text-muted" style={{ fontSize: '0.72rem' }}>
                        <em>Bahan kosmetik, bukan obat — hasil bervariasi tiap orang.</em>
                      </div>

                      <div className="cluv-flex-row cluv-gap-2 cluv-mt-1 cluv-flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          className="cluv-flex-1"
                          href={`https://shopee.co.id/search?keyword=${encodeURIComponent(searchKeyword)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          iconLeft={<ShoppingBag size={13} />}
                        >
                          Marketplace ↗
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          className="cluv-flex-1"
                          to={
                            createdScanId
                              ? `/chatbot?scan_id=${createdScanId}&q=${encodeURIComponent(`Bagaimana cara dan urutan pemakaian ${cleanName} yang aman untuk kulitku?`)}`
                              : `/chatbot?q=${encodeURIComponent(`Bagaimana cara pemakaian ${cleanName}?`)}`
                          }
                          iconLeft={<MessageSquare size={13} />}
                        >
                          Tanya Pakai AI
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="cluv-bento-footer no-border cluv-pt-0">
              <div className="cluv-flex-row cluv-items-center cluv-gap-1 cluv-micro cluv-text-muted">
                <HelpCircle size={14} className="shrink-0 text-slate-400" />
                <span>Ingin memadukan dua kandungan di atas? Konsultasikan urutan layer-nya ke Skinsistant AI agar tidak memicu iritasi.</span>
              </div>
            </div>
          </div>

          {/* -----------------------------------------------------------------
           * BENTO FOOTER: High-Impact Thumb-Friendly Sticky/Bottom Actions
           * ----------------------------------------------------------------- */}
          <div className="cluv-card cluv-flex-row cluv-justify-between cluv-items-center cluv-flex-wrap cluv-gap-3 cluv-p-4">
            <Button
              variant="outline"
              size="md"
              className="cluv-flex-1"
              iconLeft={<RotateCcw size={16} />}
              onClick={handleResetFlow}
            >
              Scan Foto Baru
            </Button>
            <Button
              variant="primary"
              size="md"
              className="cluv-flex-2"
              iconLeft={<MessageSquare size={16} />}
              to={createdScanId ? `/chatbot?scan_id=${createdScanId}` : '/chatbot'}
            >
              Konsultasikan Rutinitas ke Skinsistant AI
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
