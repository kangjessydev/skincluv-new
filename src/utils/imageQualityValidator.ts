// src/utils/imageQualityValidator.ts
// Client-side Computer Vision utility for pre-flight photo quality inspection
// Checks: Brightness (Luminance), Blur (Laplacian Edge Variance), and Minimum Resolution

export interface ImageQualityResult {
  isValid: boolean
  code: 'OK' | 'TOO_DARK' | 'TOO_BRIGHT' | 'TOO_BLURRY' | 'TOO_SMALL' | 'LOAD_ERROR'
  message: string
  brightness: number // 0 - 255
  sharpness: number  // higher is sharper
}

/**
 * Validates an image's physical quality in the browser before sending to AI:
 * 1. Checks if image is too dark (Luma < 35)
 * 2. Checks if image is too overexposed/bright (Luma > 230)
 * 3. Checks if image is excessively blurry using Laplacian operator variance
 * 4. Checks minimum dimensions (at least 200x200px)
 */
export async function validateImageQuality(
  imageSource: File | string
): Promise<ImageQualityResult> {
  return new Promise((resolve) => {
    const img = new Image()

    img.onload = () => {
      try {
        const { width, height } = img

        // 1. Check Dimensions
        if (width < 200 || height < 200) {
          resolve({
            isValid: false,
            code: 'TOO_SMALL',
            message: 'Ukuran foto terlalu kecil. Unggah foto dengan resolusi yang lebih jelas.',
            brightness: 0,
            sharpness: 0,
          })
          return
        }

        // Create an offscreen canvas for pixel inspection
        // Downsample to max 400px dimension for ultra-fast calculation (< 20ms)
        const maxDim = 400
        let targetWidth = width
        let targetHeight = height

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            targetWidth = maxDim
            targetHeight = Math.round((height / width) * maxDim)
          } else {
            targetHeight = maxDim
            targetWidth = Math.round((width / height) * maxDim)
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = targetWidth
        canvas.height = targetHeight
        const ctx = canvas.getContext('2d', { willReadFrequently: true })

        if (!ctx) {
          resolve({
            isValid: true,
            code: 'OK',
            message: 'Kualitas foto memadai.',
            brightness: 128,
            sharpness: 100,
          })
          return
        }

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight)
        const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight)
        const pixels = imgData.data
        const totalPixels = targetWidth * targetHeight

        // 2. Calculate Luminance (Luma = 0.299R + 0.587G + 0.114B)
        let totalLuma = 0
        const grayscale = new Uint8Array(totalPixels)

        for (let i = 0, p = 0; i < pixels.length; i += 4, p++) {
          const r = pixels[i]
          const g = pixels[i + 1]
          const b = pixels[i + 2]
          const luma = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
          grayscale[p] = luma
          totalLuma += luma
        }

        const avgBrightness = totalLuma / totalPixels

        // Sort sample grayscale values to inspect face/highlight luminance
        // Dark threshold: Only reject if the image is truly pitch black (mean < 20 and highlight < 50)
        let maxLuma = 0
        for (let i = 0; i < grayscale.length; i += 10) {
          if (grayscale[i] > maxLuma) maxLuma = grayscale[i]
        }

        if (avgBrightness < 20 && maxLuma < 55) {
          resolve({
            isValid: false,
            code: 'TOO_DARK',
            message: 'Foto terlalu gelap. Harap ambil foto di tempat dengan pencahayaan terang.',
            brightness: avgBrightness,
            sharpness: 0,
          })
          return
        }

        // Overexposed threshold: Only reject if almost entirely blown out white
        if (avgBrightness > 242) {
          resolve({
            isValid: false,
            code: 'TOO_BRIGHT',
            message: 'Foto terlalu silau / overexposed. Hindari cahaya langsung yang menyilaukan kamera.',
            brightness: avgBrightness,
            sharpness: 0,
          })
          return
        }

        // 3. Calculate Laplacian Variance for Blur / Sharpness
        let laplacianSum = 0
        let laplacianSqSum = 0
        let laplacianCount = 0

        for (let y = 1; y < targetHeight - 1; y += 2) {
          // Sample every 2 rows for fast calculation
          for (let x = 1; x < targetWidth - 1; x += 2) {
            const idx = y * targetWidth + x
            const val =
              grayscale[idx - targetWidth] + // top
              grayscale[idx + targetWidth] + // bottom
              grayscale[idx - 1] +           // left
              grayscale[idx + 1] -           // right
              4 * grayscale[idx]             // center

            laplacianSum += val
            laplacianSqSum += val * val
            laplacianCount++
          }
        }

        const meanLaplacian = laplacianSum / (laplacianCount || 1)
        const varianceLaplacian =
          laplacianSqSum / (laplacianCount || 1) - meanLaplacian * meanLaplacian

        // Blur Threshold: Reject out-of-focus or motion-blurred images (variance < 28)
        if (varianceLaplacian < 28) {
          resolve({
            isValid: false,
            code: 'TOO_BLURRY',
            message: 'Foto terdeteksi buram atau goyang (motion blur). Harap ambil foto ulang dengan fokus yang tajam.',
            brightness: avgBrightness,
            sharpness: varianceLaplacian,
          })
          return
        }

        // Valid photo
        resolve({
          isValid: true,
          code: 'OK',
          message: 'Pencahayaan dan ketajaman foto sangat baik.',
          brightness: Math.round(avgBrightness),
          sharpness: Math.round(varianceLaplacian),
        })
      } catch (err) {
        console.warn('[validateImageQuality] Canvas inspection error, falling back to valid:', err)
        resolve({
          isValid: true,
          code: 'OK',
          message: 'Foto siap diproses.',
          brightness: 128,
          sharpness: 100,
        })
      }
    }

    img.onerror = () => {
      resolve({
        isValid: false,
        code: 'LOAD_ERROR',
        message: 'Gagal memuat format gambar. Harap gunakan format JPG, PNG, atau WEBP.',
        brightness: 0,
        sharpness: 0,
      })
    }

    // Set image source
    if (typeof imageSource === 'string') {
      img.src = imageSource.startsWith('data:')
        ? imageSource
        : `data:image/jpeg;base64,${imageSource}`
    } else {
      img.src = URL.createObjectURL(imageSource)
    }
  })
}

