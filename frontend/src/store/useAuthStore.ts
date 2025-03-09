import { create } from "zustand"
import { axiosInstance } from "../lib/axios"
import toast from "react-hot-toast"
import { io, Socket } from "socket.io-client"

interface User {
  _id: string
  fullName: string
  email: string
  createdAt: Date
  profilePic: string
}

interface SignupData {
  fullName: string
  email: string
  password: string
}

interface LoginData {
  email: string
  password: string
}

interface UpdateProfileData {
  profilePic: string
}

interface AuthStore {
  authUser: User | null
  isSigningUp: boolean
  isLoggingIn: boolean
  isUpdatingProfile: boolean
  isCheckingAuth: boolean
  onlineUsers: string[]
  socket: Socket | null

  checkAuth: () => Promise<void>
  signup: (data: SignupData) => Promise<void>
  login: (data: LoginData) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: UpdateProfileData) => Promise<void>
  connectSocket: () => void
  disconnectSocket: () => void
}

const BASE_URL =
  import.meta.env.MODE === "development" ? "http://localhost:5001" : "/"

export const useAuthStore = create<AuthStore>((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  onlineUsers: [],
  isCheckingAuth: true,
  socket: null,

  checkAuth: async () => {
    try {
      const response = await axiosInstance.get("/auth/check")
      set({ authUser: response.data })

      get().connectSocket()
    } catch (error) {
      console.error(error)
      set({ authUser: null })
    } finally {
      set({ isCheckingAuth: false })
    }
  },

  signup: async (data: SignupData) => {
    set({ isSigningUp: true })
    try {
      const res = await axiosInstance.post("/auth/signup", data)
      set({ authUser: res.data })
      toast.success("Account created successfully")

      get().connectSocket()
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      set({ isSigningUp: false })
    }
  },

  login: async (data: LoginData) => {
    set({ isLoggingIn: true })
    try {
      const res = await axiosInstance.post("/auth/login", data)
      set({ authUser: res.data })
      toast.success("Logged in successfully")

      get().connectSocket()
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      set({ isLoggingIn: false })
    }
  },

  logout: async () => {
    try {
      console.log("logging out")
      await axiosInstance.post("/auth/logout")
      set({ authUser: null })
      toast.success("Logged out successfully")

      get().disconnectSocket()
    } catch (error) {
      toast.error((error as Error).message)
    }
  },

  updateProfile: async (data: UpdateProfileData) => {
    set({ isUpdatingProfile: true })
    try {
      const res = await axiosInstance.put("/auth/update-profile", data)
      set({ authUser: res.data })
      toast.success("Profile updated successfully")
    } catch (error) {
      console.log("error in update profile:", error)
      toast.error((error as Error).message)
    } finally {
      set({ isUpdatingProfile: false })
    }
  },

  connectSocket: () => {
    const { authUser } = get()
    if (!authUser || get().socket?.connected) return

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    })

    socket.connect()
    set({ socket })

    socket.on("getOnlineUsers", (userIds: string[]) => {
      set({ onlineUsers: userIds })
    })
  },

  disconnectSocket: () => {
    if (get().socket?.connected) {
      get().socket?.disconnect()
      set({ socket: null })
    }
  },
}))
