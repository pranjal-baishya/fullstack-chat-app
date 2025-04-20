import { useEffect, useState } from "react"
import { useChatStore } from "../store/useChatStore"
import { useAuthStore } from "../store/useAuthStore"
import SidebarSkeleton from "./skeletons/SidebarSkeleton"
import {
  Search,
  MessagesSquare,
  MoreVertical,
  Pin,
  VolumeX,
  Volume2,
  Star,
} from "lucide-react"
import { formatRelativeTime } from "../lib/utils"
import { useUISettingsStore } from "../store/useUISettingsStore"

const Sidebar = () => {
  const {
    getUsers,
    users,
    selectedUser,
    setSelectedUser,
    isUsersLoading,
    unreadCounts,
    toggleFavourite,
  } = useChatStore()
  const { onlineUsers } = useAuthStore()
  const { mutedUserIds, toggleMuteUser, pinnedUserIds, togglePinUser } =
    useUISettingsStore()

  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState("All")

  useEffect(() => {
    getUsers()
  }, [getUsers])

  const sortedUsers = [...users].sort((a, b) => {
    const isAPinned = pinnedUserIds.includes(a._id)
    const isBPinned = pinnedUserIds.includes(b._id)
    if (isAPinned && !isBPinned) return -1
    if (!isAPinned && isBPinned) return 1
    return 0
  })

  const filteredUsers = sortedUsers.filter((user) => {
    const nameMatch = user.fullName
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    if (!nameMatch) return false

    switch (activeFilter) {
      case "Unread":
        return (unreadCounts[user._id] || 0) > 0
      case "Favourites":
        return user.isFavourite === true

      case "All":
      default:
        return true
    }
  })

  const usersToDisplay = filteredUsers

  const handleToggleMute = (userId: string) => {
    toggleMuteUser(userId)
  }
  const handleTogglePin = (userId: string) => {
    togglePinUser(userId)
  }

  if (isUsersLoading) return <SidebarSkeleton />

  return (
    <aside className="h-full w-96 min-w-80 max-w-md bg-base-100 border-r border-base-300 flex flex-col">
      <div className="p-4 border-b border-base-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessagesSquare size={22} className="text-primary" />
            <h1 className="text-xl font-bold">SyncUp Chats</h1>
          </div>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search chats..."
            className="input input-bordered input-sm w-full pl-8 bg-base-200 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
            <Search size={16} className="text-base-content/50" />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          {["All", "Unread", "Favourites"].map((filter) => (
            <button
              key={filter}
              className={`btn btn-xs ${
                activeFilter === filter ? "btn-primary" : "btn-ghost"
              }`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-y-auto w-full flex-1">
        {usersToDisplay.map((user) => {
          const isOnline = onlineUsers.includes(user._id)
          const isSelected = selectedUser?._id === user._id
          const isMuted = mutedUserIds.includes(user._id)
          const isPinned = pinnedUserIds.includes(user._id)
          const isFavourite = user.isFavourite === true
          const count = unreadCounts[user._id] || 0

          return (
            <div
              key={user._id}
              className={`
                relative group flex items-center justify-between border-l-4 transition-colors duration-150 ease-in-out
                ${
                  isSelected
                    ? "bg-base-200 border-primary"
                    : "border-transparent hover:bg-base-300/50"
                }
                ${isPinned ? "bg-base-200/50" : ""}
              `}
            >
              <button
                onClick={() => setSelectedUser?.(user)}
                className={`flex-1 p-3 flex items-center gap-3 w-full`}
              >
                <div className="relative mx-0 flex-shrink-0">
                  {isPinned && (
                    <Pin
                      size={12}
                      className="absolute top-0 left-0 text-info -translate-x-1 -translate-y-1 z-10 rotate-45"
                    />
                  )}
                  <img
                    src={user.profilePic || "/avatar.png"}
                    alt={user.fullName}
                    className="size-12 object-cover rounded-full"
                  />
                  {isOnline && (
                    <span
                      className="absolute bottom-0 right-0 size-3 bg-green-500
                        rounded-full ring-2 ring-base-100"
                    />
                  )}
                </div>

                <div className="text-left min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`truncate ${isPinned ? "font-semibold" : ""}`}
                    >
                      {user.fullName}
                    </span>
                    {isMuted && (
                      <VolumeX
                        size={14}
                        className="text-base-content/50 flex-shrink-0 ml-2"
                      />
                    )}
                  </div>
                  <div className="text-sm text-base-content/60">
                    {isOnline ? (
                      <span className="text-green-500">Online</span>
                    ) : (
                      <span>
                        Last seen: {formatRelativeTime(user.lastSeen)}
                      </span>
                    )}
                  </div>
                </div>

                {count > 0 && (
                  <span className="h-5 ml-2 min-w-[1.25rem] px-1.5 flex-shrink-0 flex items-center justify-center rounded-full bg-primary text-primary-content text-xs font-medium">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </button>

              <div className="dropdown dropdown-left mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <button
                  tabIndex={0}
                  role="button"
                  className="btn btn-xs btn-ghost btn-circle"
                >
                  <MoreVertical size={18} />
                </button>
                <ul
                  tabIndex={0}
                  className="dropdown-content z-[50] menu p-2 shadow bg-base-100 rounded-box w-48 text-sm"
                >
                  <li>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTogglePin(user._id)
                      }}
                    >
                      {isPinned ? (
                        <Pin size={16} className="text-info rotate-45" />
                      ) : (
                        <Pin size={16} />
                      )}
                      {isPinned ? "Unpin Chat" : "Pin Chat"}
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleMute(user._id)
                      }}
                    >
                      {isMuted ? <Volume2 size={16} /> : <VolumeX size={16} />}
                      {isMuted ? "Unmute" : "Mute"}
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavourite(user._id)
                      }}
                    >
                      <Star
                        size={16}
                        fill={isFavourite ? "currentColor" : "none"}
                        className={isFavourite ? "text-amber-400" : ""}
                      />
                      {isFavourite ? "Unfavourite" : "Favourite"}
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          )
        })}
        {usersToDisplay.length === 0 && users.length > 0 && (
          <div className="text-center text-base-content/60 py-4">
            {searchTerm
              ? "No matching contacts"
              : activeFilter !== "All"
              ? `No contacts in ${activeFilter}`
              : "No contacts found"}
          </div>
        )}
        {users.length === 0 && !isUsersLoading && (
          <div className="text-center text-base-content/60 py-4">
            No contacts found.
          </div>
        )}
      </div>
    </aside>
  )
}
export default Sidebar
