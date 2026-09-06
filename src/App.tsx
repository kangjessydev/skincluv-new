import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthInit } from '@/hooks/useAuthInit'
import { useAuthStore } from '@/store/authStore'
import AppLayout from '@/components/layout/AppLayout'
import AuthLayout from '@/components/layout/AuthLayout'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import DashboardPage from '@/pages/app/DashboardPage'
import FaceScanPage from '@/pages/app/FaceScanPage'
import IngredientScanPage from '@/pages/app/IngredientScanPage'
import ChatbotPage from '@/pages/app/ChatbotPage'
import MissionsPage from '@/pages/app/MissionsPage'
import ProfilePage from '@/pages/app/ProfilePage'
import PaymentSuccessPage from '@/pages/app/PaymentSuccessPage'
import CheckoutPage from '@/pages/app/CheckoutPage'
import TransactionHistoryPage from '@/pages/app/TransactionHistoryPage'
import PricingPage from '@/pages/app/PricingPage'
import CoinHistoryPage from '@/pages/app/CoinHistoryPage'
import ScanHistoryPage from '@/pages/app/ScanHistoryPage'
import LandingPage from '@/pages/LandingPage'
import LoadingScreen from '@/components/ui/LoadingScreen'

export default function App() {
  useAuthInit()

  const { user, isInitialized } = useAuthStore()

  if (!isInitialized) {
    return <LoadingScreen />
  }

  return (
    <Routes>
      {/* Public auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" replace />} />
        <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/" replace />} />
      </Route>

      {/* Public landing page (when unauthenticated) */}
      {!user && <Route path="/" element={<LandingPage />} />}

      {/* Protected app routes */}
      <Route element={user ? <AppLayout /> : <Navigate to="/login" replace />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/face-scan" element={<FaceScanPage />} />
        <Route path="/scan-history" element={<ScanHistoryPage />} />
        <Route path="/ingredient-scan" element={<IngredientScanPage />} />
        <Route path="/chatbot" element={<ChatbotPage />} />
        <Route path="/chatbot/:sessionId" element={<ChatbotPage />} />
        <Route path="/missions" element={<MissionsPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/checkout/:reference" element={<CheckoutPage />} />
        <Route path="/transactions" element={<TransactionHistoryPage />} />
        <Route path="/coin-history" element={<CoinHistoryPage />} />
        <Route path="/payment-success" element={<PaymentSuccessPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/wallet" element={<Navigate to="/profile" replace />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
