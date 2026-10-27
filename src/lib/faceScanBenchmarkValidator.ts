/**
 * Validator Evaluasi Golden Benchmark Scan Wajah (RFC 022)
 * Digunakan untuk menguji akurasi hasil pemindaian wajah terhadap ground truth acuan.
 */

export interface GoldenBenchmarkProfile {
  id: string
  name: string
  expectedValidFace: boolean
  minScore?: number
  maxScore?: number
  targetSkinType?: 'oily' | 'dry' | 'combination' | 'normal' | 'sensitive'
  requiredConcerns?: string[]
  forbiddenIngredients?: string[]
}

export const GOLDEN_BENCHMARK_PROFILES: Record<string, GoldenBenchmarkProfile> = {
  'GB-01': {
    id: 'GB-01',
    name: 'Severe Acne & Oily Skin',
    expectedValidFace: true,
    minScore: 45,
    maxScore: 65,
    targetSkinType: 'oily',
    requiredConcerns: ['acne', 'large_pores', 'excess_sebum'],
    forbiddenIngredients: ['mineral oil', 'heavy coconut oil', 'stearic acid'],
  },
  'GB-02': {
    id: 'GB-02',
    name: 'Dry & Compromised Barrier',
    expectedValidFace: true,
    minScore: 50,
    maxScore: 68,
    targetSkinType: 'dry',
    requiredConcerns: ['dryness', 'redness', 'barrier_compromised'],
    forbiddenIngredients: ['glycolic acid 10%', 'high bha', 'pure alcohol'],
  },
  'GB-03': {
    id: 'GB-03',
    name: 'Combination T-Zone',
    expectedValidFace: true,
    minScore: 68,
    maxScore: 82,
    targetSkinType: 'combination',
  },
  'GB-04': {
    id: 'GB-04',
    name: 'Clear / Optimal Skin',
    expectedValidFace: true,
    minScore: 85,
    maxScore: 96,
    targetSkinType: 'normal',
  },
  'GB-05': {
    id: 'GB-05',
    name: 'Negative Gatekeeper (Rejection)',
    expectedValidFace: false,
  },
}

export interface EvaluationResult {
  passed: boolean
  benchmarkId: string
  scorePassed: boolean
  skinTypePassed: boolean
  faceValidationPassed: boolean
  contraindicationsPassed: boolean
  reasons: string[]
}

export function evaluateFaceScanAgainstBenchmark(
  benchmarkId: string,
  actualResponse: any
): EvaluationResult {
  const profile = GOLDEN_BENCHMARK_PROFILES[benchmarkId]
  if (!profile) {
    return {
      passed: false,
      benchmarkId,
      scorePassed: false,
      skinTypePassed: false,
      faceValidationPassed: false,
      contraindicationsPassed: false,
      reasons: [`Benchmark ID "${benchmarkId}" tidak terdaftar dalam RFC 022.`],
    }
  }

  const reasons: string[] = []

  // 1. Verifikasi Validitas Biologis Wajah
  const faceValidationPassed =
    actualResponse?.is_valid_face === profile.expectedValidFace
  if (!faceValidationPassed) {
    reasons.push(
      `Ekspektasi is_valid_face=${profile.expectedValidFace}, namun hasil aktual is_valid_face=${actualResponse?.is_valid_face}.`
    )
  }

  // Jika memang profil penolakan (GB-05), stop evaluasi skor
  if (!profile.expectedValidFace) {
    return {
      passed: faceValidationPassed,
      benchmarkId,
      scorePassed: true,
      skinTypePassed: true,
      faceValidationPassed,
      contraindicationsPassed: true,
      reasons,
    }
  }

  // 2. Evaluasi Rentang Skor (Tolerance Window)
  const actualScore = Number(actualResponse?.overall_score ?? 0)
  const scorePassed =
    profile.minScore !== undefined && profile.maxScore !== undefined
      ? actualScore >= profile.minScore && actualScore <= profile.maxScore
      : true

  if (!scorePassed) {
    reasons.push(
      `Skor aktual ${actualScore} berada di luar rentang toleransi klinis [${profile.minScore} - ${profile.maxScore}].`
    )
  }

  // 3. Evaluasi Tipe Kulit
  const skinTypePassed =
    profile.targetSkinType !== undefined
      ? actualResponse?.skin_type === profile.targetSkinType
      : true

  if (!skinTypePassed) {
    reasons.push(
      `Tipe kulit aktual "${actualResponse?.skin_type}" tidak cocok dengan target acuan "${profile.targetSkinType}".`
    )
  }

  // 4. Evaluasi Bahan Terlarang / Kontraindikasi
  let contraindicationsPassed = true
  if (profile.forbiddenIngredients && Array.isArray(actualResponse?.recommended_ingredients)) {
    const recommendedNames = actualResponse.recommended_ingredients.map(
      (ing: any) => (typeof ing === 'string' ? ing : ing?.name ?? '').toLowerCase()
    )

    for (const forbidden of profile.forbiddenIngredients) {
      if (recommendedNames.some((name: string) => name.includes(forbidden.toLowerCase()))) {
        contraindicationsPassed = false
        reasons.push(`Peringatan: Bahan terlarang/kontraindikasi "${forbidden}" ditemukan di daftar rekomendasi AI.`)
      }
    }
  }

  const passed =
    faceValidationPassed &&
    scorePassed &&
    skinTypePassed &&
    contraindicationsPassed

  return {
    passed,
    benchmarkId,
    scorePassed,
    skinTypePassed,
    faceValidationPassed,
    contraindicationsPassed,
    reasons,
  }
}
