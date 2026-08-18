// src/hooks/useInvokeAI.ts
// Generic hook untuk memanggil invoke-ai Edge Function

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface InvokeAIRequest {
  feature_slug: string
  messages: Array<{ role: 'user' | 'assistant'; content: string | Array<unknown> }>
  input_context?: Record<string, string>
  use_coins?: boolean
}

export interface InvokeAIResponse {
  success: boolean
  content: string
  deduct_mode: 'quota' | 'coin'
  tokens_used: number
}

export function useInvokeAI() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const invoke = async (req: InvokeAIRequest): Promise<InvokeAIResponse | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const callEdge = async (useCoins: boolean) => {
        return await supabase.functions.invoke('invoke-ai', {
          body: { ...req, use_coins: useCoins },
        })
      }

      let res = await callEdge(req.use_coins ?? false)

      // Handle 402 Payment Required (Quota exceeded)
      if (res.error && res.error.message?.includes('402')) {
        const wantsToUseCoin = window.confirm('Kuota gratis kamu sudah habis 😢\\nApakah kamu ingin menggunakan 5 Koin untuk melanjutkan?')
        if (wantsToUseCoin) {
          res = await callEdge(true)
        } else {
          setError('Dibatalkan. Kamu butuh koin untuk melanjutkan.')
          return null
        }
      }

      const { data, error: fnError } = res

      if (fnError) {
        console.error('[useInvokeAI] Edge Function Network/Internal Error:', fnError)
        // Extract inner error message if possible
        let msg = 'Terjadi kesalahan. Coba lagi.'
        if (typeof fnError.message === 'string') msg = fnError.message
        
        setError(msg)
        return null
      }

      if (!data?.success) {
        console.error('[useInvokeAI] Edge Function Logical Error:', data)
        setError(data?.error ?? 'Terjadi kesalahan.')
        return null
      }

      return data as InvokeAIResponse
    } catch (err) {
      setError('Koneksi gagal. Periksa internet kamu.')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { invoke, isLoading, error, clearError: () => setError(null) }
}
