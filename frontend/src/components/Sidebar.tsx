import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users } from "lucide-react";
import { formatRelativeTime } from "../lib/utils";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading, unreadCounts } = useChatStore();

  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Contacts</span>
        </div>
        {/* TODO: Online filter toggle */}
        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">({onlineUsers.length - 1} online)</span>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {filteredUsers.map((user) => {
            const isOnline = onlineUsers.includes(user._id);
            const count = unreadCounts[user._id] || 0;

            return (
              <button
                key={user._id}
                onClick={() => setSelectedUser?.(user)}
                className={`
                  w-full p-3 flex items-center gap-3 relative
                  hover:bg-base-300 transition-colors
                  ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
                `}
              >
                <div className="relative mx-auto lg:mx-0">
                  <img
                    src={user.profilePic || "/avatar.png"}
                    alt={user.fullName}
                    className="size-12 object-cover rounded-full"
                  />
                  {isOnline && (
                    <span
                      className="absolute bottom-0 right-0 size-3 bg-green-500
                      rounded-full ring-2 ring-zinc-900"
                    />
                  )}
                </div>

                {/* User info - only visible on larger screens */}
                <div className="hidden lg:block text-left min-w-0">
                  <div className="font-medium truncate">{user.fullName}</div>
                  <div className="text-sm text-zinc-400">
                    {/* Display Online or formatted Last Seen time */}
                    {isOnline
                        ? <span className="text-green-500">Online</span>
                        : <span>Last seen: {formatRelativeTime(user.lastSeen)}</span>
                    }
                  </div>
                </div>

                {count > 0 && (
                     <span className="absolute top-2 right-2 lg:right-4 h-5 min-w-[1.25rem] px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-medium">
                        {count > 9 ? '9+' : count}
                    </span>
                 )}

              </button>
            )
          }
        )}

        {filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4">No online users</div>
        )}
      </div>
    </aside>
  );
};
export default Sidebar;