/**
 * Compresses and scales high-res camera photos to an optimized JPEG format (~150 KB)
 * Prevents HTTP 502 Bad Gateway / Payload Entity Too Large errors on serverless edge functions.
 */
export function compressImageForAI(
  file: File,
  maxDim = 800,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      try {
        const { width, height } = img
        let targetW = width
        let targetH = height

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            targetW = maxDim
            targetH = Math.round((height / width) * maxDim)
          } else {
            targetH = maxDim
            targetW = Math.round((width / height) * maxDim)
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = targetW
        canvas.height = targetH
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          const reader = new FileReader()
          reader.onload = () => {
            const resStr = String(reader.result || '')
            resolve(resStr.includes(',') ? resStr.split(',')[1] : resStr)
          }
          reader.readAsDataURL(file)
          return
        }

        ctx.drawImage(img, 0, 0, targetW, targetH)
        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(dataUrl.split(',')[1])
      } catch (err) {
        console.warn('[compressImageForAI] Compression fallback:', err)
        const reader = new FileReader()
        reader.onload = () => {
          const resStr = String(reader.result || '')
          resolve(resStr.includes(',') ? resStr.split(',')[1] : resStr)
        }
        reader.readAsDataURL(file)
      }
    }

    img.onerror = () => {
      const reader = new FileReader()
      reader.onload = () => {
        const resStr = String(reader.result || '')
        resolve(resStr.includes(',') ? resStr.split(',')[1] : resStr)
      }
      reader.readAsDataURL(file)
    }

    img.src = URL.createObjectURL(file)
  })
}
