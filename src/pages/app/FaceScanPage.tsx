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
  CheckCircle2,
  MessageSquare,
  Zap,
  Sun,
  Scan,
  Info,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useInvokeAI } from '@/hooks/useInvokeAI'
import { hasPaidAiQuota, getFeatureCreditCost } from '@/utils/subscriptionHelpers'
import CoinConfirmModal from '@/components/ui/CoinConfirmModal'
import { validateImageQuality, compressImageForAI } from '@/utils/imageQualityValidator'
import { detectHumanFace, disposeFaceLandmarker } from '@/utils/faceLandmarkDetector'
import { Button, Badge, BottomSheet } from '@/components/ui'

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

const FACE_SCAN_STAGES_TEXT = [
  'Tahap 1/3: Memverifikasi kelayakan foto & orientasi wajah…',
  'Tahap 2/3: Memetakan 3 zona wajah klinis (Dahi, T-Zone & Pipi, Dagu)…',
  'Tahap 3/3: Menganalisis aktivitas sebum, pori-pori & integritas barrier…',
  'Tahap 3/3: Menyelaraskan profil kulit & menyusun rekomendasi hero actives…',
]

const CLINICAL_FACIAL_TIPS = [
  'Zona T (Dahi & Hidung) memiliki konsentrasi kelenjar sebasea tertinggi, sehingga paling cepat memproduksi kilap sebum alami.',
  'Pori-pori tidak memiliki otot untuk membuka atau menutup; penumpukan sel kulit mati dan sebumlah yang membuatnya tampak membesar.',
  'Kombinasi BHA (Salicylic Acid) dan Niacinamide bekerja sinergis: BHA membersihkan pori dari dalam, Niacinamide mengontrol sebum dan memperkuat barrier.',
  'Kulit area perioral (sekitar mulut & dagu) sangat responsif terhadap fluktuasi hormon dan hidrasi harian.',
  'Skin barrier yang optimal mampu mengunci kadar air alami (TEWL rendah) dan melindungi kulit dari mikro-inflamasi polusi.',
]

