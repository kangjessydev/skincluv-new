import { useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

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
    setLoading,
    setInitialized,
    reset,
  } = useAuthStore()

  const hydrateUserData = useCallback(
    async (userId: string) => {
      setLoading(true)
      try {
        // Fetch all user data in parallel
        const [profileRes, skinProfileRes, coinRes, subRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', userId).single(),
          supabase
            .from('skin_profiles')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .maybeSingle(),
          supabase.from('coin_balances').select('*').eq('user_id', userId).single(),
          supabase
            .from('subscriptions')
            .select('*, subscription_tiers(slug, name)')
            .eq('user_id', userId)
            .eq('status', 'active')
            .maybeSingle(),
        ])

        setProfile(profileRes.data ?? null)
        setActiveSkinProfile(skinProfileRes.data ?? null)
        setCoinBalance(coinRes.data ?? null)
        setSubscription(subRes.data ?? null)
      } catch (err) {
        console.error('[useAuthInit] hydrateUserData error:', err)
      } finally {
        setLoading(false)
        setInitialized(true)
      }
    },
    [setLoading, setProfile, setActiveSkinProfile, setCoinBalance, setSubscription, setInitialized]
  )

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        hydrateUserData(session.user.id)
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
        hydrateUserData(session.user.id)
      } else {
        reset()
      }
    })

    return () => subscription.unsubscribe()
  }, [setUser, setSession, setLoading, setInitialized, hydrateUserData, reset])
}
