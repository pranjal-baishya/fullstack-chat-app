import { X } from "lucide-react"
import { useAuthStore } from "../store/useAuthStore"
import { useChatStore } from "../store/useChatStore"
import { formatRelativeTime } from "../lib/utils"

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore()
  const { onlineUsers } = useAuthStore()

  if (!selectedUser) {
    return (
      <div className="p-2.5 border-b border-base-300 h-[68px]">
      </div>
    )
  }

  const isOnline = onlineUsers.includes(selectedUser._id)

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="avatar flex-shrink-0 relative w-10 h-10">
            <img
              src={selectedUser.profilePic || "/avatar.png"}
              alt={selectedUser.fullName}
              className="w-full h-full rounded-full object-cover"
            />
            {isOnline && (
              <span
                className="absolute bottom-0 right-0 size-3 bg-green-500
                rounded-full ring-2 ring-base-100"
              />
            )}
          </div>

          <div className="min-w-0">
            <h3 className="font-medium truncate">{selectedUser.fullName}</h3>
            <div className="text-sm text-base-content/70 mt-0.5">
              {isOnline
                ? <span className="text-green-500">Online</span>
                : <span>Last seen: {formatRelativeTime(selectedUser.lastSeen)}</span>
              }
            </div>
          </div>
        </div>

        <button className="flex-shrink-0 ml-2" onClick={() => setSelectedUser?.(null)}>
          <X />
        </button>
      </div>
    </div>
  )
}
export default ChatHeader
