import { create } from "zustand"
import toast from "react-hot-toast"
import { axiosInstance } from "../lib/axios"
import { useAuthStore } from "./useAuthStore"

export type MessageStatus = 'sent' | 'delivered' | 'read';

interface Message {
  _id: string
  text?: string
  image?: string
  senderId: string
  receiverId: string
  createdAt: Date | string
  status: MessageStatus
}

interface User {
  _id: string
  fullName: string
  email: string
  profilePic: string
  lastSeen?: Date | string | null
}

interface ChatStore {
  messages: Message[]
  users: User[]
  selectedUser: User | null
  unreadCounts: { [userId: string]: number }
  setSelectedUser: (user: User | null) => void
  isUsersLoading: boolean
  isMessagesLoading: boolean

  getUsers: () => Promise<void>
  getMessages: (userId: string) => Promise<void>
  sendMessage: (messageData: { text?: string; image?: string }) => Promise<void>
  subscribeToMessages: () => void
  unsubscribeFromMessages: () => void
  markMessagesAsRead: (conversationPartnerId: string) => void
  resetUnreadCount: (userId: string) => void
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  unreadCounts: {},
  isUsersLoading: false,
  isMessagesLoading: false,

  resetUnreadCount: (userId: string) => {
    set((state) => {
        const newCounts = { ...state.unreadCounts };
        if (newCounts[userId] > 0) {
            console.log(`Resetting unread count for user ${userId}`);
            delete newCounts[userId];
            return { unreadCounts: newCounts };
        }
        return state;
    });
  },

  setSelectedUser: (user: User | null) => {
    set({ selectedUser: user })
    if (user) {
        get().markMessagesAsRead(user._id);
        get().resetUnreadCount(user._id);
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

  getMessages: async (userId: string) => {
    set({ isMessagesLoading: true })
    const { authUser } = useAuthStore.getState();
    if (!authUser) return set({ isMessagesLoading: false });

    try {
      const res = await axiosInstance.get<Message[]>(`/messages/${userId}`)
      const fetchedMessages = res.data;
      set({ messages: fetchedMessages })

      get().markMessagesAsRead(userId);
      get().resetUnreadCount(userId);

    } catch (error) {
      toast.error("Failed to fetch messages: " + (error as Error).message)
      set({ messages: [] })
    } finally {
      set({ isMessagesLoading: false })
    }
  },

  sendMessage: async (messageData: { text?: string; image?: string }) => {
    const { selectedUser, messages } = get()
    const { authUser } = useAuthStore.getState();
    if (!selectedUser || !authUser) return;

    const optimisticMessage: Message = {
        _id: Math.random().toString(36).substring(2, 15),
        senderId: authUser._id,
        receiverId: selectedUser._id,
        createdAt: new Date(),
        status: 'sent',
        ...(messageData.text && { text: messageData.text }),
        ...(messageData.image && { image: messageData.image }),
    };

    set({ messages: [...messages, optimisticMessage] })

    try {
      const res = await axiosInstance.post<Message>(
        `/messages/send/${selectedUser._id}`,
        messageData
      )
      const sentMessage = res.data;
      set((state) => ({
          messages: state.messages.map((msg) =>
              msg._id === optimisticMessage._id ? sentMessage : msg
          ),
      }));

    } catch (error) {
      toast.error("Failed to send message: " + (error as Error).message)
      set(state => ({
            messages: state.messages.filter(msg => msg._id !== optimisticMessage._id)
        }));
    }
  },

  markMessagesAsRead: (conversationPartnerId: string) => {
    const socket = useAuthStore.getState().socket;
    const { authUser } = useAuthStore.getState();
    if (!socket || !authUser) return;

    const hasUnread = get().messages.some(msg =>
        msg.senderId === conversationPartnerId &&
        msg.receiverId === authUser._id &&
        msg.status !== 'read'
    );

    if (hasUnread) {
         console.log(`Emitting mark-messages-as-read for partner: ${conversationPartnerId}`);
        socket.emit("mark-messages-as-read", { conversationPartnerId });
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket
    const { authUser } = useAuthStore.getState();
    if (!socket || !authUser) return;

    socket.off("newMessage");
    socket.off("message-delivered");
    socket.off("messages-read");

    socket.on("newMessage", (newMessage: Message) => {
        console.log("Received newMessage event:", newMessage);
        const { selectedUser, users } = get();
        const senderId = newMessage.senderId;

        const isChatOpen = selectedUser && senderId === selectedUser._id;

        if (isChatOpen) {
             set((state) => ({ messages: [...state.messages, newMessage] }));
            get().markMessagesAsRead(senderId);
        } else {
            if (senderId !== authUser._id) {
                set((state) => {
                    const newCounts = { ...state.unreadCounts };
                    newCounts[senderId] = (newCounts[senderId] || 0) + 1;
                    console.log(`Incremented unread count for ${senderId}:`, newCounts[senderId]);
                    return { unreadCounts: newCounts };
                });

                const sender = users.find(user => user._id === senderId);
                toast(`New message from ${sender?.fullName || 'Unknown'}`, {
                    icon: '✉️',
                });
            }
        }
    });

    socket.on("message-delivered", ({ messageId /*, receiverId */ }) => {
        console.log(`Received message-delivered event for message: ${messageId}`);
        set((state) => ({
            messages: state.messages.map((msg) =>
                msg._id === messageId
                    ? { ...msg, status: 'delivered' }
                    : msg
            ),
        }));
    });

    socket.on("messages-read", ({ readerId }) => {
        console.log(`Received messages-read event from reader: ${readerId}`);
        const { authUser } = useAuthStore.getState();
        if (!authUser) return;

        set((state) => ({
            messages: state.messages.map((msg) =>
                msg.senderId === authUser._id && msg.receiverId === readerId && msg.status !== 'read'
                    ? { ...msg, status: 'read' }
                    : msg
            ),
        }));
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket
    socket?.off("newMessage")
    socket?.off("message-delivered")
    socket?.off("messages-read")
    console.log("Unsubscribed from message events");
  },
}))
