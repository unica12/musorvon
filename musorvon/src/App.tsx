import { useEffect, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './hooks/useAuth'
import { useAppStore } from './store/useAppStore'

const OnboardingPage = lazy(() =>
  import('./pages/OnboardingPage').then((m) => ({ default: m.OnboardingPage })),
)
const RegisterAddressPage = lazy(() =>
  import('./pages/RegisterAddressPage').then((m) => ({ default: m.RegisterAddressPage })),
)
const RegisterPage = lazy(() =>
  import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })),
)
const HomePage = lazy(() =>
  import('./pages/HomePage').then((m) => ({ default: m.HomePage })),
)
const PaymentPage = lazy(() =>
  import('./pages/PaymentPage').then((m) => ({ default: m.PaymentPage })),
)
const SuccessPage = lazy(() =>
  import('./pages/SuccessPage').then((m) => ({ default: m.SuccessPage })),
)
const HistoryPage = lazy(() =>
  import('./pages/HistoryPage').then((m) => ({ default: m.HistoryPage })),
)
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })),
)
const AdminPage = lazy(() =>
  import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })),
)

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-dvh bg-[#F7FAF6]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-3xl bg-[#33A65A] flex items-center justify-center animate-pulse">
          <svg width="36" height="36" viewBox="0 0 64 64" fill="none">
            <path
              d="M16 20h32l-4 28H20L16 20z"
              fill="white"
              fillOpacity="0.9"
            />
            <path
              d="M12 20h40M24 20v-4a4 4 0 018 0v4"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="text-sm text-[#7F8A80]">МусорВон</p>
      </div>
    </div>
  )
}

function AppRoutes() {
  useAuth()
  const { user, apartment, isLoading } = useAppStore()

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public: no auth required */}
        <Route
          path="/"
          element={
            user && apartment ? <Navigate to="/home" replace /> : <OnboardingPage />
          }
        />
        <Route path="/register" element={<Navigate to="/register/address" replace />} />
        <Route path="/register/address" element={<RegisterAddressPage />} />
        <Route
          path="/register/email"
          element={
            user && apartment ? <Navigate to="/home" replace /> : <RegisterPage />
          }
        />
        {/* Protected: wait for auth to resolve, then guard */}
        <Route
          path="/home"
          element={
            isLoading ? <LoadingScreen /> :
            !user ? <Navigate to="/" replace /> :
            !apartment ? <Navigate to="/register/address" replace /> :
            <HomePage />
          }
        />
        <Route
          path="/payment/:orderId"
          element={
            isLoading ? <LoadingScreen /> : user ? <PaymentPage /> : <Navigate to="/" replace />
          }
        />
        <Route
          path="/success"
          element={
            isLoading ? <LoadingScreen /> : user ? <SuccessPage /> : <Navigate to="/" replace />
          }
        />
        <Route
          path="/history"
          element={
            isLoading ? <LoadingScreen /> : user ? <HistoryPage /> : <Navigate to="/" replace />
          }
        />
        <Route
          path="/profile"
          element={
            isLoading ? <LoadingScreen /> : user ? <ProfilePage /> : <Navigate to="/" replace />
          }
        />
        {/* Admin panel — PIN protected, no Supabase auth required */}
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  // A2HS prompt
  useEffect(() => {
    let deferredPrompt: BeforeInstallPromptEvent | null = null

    const handler = (e: Event) => {
      e.preventDefault()
      deferredPrompt = e as BeforeInstallPromptEvent
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Auto-show prompt after 10 seconds if not installed
    const timer = setTimeout(() => {
      if (deferredPrompt) {
        void deferredPrompt.prompt()
      }
    }, 10000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      clearTimeout(timer)
    }
  }, [])

  return (
    <BrowserRouter>
      <AppRoutes />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1A1F1A',
            color: '#fff',
            borderRadius: '16px',
            fontSize: '14px',
            maxWidth: '340px',
          },
          success: {
            iconTheme: { primary: '#33A65A', secondary: '#fff' },
          },
        }}
      />
    </BrowserRouter>
  )
}

// BeforeInstallPromptEvent type
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
}
