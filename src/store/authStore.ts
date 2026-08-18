import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile, SkinProfile, CoinBalance, Subscription } from '@/types/database'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  activeSkinProfile: SkinProfile | null
  coinBalance: CoinBalance | null
  subscription: Subscription | null
  isLoading: boolean
  isInitialized: boolean

  // Actions
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  setActiveSkinProfile: (profile: SkinProfile | null) => void
  setCoinBalance: (balance: CoinBalance | null) => void
  setSubscription: (subscription: Subscription | null) => void
  setLoading: (isLoading: boolean) => void
  setInitialized: (initialized: boolean) => void
  reset: () => void
}

const initialState = {
  user: null,
  session: null,
  profile: null,
  activeSkinProfile: null,
  coinBalance: null,
  subscription: null,
  isLoading: true,
  isInitialized: false,
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...initialState,

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setProfile: (profile) => set({ profile }),
      setActiveSkinProfile: (activeSkinProfile) => set({ activeSkinProfile }),
      setCoinBalance: (coinBalance) => set({ coinBalance }),
      setSubscription: (subscription) => set({ subscription }),
      setLoading: (isLoading) => set({ isLoading }),
      setInitialized: (isInitialized) => set({ isInitialized }),
      reset: () => set({ ...initialState, isLoading: false, isInitialized: true }),
    }),
    {
      name: 'skincluv-auth',
      // Only persist non-sensitive data
      partialize: (state) => ({
        profile: state.profile,
        activeSkinProfile: state.activeSkinProfile,
        coinBalance: state.coinBalance,
        subscription: state.subscription,
      }),
    }
  )
)
