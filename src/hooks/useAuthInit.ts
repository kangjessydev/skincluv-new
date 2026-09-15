import { useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { SkinProfile, Subscription } from '@/types/database'

/**
 * Initializes Supabase Auth listener and hydrates the global auth store.
 * Fetches profile, active skin profile, coin balance, and subscription
 * on sign-in. Resets store on sign-out.
 *
 * Must be mounted once at the app root.
 */
export function useAuthInit() {
  const {
    setUser,
    setSession,
    setProfile,
    setActiveSkinProfile,
    setCoinBalance,
    setSubscription,
    setIsAdmin,
    setLoading,
    setInitialized,
    reset,
  } = useAuthStore()

  const hydrateUserData = useCallback(
    async (userObj: any) => {
      setLoading(true)
      const userId = userObj.id
      try {
        // Fetch all user data in parallel
        const [profileRes, skinProfileRes, coinRes, subRes, roleRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
          supabase
            .from('skin_profiles')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .maybeSingle(),
          supabase.from('coin_balances').select('*').eq('user_id', userId).maybeSingle(),
          supabase
            .from('subscriptions')
            .select('*, subscription_tiers(slug, name)')
            .eq('user_id', userId)
            .eq('status', 'active')
            .maybeSingle(),
          supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .eq('role', 'admin')
            .maybeSingle(),
        ])

        let profileData = profileRes.data

        // Auto-heal/Ensure profile exists in public.profiles with full_name
        const metaName = userObj.user_metadata?.full_name || userObj.email?.split('@')[0] || 'Pengguna Skincluv'

        if (!profileData) {
          const { data: newProf } = await supabase
            .from('profiles')
            .upsert({ id: userId, full_name: metaName })
            .select()
            .maybeSingle()
          profileData = newProf
        } else if (!profileData.full_name && metaName) {
          const { data: updatedProf } = await supabase
            .from('profiles')
            .update({ full_name: metaName })
            .eq('id', userId)
            .select()
            .maybeSingle()
          profileData = updatedProf
        }

        const coinData = coinRes.data

        if (roleRes.error) {
          console.error('[useAuthInit] Gagal mengambil role pengguna:', roleRes.error)
        }

        setProfile(profileData ?? null)
        setActiveSkinProfile((skinProfileRes.data as unknown as SkinProfile) ?? null)
        setCoinBalance(coinData ?? { id: userId, user_id: userId, balance: 0, updated_at: new Date().toISOString() })
        setSubscription((subRes.data as unknown as Subscription) ?? null)
        setIsAdmin(!!roleRes.data)

        // Track daily login & streak safely on the server
        void supabase.rpc('track_daily_login').then(null, (err: unknown) => {
          console.warn('[useAuthInit] Failed to track daily login:', err)
        })
      } catch (err) {
        console.error('[useAuthInit] hydrateUserData error:', err)
      } finally {
        setLoading(false)
        setInitialized(true)
      }
    },
    [setLoading, setProfile, setActiveSkinProfile, setCoinBalance, setSubscription, setIsAdmin, setInitialized]
  )

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        hydrateUserData(session.user)
      } else {
        setLoading(false)
        setInitialized(true)
      }
    })

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        hydrateUserData(session.user)
      } else {
        reset()
        setLoading(false)
        setInitialized(true)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setSession, setUser, hydrateUserData, reset, setLoading, setInitialized])
}
