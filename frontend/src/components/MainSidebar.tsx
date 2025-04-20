import { NavLink } from "react-router-dom"
import { MessagesSquare, Settings, Palette } from "lucide-react"
import { useAuthStore } from "../store/useAuthStore"

const MainSidebar = () => {
  const { authUser } = useAuthStore()

  return (
    <div className="w-16 h-screen flex flex-col items-center py-4 bg-base-200 border-r border-base-300">
      {/* Navigation Icons */}
      <nav className="flex flex-col items-center gap-4 flex-grow">
        {/* Chats Link */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `p-2 rounded-lg transition-colors duration-200 ${
              isActive
                ? "bg-primary text-primary-content"
                : "text-base-content/70 hover:bg-base-300"
            }`
          }
          title="Chats"
        >
          <MessagesSquare size={20} />
        </NavLink>

        {/* Theme Settings Link */}
        <NavLink
          to="/themes"
          className={({ isActive }) =>
            `p-2 rounded-lg transition-colors duration-200 ${
              isActive
                ? "bg-primary text-primary-content"
                : "text-base-content/70 hover:bg-base-300"
            }`
          }
          title="Themes"
        >
          <Palette size={20} />
        </NavLink>
      </nav>

      {/* Bottom Section - Profile Link */}
      <div className="flex flex-col items-center gap-4 mb-4">
        {authUser && (
          <>
            {/* Settings Link */}
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `p-2 rounded-lg transition-colors duration-200 ${
                  isActive
                    ? "bg-primary text-primary-content"
                    : "text-base-content/70 hover:bg-base-300"
                }`
              }
              title="Settings"
            >
              <Settings size={20} />
            </NavLink>
            <NavLink
              to="/profile"
              className="avatar transition-transform duration-200 ease-in-out hover:scale-110"
              title="Profile"
            >
              <div className="w-8 rounded-full">
                <img
                  src={authUser.profilePic || "/avatar.png"}
                  alt="User avatar"
                />
              </div>
            </NavLink>
          </>
        )}
      </div>
    </div>
  )
}

export default MainSidebar
