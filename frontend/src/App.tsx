import { Routes, Route, Navigate } from "react-router-dom"
import { Loader } from "lucide-react"

import { useEffect } from "react"
import { useAuthStore } from "./store/useAuthStore"
import SignupPage from "./pages/SignupPage"
import { Toaster } from "react-hot-toast"
import Navbar from "./components/Navbar"
import LoginPage from "./pages/LoginPage"
import ProfilePage from "./pages/ProfilePage"
import { useThemeStore } from "./store/useThemeStore"
import SettingsPage from "./pages/SettingsPage"
import HomePage from "./pages/HomePage"

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore()
  const { theme } = useThemeStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    )

  return (
    <div data-theme={theme}>
      <Navbar />

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
        <Route path="/settings" element={<SettingsPage />} />
        <Route
          path="/profile"
          element={authUser ? <ProfilePage /> : <Navigate to="/login" />}
        />
      </Routes>

      <Toaster />
    </div>
  )
}

export default App
