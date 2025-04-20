import { Routes, Route, Navigate } from "react-router-dom"
import { Loader } from "lucide-react"

import { useEffect } from "react"
import { useAuthStore } from "./store/useAuthStore"
import SignupPage from "./pages/SignupPage"
import { Toaster } from "react-hot-toast"
import LoginPage from "./pages/LoginPage"
import ProfilePage from "./pages/ProfilePage"
import { useThemeStore } from "./store/useThemeStore"
import SettingsPage from "./pages/SettingsPage"
import ThemeSettingsPage from "./pages/ThemeSettingsPage"
import HomePage from "./pages/HomePage"
import MainSidebar from "./components/MainSidebar"

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore()
  const { theme } = useThemeStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isCheckingAuth && !authUser && window.location.pathname !== '/login' && window.location.pathname !== '/signup')
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    )

  return (
    <div data-theme={theme} className="flex h-screen w-screen">
      {authUser && <MainSidebar />}

      <div className="flex-1 overflow-y-auto">
        <Routes>
          <Route
            path="/"
            element={authUser ? <HomePage /> : <Navigate to="/login" />}
          />
          <Route
            path="/login"
            element={!authUser ? <LoginPage /> : <Navigate to="/" />}
          />
          <Route
            path="/signup"
            element={!authUser ? <SignupPage /> : <Navigate to="/" />}
          />
          <Route
            path="/settings"
            element={authUser ? <SettingsPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/themes"
            element={authUser ? <ThemeSettingsPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/profile"
            element={authUser ? <ProfilePage /> : <Navigate to="/login" />}
          />
        </Routes>
      </div>

      <Toaster />
    </div>
  )
}

export default App
