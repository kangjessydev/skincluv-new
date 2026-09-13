// src/hooks/useInvokeAI.ts
// Generic hook untuk memanggil invoke-ai Edge Function (with Backward Compatibility Adapter)

import { useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export interface InvokeAIRequest {
  feature_slug?: string
  feature?: string // Legacy fallback
  messages?: Array<{ role: 'user' | 'assistant'; content: string | Array<unknown> }>
  payload?: Record<string, any> // Legacy fallback
  input_context?: Record<string, string>
  use_coins?: boolean
}

export interface InvokeAIResponse {
  success: boolean
  content: string
  deduct_mode: 'quota' | 'coin'
  tokens_used: number
}

// State yang di-expose untuk menampilkan CoinConfirmModal
export interface PendingCoinConfirm {
  coinCost: number
  featureName: string
}

export function useInvokeAI() {
  const { user, setCoinBalance } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // State untuk coin confirmation modal (pengganti window.confirm)
  const [pendingCoinConfirm, setPendingCoinConfirm] = useState<PendingCoinConfirm | null>(null)

  // Resolver untuk menunggu keputusan user dari modal
  const resolverRef = useRef<((confirmed: boolean) => void) | null>(null)

  // Dipanggil dari CoinConfirmModal saat user klik "Gunakan Koin"
  const confirmCoinUsage = useCallback(() => {
    setPendingCoinConfirm(null)
    resolverRef.current?.(true)
    resolverRef.current = null
  }, [])

  // Dipanggil dari CoinConfirmModal saat user klik "Batal"
  const cancelCoinUsage = useCallback(() => {
    setPendingCoinConfirm(null)
    resolverRef.current?.(false)
    resolverRef.current = null
  }, [])

  // Menampilkan modal dan menunggu keputusan user (Promise-based)
  const askCoinConfirmation = (coinCost: number, featureName: string): Promise<boolean> => {
    return new Promise((resolve) => {
      resolverRef.current = resolve
      setPendingCoinConfirm({ coinCost, featureName })
    })
  }

  const invoke = async <T = any>(req: InvokeAIRequest): Promise<T | null> => {
    setIsLoading(true)
    setError(null)

    try {
      // Adapter: resolve feature_slug & messages & input_context
      const feature_slug = req.feature_slug || req.feature
      if (!feature_slug) {
        setError('Feature slug tidak ditemukan.')
        return null
      }

      const input_context = req.input_context || req.payload || {}
      const messages = req.messages || [
        { role: 'user', content: `Lakukan analisis untuk fitur ${feature_slug}` },
      ]

      const formattedPayload = {
        feature_slug,
        messages,
        input_context,
        use_coins: req.use_coins ?? false,
      }

      const callEdge = async (useCoins: boolean) => {
        return await supabase.functions.invoke('invoke-ai', {
          body: { ...formattedPayload, use_coins: useCoins },
        })
      }

      let res = await callEdge(formattedPayload.use_coins)

      // Handle 402 Payment Required (Quota exceeded)
      // Tampilkan modal konfirmasi — bukan window.confirm() blocking
      let is402 = false
      let dynamicCoinCost: number | null = null
      let dynamicFeatureSlug = feature_slug

      if (res.error) {
        if ((res.error as any).context) {
          try {
            const errBody = await (res.error as any).context.clone().json()
            if (errBody?.code === 'QUOTA_EXCEEDED' || errBody?.error?.toLowerCase().includes('quota exceeded')) {
              is402 = true
              if (typeof errBody.coin_cost === 'number') {
                dynamicCoinCost = errBody.coin_cost
              }
              if (errBody.feature_slug) {
                dynamicFeatureSlug = errBody.feature_slug
              }
            }
          } catch {}
        }

        if (!is402 && (res.error.message?.includes('402') || res.error.message?.toLowerCase().includes('quota exceeded'))) {
          is402 = true
        }
      }

      if (is402) {
        const DEFAULT_CREDIT_COST: Record<string, number> = {
          face_analysis: 5,
          face_validation: 1,
          ingredient_scan: 3,
          chatbot: 1,
        }
        const coinCost = dynamicCoinCost ?? DEFAULT_CREDIT_COST[dynamicFeatureSlug] ?? 3

        const FEATURE_LABELS: Record<string, string> = {
          face_analysis: 'Scan Wajah Spesialis',
          face_validation: 'Validasi Foto Wajah',
          ingredient_scan: 'Analisis Komposisi Produk',
          chatbot: 'Konsultasi Skinsistant AI',
        }
        const featureLabel = FEATURE_LABELS[dynamicFeatureSlug] ?? 'fitur ini'

        const confirmed = await askCoinConfirmation(coinCost, featureLabel)

        if (!confirmed) {
          setError('Dibatalkan. Kumpulkan Credits dari misi harian atau upgrade ke Paket Glow / PRO.')
          return null
        }

        res = await callEdge(true)
      }

      const { data, error: fnError } = res

      if (fnError) {
        console.error('[useInvokeAI] Edge Function Network/Internal Error:', fnError)
        let msg = 'Terjadi kesalahan pada layanan AI. Coba lagi.'
        if ((fnError as any).context) {
          try {
            const errBody = await (fnError as any).context.clone().json()
            if (errBody?.error) msg = errBody.error
          } catch {}
        } else if (typeof fnError.message === 'string') {
          msg = fnError.message
        }
        setError(msg)
        return null
      }

      if (!data?.success) {
        console.error('[useInvokeAI] Edge Function Logical Error:', data)
        setError(data?.error ?? 'Terjadi kesalahan saat memproses data.')
        return null
      }

      // Real-time UI refresh: Jika coins/quota terpotong, fetch saldo koin terbaru
      if (user?.id) {
        supabase
          .from('coin_balances')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
          .then(({ data: updatedCoin }) => {
            if (updatedCoin) setCoinBalance(updatedCoin)
          })
      }

      const contentStr = data.content ?? ''

      // Jika caller expect JSON object (FaceScanPage, IngredientScanPage), parse otomatis
      try {
        const cleanedStr = contentStr.trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '')
        const parsed = JSON.parse(cleanedStr)
        return parsed as T
      } catch {
        // Jika content bukan JSON (Chatbot raw text), return data as is
        return data as unknown as T
      }
    } catch (err: any) {
      console.error('[useInvokeAI] Unexpected error:', err)
      setError('Koneksi gagal. Periksa koneksi internet kamu.')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return {
    invoke,
    isLoading,
    error,
    clearError: () => setError(null),
    // Modal state — gunakan ini di komponen yang memanggil useInvokeAI
    pendingCoinConfirm,
    confirmCoinUsage,
    cancelCoinUsage,
  }
}

