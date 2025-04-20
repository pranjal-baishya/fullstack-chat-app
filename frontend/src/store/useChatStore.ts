import { create } from "zustand"
import toast from "react-hot-toast"
import { axiosInstance } from "../lib/axios"
import { useAuthStore } from "./useAuthStore"
import { useUISettingsStore } from "./useUISettingsStore"

export type MessageStatus = "sent" | "delivered" | "read"

interface Reaction {
  _id: string
  emoji: string
  userId: {
    _id: string
    fullName: string
    profilePic: string
  }
}

interface Message {
  _id: string
  text?: string
  image?: string
  senderId: string
  receiverId: string
  createdAt: Date | string
  status: MessageStatus
  reactions?: Reaction[]
}

interface User {
  _id: string
  fullName: string
  email: string
  profilePic: string
  lastSeen?: Date | string | null
  isFavourite?: boolean
}

interface GetMessagesResponse {
  messages: Message[]
  hasMore: boolean
}

interface ChatStore {
  messages: Message[]
  users: User[]
  selectedUser: User | null
  unreadCounts: { [userId: string]: number }
  setSelectedUser: (user: User | null) => void
  isUsersLoading: boolean
  isMessagesLoading: boolean
  isLoadingMore: boolean
  hasMoreMessages: boolean

  getUsers: () => Promise<void>
  getMessages: (userId: string, cursor?: string) => Promise<void>
  sendMessage: (messageData: { text?: string; image?: string }) => Promise<void>
  subscribeToMessages: () => void
  unsubscribeFromMessages: () => void
  markMessagesAsRead: (conversationPartnerId: string) => void
  resetUnreadCount: (userId: string) => void
  toggleReaction: (messageId: string, emoji: string) => Promise<void>
  toggleFavourite: (userId: string) => Promise<void>
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  unreadCounts: {},
  isUsersLoading: false,
  isMessagesLoading: false,
  isLoadingMore: false,
  hasMoreMessages: true,

  resetUnreadCount: (userId: string) => {
    set((state) => {
      const newCounts = { ...state.unreadCounts }
      if (newCounts[userId] > 0) {
        console.log(`Resetting unread count for user ${userId}`)
        delete newCounts[userId]
        return { unreadCounts: newCounts }
      }
      return state
    })
  },

  setSelectedUser: (user: User | null) => {
    set({ selectedUser: user })
    if (user) {
      get().markMessagesAsRead(user._id)
      get().resetUnreadCount(user._id)
    }
  },

  getUsers: async () => {
    set({ isUsersLoading: true })
    try {
      const res = await axiosInstance.get("/messages/users")
      set({ users: res.data })
    } catch (error) {
      toast.error("Failed to fetch users: " + (error as Error).message)
    } finally {
      set({ isUsersLoading: false })
    }
  },

  getMessages: async (userId: string, cursor?: string) => {
    const isLoadingInitial = !cursor
    if (isLoadingInitial) {
      set({ isMessagesLoading: true, messages: [], hasMoreMessages: true })
    } else {
      set({ isLoadingMore: true })
    }

    const { authUser } = useAuthStore.getState()
    if (!authUser) {
      set({ isMessagesLoading: false, isLoadingMore: false })
      return
    }

    try {
      const params = cursor ? { cursor } : {}
      const res = await axiosInstance.get<GetMessagesResponse>(
        `/messages/${userId}`,
        {
          params,
        }
      )
      const { messages: fetchedMessages, hasMore } = res.data

      set((state) => ({
        messages: cursor
          ? [...fetchedMessages, ...state.messages]
          : fetchedMessages,
        hasMoreMessages: hasMore,
      }))

      if (isLoadingInitial) {
        get().markMessagesAsRead(userId)
        get().resetUnreadCount(userId)
      }
    } catch (error) {
      toast.error("Failed to fetch messages: " + (error as Error).message)
      if (isLoadingInitial) {
        set({ messages: [] })
      }
    } finally {
      if (isLoadingInitial) {
        set({ isMessagesLoading: false })
      }
      set({ isLoadingMore: false })
    }
  },

