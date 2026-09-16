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
import AdminRoute from '@/components/admin/AdminRoute'
import AdminLayout from '@/components/admin/AdminLayout'
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import AdminPromptsPage from '@/pages/admin/AdminPromptsPage'
import AdminModelsPage from '@/pages/admin/AdminModelsPage'
import AdminMissionsPage from '@/pages/admin/AdminMissionsPage'
import AdminPricingPage from '@/pages/admin/AdminPricingPage'
import AdminProductsPage from '@/pages/admin/AdminProductsPage'
import AdminFaceScansPage from '@/pages/admin/AdminFaceScansPage'
import AdminIngredientScansPage from '@/pages/admin/AdminIngredientScansPage'
import AdminChatsPage from '@/pages/admin/AdminChatsPage'
import AdminLogsPage from '@/pages/admin/AdminLogsPage'

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
        <Route path="/login" element={<LoginPage />} />
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

      {/* Protected admin routes */}
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/prompts" element={<AdminPromptsPage />} />
          <Route path="/admin/models" element={<AdminModelsPage />} />
          <Route path="/admin/missions" element={<AdminMissionsPage />} />
          <Route path="/admin/pricing" element={<AdminPricingPage />} />
          <Route path="/admin/products" element={<AdminProductsPage />} />
          <Route path="/admin/memory/face-scans" element={<AdminFaceScansPage />} />
          <Route path="/admin/memory/ingredient-scans" element={<AdminIngredientScansPage />} />
          <Route path="/admin/memory/chats" element={<AdminChatsPage />} />
          <Route path="/admin/memory/logs" element={<AdminLogsPage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
