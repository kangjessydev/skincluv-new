import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export interface DashboardProfile {
  skin_type?: string
  skin_concerns?: string[]
  analysis_notes?: string
}

export interface DashboardSkinAssessment {
  has_face_scan: boolean
  latest_score: number | null
  latest_status: string
  skin_type: string
  analysis_notes: string | null
  latest_scanned_at: string | null
  can_show_delta: boolean
  delta_score: number | null
  trend_direction: 'improving' | 'attention' | 'stable' | 'none'
  trend_label: string
}

export interface DashboardProductSummary {
  total_products_scanned: number
  safe_products_count: number
  avg_safety_score: number | null
}

export interface DashboardScanCounts {
  face_total: number
  ingredient_total: number
  total: number
}

export interface DashboardMissionItem {
  id: string
  name: string
  coin_reward: number
  current_count: number
  target_count: number
  is_completed: boolean
}

export interface DashboardMissions {
  completed: number
  total: number
  active_list: DashboardMissionItem[]
}

export interface DashboardRecentScan {
  type: 'face' | 'ingredient'
  id: string
  title: string
  score: number | null
  created_at: string
}

export interface DashboardSummaryData {
  profile: DashboardProfile
  skin_assessment: DashboardSkinAssessment
  product_summary: DashboardProductSummary
  scan_counts: DashboardScanCounts
  missions: DashboardMissions
  recent_scans: DashboardRecentScan[]
}

export function useDashboardData() {
  const { session, user } = useAuthStore()
  const [data, setData] = useState<DashboardSummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = useCallback(async () => {
    const activeUser = user || session?.user
    if (!activeUser) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Panggil RPC teragregasi get_user_dashboard_summary() (Zero-IDOR, single roundtrip)
      const { data: summary, error: rpcError } = await supabase.rpc('get_user_dashboard_summary')

      if (rpcError) {
        console.error('[useDashboardData] RPC error:', rpcError)
        setError(rpcError.message)
      } else if (summary) {
        setData(summary as unknown as DashboardSummaryData)
      }
    } catch (err: any) {
      console.error('[useDashboardData] unexpected error:', err)
      setError(err.message || 'Gagal memuat ringkasan dashboard.')
    } finally {
      setLoading(false)
    }
  }, [user?.id, session?.user?.id])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  return {
    data,
    loading,
    error,
    refetch: fetchDashboard,
  }
}
