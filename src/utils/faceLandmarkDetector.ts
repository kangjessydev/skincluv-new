// src/utils/faceLandmarkDetector.ts
// 100% Client-Side Face & Obstruction Detection using Google MediaPipe WebAssembly (WASM)
// Zero server calls, zero tokens, ultra-fast evaluation in user's browser (< 50ms)

import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

let landmarkerInstance: FaceLandmarker | null = null
let initPromise: Promise<FaceLandmarker | null> | null = null

/**
 * Initializes and caches the MediaPipe Face Landmarker instance.
 * Loads WASM binaries and deep learning weights dynamically only when needed.
 */
export async function getFaceLandmarker(): Promise<FaceLandmarker | null> {
  if (landmarkerInstance) return landmarkerInstance
  if (initPromise) return initPromise

  initPromise = (async () => {
    try {
      const wasmPath = `${window.location.origin}/wasm`
      const modelPath = `${window.location.origin}/models/face_landmarker.task`

      const vision = await FilesetResolver.forVisionTasks(wasmPath)

      const landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: modelPath,
          delegate: 'GPU',
        },
        runningMode: 'IMAGE',
        numFaces: 1,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      })

      landmarkerInstance = landmarker
      return landmarker
    } catch (err) {
      console.warn('[FaceLandmarker] Local GPU delegate failed, attempting local CPU delegate:', err)
      try {
        const wasmPath = `${window.location.origin}/wasm`
        const modelPath = `${window.location.origin}/models/face_landmarker.task`

        const vision = await FilesetResolver.forVisionTasks(wasmPath)
        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: modelPath,
            delegate: 'CPU',
          },
          runningMode: 'IMAGE',
          numFaces: 1,
          minFaceDetectionConfidence: 0.45,
        })
        landmarkerInstance = landmarker
        return landmarker
      } catch (fallbackErr) {
        console.error('[FaceLandmarker] WebAssembly initialization fallback error:', fallbackErr)
        return null
      }
    }
  })()

  return initPromise
}

export interface FaceDetectionResult {
  isValidFace: boolean
  isHuman: boolean
  isUnobstructed: boolean
  rejectionReason: string | null
  faceCount: number
  faceCoverage: number // 0 - 100% of image
}

/**
 * Detects human face and checks for obstructions (phone, mask, hands) 100% on client-side.
 */
export async function detectHumanFace(
  imageSource: HTMLImageElement | HTMLCanvasElement | string
): Promise<FaceDetectionResult> {
  // Helper to load image element if base64/URL string is passed
  let imgElement: HTMLImageElement | HTMLCanvasElement

  if (typeof imageSource === 'string') {
    imgElement = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Gagal memuat citra untuk analisis wajah.'))
      img.src = imageSource.startsWith('data:')
        ? imageSource
        : `data:image/jpeg;base64,${imageSource}`
    })
  } else {
    imgElement = imageSource
  }

  const landmarker = await getFaceLandmarker()

  if (!landmarker) {
    console.error('[detectHumanFace] MediaPipe failed to initialize.')
    return {
      isValidFace: false,
      isHuman: false,
      isUnobstructed: false,
      rejectionReason: 'Gagal memuat engine pendeteksi wajah. Silakan muat ulang halaman.',
      faceCount: 0,
      faceCoverage: 0,
    }
  }

  try {
    const results = landmarker.detect(imgElement)

    // CASE 1: No human face detected (e.g. Cat, Skincare Bottle, Anime, Objects)
    if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
      return {
        isValidFace: false,
        isHuman: false,
        isUnobstructed: false,
        rejectionReason: 'Tidak terdeteksi wajah manusia. Pastikan mengunggah foto wajah asli, bukan produk skincare, hewan, atau objek lain.',
        faceCount: 0,
        faceCoverage: 0,
      }
    }

    const landmarks = results.faceLandmarks[0] // First detected face

    // Calculate face bounding box & coverage
    let minX = 1, minY = 1, maxX = 0, maxY = 0
    landmarks.forEach((pt) => {
      if (pt.x < minX) minX = pt.x
      if (pt.y < minY) minY = pt.y
      if (pt.x > maxX) maxX = pt.x
      if (pt.y > maxY) maxY = pt.y
    })

    const faceWidth = Math.max(0, maxX - minX)
    const faceHeight = Math.max(0, maxY - minY)
    const faceCoverage = Math.round(faceWidth * faceHeight * 100)

    // CASE 2: Face is too tiny in frame (< 1.5% of total canvas area)
    if (faceCoverage < 1.5) {
      return {
        isValidFace: false,
        isHuman: true,
        isUnobstructed: false,
        rejectionReason: 'Posisi wajah terlalu jauh dari kamera. Harap ambil foto selfie lebih dekat.',
        faceCount: 1,
        faceCoverage,
      }
    }

    // CASE 3: Essential landmark verification & Obstruction Check (Phone in front of face)
    const noseTip = landmarks[1]
    const mouthCenter = landmarks[13]
    const leftEye = landmarks[33]
    const rightEye = landmarks[263]

    if (!noseTip || !mouthCenter || !leftEye || !rightEye) {
      return {
        isValidFace: false,
        isHuman: true,
        isUnobstructed: false,
        rejectionReason: 'Wajah terdeteksi tertutup ponsel (mirror selfie), masker, atau objek lain.',
        faceCount: 1,
        faceCoverage,
      }
    }

    // Check anatomical vertical hierarchy: Eye -> Nose -> Mouth
    const eyeCenterY = (leftEye.y + rightEye.y) / 2
    const isAnatomyValid = noseTip.y > eyeCenterY && mouthCenter.y > noseTip.y

    if (!isAnatomyValid) {
      return {
        isValidFace: false,
        isHuman: true,
        isUnobstructed: false,
        rejectionReason: 'Wajah terdeteksi terhalang ponsel atau masker. Pastikan mata, hidung, dan mulut terlihat jelas.',
        faceCount: 1,
        faceCoverage,
      }
    }

    // SUCCESS: Valid, human, unobstructed face
    return {
      isValidFace: true,
      isHuman: true,
      isUnobstructed: true,
      rejectionReason: null,
      faceCount: 1,
      faceCoverage,
    }
  } catch (err) {
    console.error('[detectHumanFace] Detection execution error:', err)
    return {
      isValidFace: false,
      isHuman: false,
      isUnobstructed: false,
      rejectionReason: 'Terjadi kendala saat menganalisis citra wajah.',
      faceCount: 0,
      faceCoverage: 0,
    }
  }
}