  sendMessage: async (messageData: { text?: string; image?: string }) => {
    const { selectedUser, messages } = get()
    const { authUser } = useAuthStore.getState()
    if (!selectedUser || !authUser) return

    const optimisticMessage: Message = {
      _id: Math.random().toString(36).substring(2, 15),
      senderId: authUser._id,
      receiverId: selectedUser._id,
      createdAt: new Date(),
      status: "sent",
      ...(messageData.text && { text: messageData.text }),
      ...(messageData.image && { image: messageData.image }),
    }

    set({ messages: [...messages, optimisticMessage] })

    try {
      const res = await axiosInstance.post<Message>(
        `/messages/send/${selectedUser._id}`,
        messageData
      )
      const sentMessage = res.data
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === optimisticMessage._id ? sentMessage : msg
        ),
      }))
    } catch (error) {
      toast.error("Failed to send message: " + (error as Error).message)
      set((state) => ({
        messages: state.messages.filter(
          (msg) => msg._id !== optimisticMessage._id
        ),
      }))
    }
  },

  toggleReaction: async (messageId: string, emoji: string) => {
    const { authUser } = useAuthStore.getState()
    if (!authUser) {
      toast.error("User not authenticated")
      return
    }

    const currentMessages = get().messages
    const messageIndex = currentMessages.findIndex(
      (msg) => msg._id === messageId
    )
    if (messageIndex === -1) {
      toast.error("Message not found locally")
      return
    }

    const originalMessage = currentMessages[messageIndex]
    const existingReactions = originalMessage.reactions || []
    const currentUserReactionIndex = existingReactions.findIndex(
      (r) => r.emoji === emoji && r.userId._id === authUser._id
    )

    let optimisticReactions: Reaction[]
    if (currentUserReactionIndex > -1) {
      optimisticReactions = existingReactions.filter(
        (_, index) => index !== currentUserReactionIndex
      )
    } else {
      const tempReaction: Reaction = {
        _id: Math.random().toString(36).substring(2, 15),
        emoji,
        userId: {
          _id: authUser._id,
          fullName: authUser.fullName,
          profilePic: authUser.profilePic,
        },
      }
      optimisticReactions = [...existingReactions, tempReaction]
    }

    const optimisticMessages = [...currentMessages]
    optimisticMessages[messageIndex] = {
      ...originalMessage,
      reactions: optimisticReactions,
    }

    set({ messages: optimisticMessages })

    try {
      const res = await axiosInstance.post<Message>(
        `/messages/${messageId}/reactions`,
        { emoji }
      )
      const updatedMessageFromServer = res.data

      // Update state with server response (reconcile)
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? updatedMessageFromServer : msg
        ),
      }))
    } catch (error) {
      toast.error("Failed to update reaction: " + (error as Error).message)
      // Revert optimistic update on error
      set({ messages: currentMessages })
    }
  },

  markMessagesAsRead: (conversationPartnerId: string) => {
    const socket = useAuthStore.getState().socket
    const { authUser } = useAuthStore.getState()
    if (!socket || !authUser) return

    const hasUnread = get().messages.some(
      (msg) =>
        msg.senderId === conversationPartnerId &&
        msg.receiverId === authUser._id &&
        msg.status !== "read"
    )

    if (hasUnread) {
      console.log(
        `Emitting mark-messages-as-read for partner: ${conversationPartnerId}`
      )
      socket.emit("mark-messages-as-read", { conversationPartnerId })
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket
    const { authUser } = useAuthStore.getState()
    if (!socket || !authUser) return

    socket.off("newMessage")
    socket.off("message-delivered")
    socket.off("messages-read")
    socket.off("message-reaction-update")

    socket.on("newMessage", (newMessage: Message) => {
      console.log("Received newMessage event:", newMessage)
      const { selectedUser, users } = get()
      const senderId = newMessage.senderId
      const isChatOpen = selectedUser && senderId === selectedUser._id

      if (isChatOpen) {
        set((state) => ({ messages: [...state.messages, newMessage] }))
        get().markMessagesAsRead(senderId)
      } else if (senderId !== authUser?._id) {
        // Increment unread count
        set((state) => {
          const newCounts = { ...state.unreadCounts }
          newCounts[senderId] = (newCounts[senderId] || 0) + 1
          console.log(
            `Incremented unread count for ${senderId}:`,
            newCounts[senderId]
          )
          return { unreadCounts: newCounts }
        })

        // Check notification settings AND muted status
        const { isNotificationsEnabled, mutedUserIds } =
          useUISettingsStore.getState()
        const isMuted = mutedUserIds.includes(senderId)

        if (isNotificationsEnabled && !isMuted) {
          const sender = users.find((user) => user._id === senderId)
          toast(`New message from ${sender?.fullName ?? "Unknown"}`, {
            icon: "✉️",
          })
        } else {
          console.log(
            `Notification suppressed for ${senderId}: NotificationsEnabled=${isNotificationsEnabled}, IsMuted=${isMuted}`
          )
        }
      }
    })

    socket.on("message-delivered", ({ messageId }) => {
      console.log(`Received message-delivered event for message: ${messageId}`)
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, status: "delivered" } : msg
        ),
      }))
    })

    socket.on("messages-read", ({ readerId }) => {
      console.log(`Received messages-read event from reader: ${readerId}`)
      const { authUser } = useAuthStore.getState()
      if (!authUser) return

      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.senderId === authUser._id &&
          msg.receiverId === readerId &&
          msg.status !== "read"
            ? { ...msg, status: "read" }
            : msg
        ),
      }))
    })

    socket.on("message-reaction-update", ({ messageId, reactions }) => {
      console.log(
        `Received message-reaction-update for message ${messageId}:`,
        reactions
      )
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, reactions } : msg
        ),
      }))
    })
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket
    socket?.off("newMessage")
    socket?.off("message-delivered")
    socket?.off("messages-read")
    socket?.off("message-reaction-update")
    console.log("Unsubscribed from message events")
  },

  toggleFavourite: async (userId: string) => {
    // Optimistic Update:
    set((state) => ({
      users: state.users.map((user) =>
        user._id === userId ? { ...user, isFavourite: !user.isFavourite } : user
      ),
    }))

    try {
      // API Call
      await axiosInstance.put(`/users/${userId}/favourite`)
      // No need to update state again if API succeeds, optimistic update is done.
    } catch (error) {
      toast.error(
        "Failed to update favourite status: " + (error as Error).message
      )
      // Revert optimistic update on error
      set((state) => ({
        users: state.users.map((user) =>
          user._id === userId
            ? { ...user, isFavourite: !user.isFavourite }
            : user
        ),
      }))
    }
  },
}))
