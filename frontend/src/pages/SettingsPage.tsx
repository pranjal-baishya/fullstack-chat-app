import { Bell, Info, Mail, LogOut } from "lucide-react"
import { Navigate } from "react-router-dom"
import { useAuthStore } from "../store/useAuthStore"
import { useUISettingsStore } from "../store/useUISettingsStore"

const SettingsPage = () => {
  const { authUser, logout } = useAuthStore()
  const { isNotificationsEnabled, toggleNotifications } = useUISettingsStore()

  if (!authUser) {
    return <Navigate to="/login" />
  }

  return (
    <div className="container mx-auto px-4 py-8 lg:py-10 max-w-4xl">
      {/* User Info Header */}
      <div className="flex items-center gap-4 mb-6 px-4 py-3 bg-base-200 rounded-lg">
        <div className="avatar">
          <div className="w-14 rounded-full">
            <img src={authUser.profilePic || "/avatar.png"} alt="User avatar" />
          </div>
        </div>
        <div>
          <h1 className="text-xl font-semibold">{authUser.fullName}</h1>
          <p className="text-sm text-base-content/70">Manage your settings</p>
        </div>
      </div>

      {/* Settings Sections Card */}
      <div className="bg-base-100 border border-base-300 rounded-xl p-6 shadow-sm space-y-6">
        {/* Notifications Section */}
        <div>
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Bell size={18} /> Notifications
          </h2>
          <div className="flex items-center justify-between bg-base-200/50 p-3 rounded-lg">
            <label htmlFor="notif-toggle" className="text-sm cursor-pointer">
              Enable Message Notifications
            </label>
            <input
              id="notif-toggle"
              type="checkbox"
              className="toggle toggle-primary toggle-sm"
              checked={isNotificationsEnabled}
              onChange={toggleNotifications}
            />
          </div>
        </div>

        <div className="divider my-4"></div>

        {/* About Section */}
        <div>
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Info size={18} /> About SyncUp
          </h2>
          <p className="text-sm text-base-content/70">
            SyncUp v1.0.0 - A modern real-time chat application built with the MERN stack and Socket.IO. Connect and communicate seamlessly.
          </p>
        </div>

        <div className="divider my-4"></div>

        {/* Contact Us Section */}
        <div>
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Mail size={18} /> Contact Us
          </h2>
          <p className="text-sm text-base-content/70">
            For support or inquiries, please email us at:
            <a href="mailto:pbaishya31@gmail.com" className="link link-primary ml-1">
              pbaishya31@gmail.com
            </a>
          </p>
        </div>

        <div className="divider my-4"></div>

        {/* Logout Button */}
        <div>
          <button
            onClick={logout}
            className="btn btn-sm btn-error btn-outline flex items-center gap-2 w-full sm:w-auto"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