function getClinicalSeverityBand(score: number): {
  band: 'optimal' | 'mild_attention' | 'needs_attention' | 'consult_dermatologist'
  label: string
  descriptor: string
  ringVariant: 'optimal' | 'good' | 'attention' | 'alert'
  badgeVariant: 'optimal' | 'attention' | 'alert'
} {
  if (score >= 85) {
    return {
      band: 'optimal',
      label: 'Optimal',
      descriptor: 'Kondisi skin barrier terpantau prima. Pertahankan rutinitas pembersihan lembut dan hidrasi harianmu.',
      ringVariant: 'optimal',
      badgeVariant: 'optimal',
    }
  }
  if (score >= 70) {
    return {
      band: 'mild_attention',
      label: 'Perhatian Ringan',
      descriptor: 'Kondisi kulit cukup baik, dengan catatan kecil pada produksi sebum atau tekstur pori yang bisa dioptimalkan.',
      ringVariant: 'good',
      badgeVariant: 'optimal',
    }
  }
  if (score >= 55) {
    return {
      band: 'needs_attention',
      label: 'Perlu Perhatian',
      descriptor: 'Beberapa area memerlukan perawatan rutin yang lebih konsisten serta penguatan lapisan pelindung kulit.',
      ringVariant: 'attention',
      badgeVariant: 'attention',
    }
  }
  return {
    band: 'consult_dermatologist',
    label: 'Konsultasi Spesialis Disarankan',
    descriptor: 'Hasil pemetaan menunjukkan kondisi yang sebaiknya ditinjau langsung oleh dokter spesialis kulit. AI Skincluv adalah panduan kosmetik harian, bukan diagnosis medis.',
    ringVariant: 'alert',
    badgeVariant: 'alert',
  }
}

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
  const [showGuidelineSheet, setShowGuidelineSheet] = useState(false)

  // Stage 2 Scanning HUD States
  const [scanTextIndex, setScanTextIndex] = useState(0)
  const [tipIndex, setTipIndex] = useState(0)

  // Analysis Results & Interactive Selectors
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [selectedAreaId, setSelectedAreaId] = useState<string>('area_forehead')

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

        // Sync with Supabase tables
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

  // Smooth scroll to top on result stage
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

  const activeArea =
    analysisResult?.area_evaluations?.find((a) => a.id === selectedAreaId) ||
    analysisResult?.area_evaluations?.[0] ||
    null

  const heroIngredients: RecommendedIngredient[] =
    analysisResult?.recommended_ingredients && analysisResult.recommended_ingredients.length > 0
      ? analysisResult.recommended_ingredients
      : (analysisResult?.product_recommendations || []).map((p) => ({
          name: p.product_name.replace(/^Kandungan yang cocok:\s*/i, ''),
          purpose: p.why_recommended,
          priority: (p.priority as any) || 'recommended',
        }))

  const severityBand = getClinicalSeverityBand(analysisResult?.overall_score ?? 80)
  const currentScore = analysisResult?.overall_score ?? 80

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

      {/* Page Header (Extracted outside bento, visible across all viewports) */}
      <div className="cluv-flex-row cluv-justify-between cluv-items-center cluv-flex-wrap cluv-gap-3 cluv-mb-4">
        <div>
          <h1 className="cluv-title-section cluv-m-0 cluv-flex-row cluv-items-center cluv-gap-2">
            Face Scanner
          </h1>
          <p className="cluv-subtitle cluv-mt-1 cluv-m-0">
            Ketahui kondisi kulitmu & cari cara perawatannya
          </p>
        </div>
        <div className="cluv-hide-mobile">
          <Button variant="outline" size="sm" iconLeft={<History size={15} />} to="/scan-history">
            Riwayat Scan
          </Button>
        </div>
      </div>

      {/* Alert Error Box */}
      {errorMsg && (
        <div className="cluv-alert is-danger cluv-mb-4">
          <AlertCircle size={18} className="shrink-0" />
          <span className="cluv-body">{errorMsg}</span>
        </div>
      )}

      {/* =========================================================================
       * STAGE 1: CLEAN FOCUSED SHUTTER & GUIDELINES (Anti-Slop Unified)
       * ========================================================================= */}
      {stage === 'upload' && (
        <div className="cluv-bento-grid is-hero">
          {/* Main Shutter Card */}
          <div className="cluv-card cluv-gap-4">
            {previewUrl ? (
              /* Selected Photo Preview */
              <div className="cluv-flex-col cluv-items-center cluv-gap-3 cluv-w-full cluv-py-2">
                <div className="cluv-biometric-frame" style={{ width: '220px', height: '270px' }}>
                  <img src={previewUrl} alt="Preview Foto Wajah" className="cluv-biometric-img" />
                  <div className="cluv-biometric-badge">
                    <span>Foto Siap Dianalisis</span>
                  </div>
                </div>

                <div className="cluv-flex-row cluv-items-center cluv-gap-2">
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
              /* Unified Clean Media Upload Box with Info Guide Icon in Top-Right */
              <div
                className={`cluv-dropzone ${isDragging ? 'is-dragging' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                tabIndex={0}
                role="button"
                aria-label="Pilih foto wajah dari galeri atau kamera"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click()
                }}
              >
                {/* Panduan Foto Guide Button (Top-Right inside box) */}
                <button
                  type="button"
                  className="cluv-dropzone-guide-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowGuidelineSheet(true)
                  }}
                  aria-label="Panduan Kualitas Foto"
                  title="Panduan Kualitas Foto"
                >
                  <Info size={19} />
                </button>

                <div className="cluv-dropzone-icon">
                  <ImageIcon size={26} />
                </div>
                <span className="cluv-body cluv-font-bold cluv-text-dark">
                  Pilih Foto Wajah dari Galeri
                </span>
                <span className="cluv-caption cluv-text-muted">
                  Format JPG, PNG, atau WEBP maks 5MB
                </span>
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
                    <span className="cluv-caption">
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
                Analisa Sekarang
              </Button>

              {/* Invariant 19 Non-Therapeutic Privacy & Credit Notice (Compact Notice Box) */}
              <div className="cluv-alert is-info is-compact cluv-gap-2">
                <Info size={16} className="cluv-alert-icon shrink-0" />
                <div className="cluv-micro">
                  Biaya <strong>{faceCost} Credits AI</strong> per analisis. Foto dianalisis secara privat & hasil observasi bersifat panduan edukasi mandiri 🔒
                </div>
              </div>
            </div>

            {/* Right Column: Context Information (Desktop Only; on mobile accessed via BottomSheet) */}
            <div className="cluv-flex-col cluv-gap-4 cluv-hide-mobile">
              {/* Active Skin Profile */}
              <div className="cluv-card is-highlight cluv-gap-2">
                <span className="cluv-caption cluv-font-bold cluv-text-teal cluv-uppercase">Profil Kulit Aktif</span>
                <div className="cluv-flex-row cluv-justify-between cluv-items-center cluv-mt-1">
                  <span className="cluv-body cluv-text-muted">Tipe Kulit:</span>
                  <span className="cluv-body cluv-font-bold cluv-text-dark">{userSkinType}</span>
                </div>
                <div className="cluv-flex-col cluv-gap-1 cluv-mt-2">
                  <span className="cluv-caption cluv-text-muted">Fokus Perhatian:</span>
                  <div className="cluv-flex-row cluv-flex-wrap cluv-gap-1 cluv-mt-1">
                    {userConcerns.map((concern: string, idx: number) => (
                      <Badge key={idx} variant="slate" size="sm">
                        {concern}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pre-photo Checklist */}
              <div className="cluv-card cluv-gap-3">
                <h3 className="cluv-title-card cluv-m-0">Panduan Foto Optimal</h3>
                <div className="cluv-flex-col cluv-gap-3 cluv-mt-2">
                  <div className="cluv-flex-row cluv-gap-3 cluv-items-start">
                    <Sun size={18} className="text-amber-500 shrink-0 cluv-mt-1" />
                    <div>
                      <strong className="cluv-body cluv-text-dark">Cahaya alami merata</strong>
                      <p className="cluv-caption cluv-text-muted cluv-m-0 cluv-mt-1">
                        Pencahayaan terang dari depan membantu AI membaca tekstur pori secara akurat.
                      </p>
                    </div>
                  </div>

                  <div className="cluv-flex-row cluv-gap-3 cluv-items-start">
                    <Sparkles size={18} className="text-teal-600 shrink-0 cluv-mt-1" />
                    <div>
                      <strong className="cluv-body cluv-text-dark">Wajah bersih tanpa makeup</strong>
                      <p className="cluv-caption cluv-text-muted cluv-m-0 cluv-mt-1">
                        Ambil foto setelah membersihkan wajah agar kondisi sebum alami terlihat jelas.
                      </p>
                    </div>
                  </div>

                  <div className="cluv-flex-row cluv-gap-3 cluv-items-start">
                    <Scan size={18} className="text-slate-600 shrink-0 cluv-mt-1" />
                    <div>
                      <strong className="cluv-body cluv-text-dark">Jarak wajah sekitar 30 cm</strong>
                      <p className="cluv-caption cluv-text-muted cluv-m-0 cluv-mt-1">
                        Pastikan dahi, kedua pipi, hidung, dan dagu berada tepat di dalam bingkai foto.
                      </p>
                    </div>
                  </div>
                </div>
            </div>
          </div>
        </div>
      )}


      {/* =========================================================================
       * STAGE 2: NEURAL AI FACIAL SCANNER HUD (Responsive & Calm)
       * ========================================================================= */}
      {stage === 'scanning' && (
        <div className="cluv-card cluv-items-center cluv-py-8 cluv-gap-4">
          <div className="cluv-scanner-hud">
            {previewUrl ? (
              <img src={previewUrl} alt="Foto Wajah" className="cluv-scanner-preview-img" />
            ) : (
              <div className="cluv-caption cluv-text-muted">Foto Wajah Pengguna</div>
            )}

            <div className="cluv-scanner-grid-overlay" />
            <div className="cluv-scanner-corner top-left" />
            <div className="cluv-scanner-corner top-right" />
            <div className="cluv-scanner-corner bottom-left" />
            <div className="cluv-scanner-corner bottom-right" />
            <div className="cluv-scanner-laser" />

            <div className="cluv-scanner-status-pill">
              <span className="cluv-scanner-status-dot" />
              <span>PEMINDAIAN AI AKTIF</span>
            </div>
          </div>

          <div className="cluv-flex-row cluv-items-center cluv-justify-center cluv-gap-2 cluv-mt-2">
            <span className="cluv-font-bold cluv-text-teal cluv-body">{FACE_SCAN_STAGES_TEXT[scanTextIndex]}</span>
          </div>

          <div className="cluv-scanner-progress-track">
            <div className="cluv-scanner-progress-glow" />
          </div>

          <div className="cluv-card is-highlight cluv-p-4 cluv-max-w-md cluv-w-full cluv-mt-2">
            <span className="cluv-caption cluv-font-bold cluv-text-teal">Catatan Edukasi Kondisi Kulit</span>
            <p className="cluv-caption cluv-text-muted cluv-m-0 cluv-mt-1">{CLINICAL_FACIAL_TIPS[tipIndex]}</p>
          </div>
        </div>
      )}

      {/* =========================================================================
       * STAGE 3: EDITORIAL RESULTS (Anti-Slop, Score Ring SVG, 100% Data Parity)
       * ========================================================================= */}
      {stage === 'result' && analysisResult && (
        <div className="cluv-flex-col cluv-gap-5">
          {/* Provenance Cache Banner (RFC 011) */}
          {analysisResult.cached && (
            <div className="cluv-alert is-info cluv-gap-3">
              <Zap size={20} className="shrink-0 text-sky-600" />
              <div className="cluv-flex-1">
                <h4 className="cluv-font-bold cluv-text-dark cluv-m-0 cluv-body">
                  Hasil Tersimpan Ditampilkan — 0 Kuota Terpotong
                </h4>
                <p className="cluv-caption cluv-text-muted cluv-m-0 cluv-mt-1">
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
                <h4 className="cluv-font-bold cluv-text-dark cluv-m-0 cluv-body">
                  Anjuran Konsultasi Spesialis Kulit
                </h4>
                <p className="cluv-caption cluv-text-muted cluv-m-0 cluv-mt-1">
                  Hasil evaluasi visual menunjukkan beberapa kondisi kulit yang disarankan untuk ditinjau langsung oleh dokter spesialis kulit. AI Skincluv adalah alat bantu panduan kosmetik harian, bukan instrumen diagnosis medis.
                </p>
              </div>
            </div>
          )}

          {/* 1. HERO OBSERVATION CARD (Editorial Clean, SVG Score Ring Canonical) */}
          <section className="cluv-card cluv-p-6">
            <div className="cluv-flex-row cluv-items-start cluv-gap-5 cluv-flex-wrap">
              {/* Canonical SVG Score Ring */}
              <div className="cluv-score-ring is-lg cluv-flex-shrink-0" aria-label={`Skor Kulit ${currentScore} dari 100`}>
                <svg className="cluv-score-svg" viewBox="0 0 80 80">
                  <circle className="cluv-score-bg-circle" cx="40" cy="40" r="34" strokeWidth="6" />
                  <circle
                    className={`cluv-score-fg-circle is-${severityBand.ringVariant}`}
                    cx="40"
                    cy="40"
                    r="34"
                    strokeWidth="6"
                    strokeDasharray={213.6}
                    strokeDashoffset={213.6 - (213.6 * Math.min(Math.max(currentScore, 0), 100)) / 100}
                  />
                </svg>
                <div className="cluv-score-center">
                  <span className="cluv-score-val">{currentScore}</span>
                  <span className="cluv-score-max">/100</span>
                </div>
              </div>

              {/* Observation Narrative & Badges */}
              <div className="cluv-flex-1 cluv-min-w-0">
                <div className="cluv-flex-row cluv-gap-2 cluv-items-center cluv-flex-wrap cluv-mb-2">
                  <Badge variant={severityBand.badgeVariant} size="sm">
                    {severityBand.label}
                  </Badge>
                  <span className="cluv-badge is-slate is-sm">
                    Tipe: {String(analysisResult.skin_type || userSkinType).toUpperCase()}
                  </span>
                  <span className="cluv-badge is-teal is-sm">
                    Observasi Visual AI
                  </span>
                </div>

                <h2 className="cluv-title-section cluv-m-0" style={{ fontSize: '1.35rem' }}>
                  {analysisResult.skin_status_title ?? `Kondisi Kulit: ${severityBand.label}`}
                </h2>

                <p className="cluv-body cluv-mt-3 cluv-m-0" style={{ lineHeight: '1.65', color: 'var(--cluv-neutral-700)' }}>
                  “{analysisResult.analysis_notes || severityBand.descriptor}”
                </p>

                {/* Skin Concerns Tags */}
                {analysisResult.skin_concerns && analysisResult.skin_concerns.length > 0 && (
                  <div className="cluv-flex-row cluv-flex-wrap cluv-gap-1 cluv-mt-3">
                    {analysisResult.skin_concerns.map((concern: string, idx: number) => (
                      <span key={idx} className="cluv-badge is-slate is-sm">
                        {CONCERN_LABELS[concern] || concern}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Face Snapshot Thumbnail */}
              {previewUrl && (
                <div className="cluv-biometric-frame cluv-hide-mobile" style={{ width: '90px', height: '115px' }}>
                  <img src={previewUrl} alt="Foto Teranalisis" className="cluv-biometric-img" />
                  <div className="cluv-biometric-badge" style={{ fontSize: '0.55rem' }}>
                    <span>Terverifikasi</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 2. INTERACTIVE 3-ZONE EVALUATION (Hairline Separation, No Card Soup) */}
          <section className="cluv-card cluv-gap-4">
            <div>
              <h3 className="cluv-title-card cluv-m-0">Evaluasi Kondisi Per Area Wajah</h3>
              <p className="cluv-caption cluv-text-muted cluv-mt-1 cluv-m-0">
                Pilih area untuk melihat temuan biologis dan rencana perawatannya
              </p>
            </div>

            {/* Segmented Controller Chips */}
            <div className="cluv-chip-group">
              {analysisResult.area_evaluations?.map((area) => {
                const isSelected = activeArea?.id === area.id
                const cleanName = area.area_name.split(' (')[0]
                return (
                  <button
                    type="button"
                    key={area.id}
                    className={`cluv-chip cluv-flex-1 cluv-justify-center ${isSelected ? 'is-active' : ''}`}
                    onClick={() => setSelectedAreaId(area.id)}
                  >
                    <span>{cleanName}</span>
                    <span className="cluv-caption cluv-font-bold">({area.score})</span>
                  </button>
                )
              })}
            </div>

            {/* Selected Area Content (Clean Editorial Boxes) */}
            {activeArea && (
              <div className="cluv-flex-col cluv-gap-3 cluv-mt-1 cluv-animate-fade">
                <div className="cluv-flex-row cluv-justify-between cluv-items-center">
                  <h4 className="cluv-title-card cluv-m-0" style={{ fontSize: '1.05rem' }}>
                    {activeArea.area_name}
                  </h4>
                  <Badge variant={activeArea.status === 'Optimal' ? 'teal' : 'gold'} size="sm">
                    {activeArea.status} ({activeArea.score}/100)
                  </Badge>
                </div>

                <div className="cluv-area-box">
                  <span className="cluv-caption cluv-font-bold cluv-text-teal">Hasil Observasi:</span>
                  <p className="cluv-body cluv-m-0 cluv-mt-1">{activeArea.finding}</p>
                </div>

                <div className="cluv-area-box is-analogy">
                  <span className="cluv-caption cluv-font-bold cluv-text-gold">Penjelasan Sederhana:</span>
                  <p className="cluv-body cluv-m-0 cluv-mt-1">{activeArea.analogy}</p>
                </div>

                <div className="cluv-area-box is-action">
                  <span className="cluv-caption cluv-font-bold cluv-text-teal">Rencana Tindakan:</span>
                  <p className="cluv-body cluv-m-0 cluv-mt-1">{activeArea.action_plan}</p>
                </div>
              </div>
            )}
          </section>

          {/* 3. HERO ACTIVE INGREDIENTS (Formulasi Kosmetik) */}
          <section className="cluv-card cluv-gap-4">
            <div>
              <span className="cluv-caption cluv-font-bold cluv-text-gold cluv-uppercase">Formulasi Kosmetik Target</span>
              <h3 className="cluv-title-card cluv-mt-1 cluv-m-0">Hero Actives yang Cocok untuk Kulitmu</h3>
              <p className="cluv-caption cluv-text-muted cluv-mt-1 cluv-m-0">
                Kandungan bahan aktif kosmetik yang relevan untuk mendukung perawatan kulit berdasarkan hasil foto.
              </p>
            </div>

            <div className="cluv-grid cols-2 cluv-gap-3">
              {heroIngredients.map((item, idx) => {
                const isEssential = item.priority === 'essential'
                const cleanName = item.name.replace(/^Kandungan yang cocok:\s*/i, '').trim()
                const searchKeyword = `serum ${cleanName}`

                return (
                  <div key={idx} className="cluv-active-item">
                    <div className="cluv-active-item-header">
                      <h4 className="cluv-title-card cluv-m-0" style={{ fontSize: '0.95rem' }}>{cleanName}</h4>
                      <Badge variant={isEssential ? 'teal' : 'slate'} size="sm">
                        {isEssential ? 'Prioritas Utama' : 'Pendukung'}
                      </Badge>
                    </div>

                    <p className="cluv-body cluv-text-muted cluv-m-0" style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
                      {item.purpose}
                    </p>

                    <span className="cluv-caption cluv-text-muted" style={{ fontStyle: 'italic', fontSize: '0.75rem' }}>
                      Bahan kosmetik, bukan obat — hasil bervariasi tiap orang.
                    </span>

                    <div className="cluv-flex-row cluv-gap-2 cluv-mt-2 cluv-flex-wrap">
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
                        Tanya Pakai
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* 4. DAILY ROUTINE & HABITS GUIDE (Do, Reduce, Avoid) */}
          <section className="cluv-card cluv-gap-4">
            <div>
              <h3 className="cluv-title-card cluv-m-0">Panduan Kebiasaan & Gaya Hidup Kulit</h3>
              <p className="cluv-caption cluv-text-muted cluv-mt-1 cluv-m-0">
                Langkah praktis harian untuk menjaga stabilitas lapisan pelindung kulit
              </p>
            </div>

            <div className="cluv-tips-grid">
              {/* DO */}
              <div className="cluv-tip-card is-do">
                <h4 className="cluv-font-bold cluv-text-teal cluv-m-0 cluv-body">
                  Rutin Lakukan
                </h4>
                <ul className="cluv-list-disc cluv-pl-4 cluv-body cluv-text-muted cluv-m-0 cluv-space-y-1" style={{ fontSize: '0.875rem' }}>
                  {analysisResult.tips_do?.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>

              {/* REDUCE */}
              <div className="cluv-tip-card is-reduce">
                <h4 className="cluv-font-bold cluv-text-gold cluv-m-0 cluv-body">
                  Kurangi
                </h4>
                <ul className="cluv-list-disc cluv-pl-4 cluv-body cluv-text-muted cluv-m-0 cluv-space-y-1" style={{ fontSize: '0.875rem' }}>
                  {analysisResult.tips_reduce?.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>

              {/* AVOID */}
              <div className="cluv-tip-card is-avoid">
                <h4 className="cluv-font-bold cluv-text-rose cluv-m-0 cluv-body">
                  Hindari
                </h4>
                <ul className="cluv-list-disc cluv-pl-4 cluv-body cluv-text-muted cluv-m-0 cluv-space-y-1" style={{ fontSize: '0.875rem' }}>
                  {analysisResult.tips_avoid?.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* 5. BOTTOM ACTION BAR (Thumb-Friendly) */}
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

      {/* Mobile Bottom Sheet: Photo Quality Checklist & Context */}
      <BottomSheet
        isOpen={showGuidelineSheet}
        onClose={() => setShowGuidelineSheet(false)}
        title="Panduan Kualitas Foto Wajah"
        subtitle="Observasi kosmetik akurat tanpa filter & distorsi"
      >
        <div className="cluv-flex-col cluv-gap-4">
          <div className="cluv-flex-col cluv-gap-3">
            <div className="cluv-flex-row cluv-gap-3 cluv-items-start">
              <Sun size={18} className="text-amber-500 shrink-0 cluv-mt-1" />
              <div>
                <strong className="cluv-body cluv-text-dark">Cahaya alami merata</strong>
                <p className="cluv-caption cluv-text-muted cluv-m-0 cluv-mt-1">
                  Pencahayaan terang dari depan membantu AI membaca tekstur pori secara akurat. Hindari backlight atau ruangan redup.
                </p>
              </div>
            </div>

            <div className="cluv-flex-row cluv-gap-3 cluv-items-start">
              <Sparkles size={18} className="text-teal-600 shrink-0 cluv-mt-1" />
              <div>
                <strong className="cluv-body cluv-text-dark">Wajah bersih tanpa riasan tebal</strong>
                <p className="cluv-caption cluv-text-muted cluv-m-0 cluv-mt-1">
                  Ambil foto setelah mencuci muka agar kondisi skin barrier dan sebum alami terbaca objektif.
                </p>
              </div>
            </div>

            <div className="cluv-flex-row cluv-gap-3 cluv-items-start">
              <Scan size={18} className="text-slate-600 shrink-0 cluv-mt-1" />
              <div>
                <strong className="cluv-body cluv-text-dark">Jarak tegak lurus ~30 cm</strong>
                <p className="cluv-caption cluv-text-muted cluv-m-0 cluv-mt-1">
                  Pastikan dahi, kedua pipi, hidung, dan dagu berada tepat di dalam lingkaran frame foto tanpa tertutup rambut/masker.
                </p>
              </div>
            </div>
          </div>

          <div className="cluv-card is-highlight cluv-p-3 cluv-mt-2">
            <span className="cluv-caption cluv-font-bold cluv-text-teal">Profil Kulit Terdaftar:</span>
            <p className="cluv-caption cluv-text-muted cluv-m-0 cluv-mt-1">
              Tipe <strong>{userSkinType}</strong> dengan fokus perhatian pada {userConcerns.join(', ')}.
            </p>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
