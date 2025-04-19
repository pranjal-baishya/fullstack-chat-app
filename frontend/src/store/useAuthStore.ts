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
  lastSeen?: Date | null
}

interface RawUserData {
    _id: string;
    fullName: string;
    email: string;
    createdAt?: string;
    profilePic: string;
    lastSeen?: string | null;
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

// Helper function to parse user data, converting dates
function parseUserData(userData: RawUserData | null | undefined): User | null {
    if (!userData) {
        return null;
    }

    return {
        ...userData,
        _id: userData._id,
        fullName: userData.fullName,
        email: userData.email,
        profilePic: userData.profilePic,
        createdAt: userData.createdAt ? new Date(userData.createdAt) : new Date(),
        lastSeen: userData.lastSeen ? new Date(userData.lastSeen) : null,
    };
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  onlineUsers: [],
  isCheckingAuth: true,
  socket: null,

  checkAuth: async () => {
    set({ isCheckingAuth: true });
    try {
      const response = await axiosInstance.get<RawUserData>("/auth/check")
      const parsedUser = parseUserData(response.data);
      set({ authUser: parsedUser })
      if (parsedUser) {
        get().connectSocket()
      }
    } catch (error) {
      console.error("Check auth failed:", error)
      set({ authUser: null })
      get().disconnectSocket();
    } finally {
      set({ isCheckingAuth: false })
    }
  },

  signup: async (data: SignupData) => {
    set({ isSigningUp: true })
    try {
      const res = await axiosInstance.post<RawUserData>("/auth/signup", data)
      const parsedUser = parseUserData(res.data);
      set({ authUser: parsedUser })
      if(parsedUser) {
        toast.success("Account created successfully")
        get().connectSocket()
      } else {
        toast.error("Signup completed but failed to process user data.");
        set({ authUser: null });
      }
    } catch (error) {
      toast.error("Signup failed: " + (error as Error).message)
      set({ authUser: null });
    } finally {
      set({ isSigningUp: false })
    }
  },

  login: async (data: LoginData) => {
    set({ isLoggingIn: true })
    try {
      const res = await axiosInstance.post<RawUserData>("/auth/login", data)
      const parsedUser = parseUserData(res.data);
      set({ authUser: parsedUser })
      if(parsedUser) {
        toast.success("Logged in successfully")
        get().connectSocket()
      } else {
        toast.error("Login completed but failed to process user data.");
        set({ authUser: null });
      }
    } catch (error) {
      toast.error("Login failed: " + (error as Error).message)
      set({ authUser: null });
    } finally {
      set({ isLoggingIn: false })
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout")
      set({ authUser: null })
      toast.success("Logged out successfully")
      get().disconnectSocket()
    } catch (error) {
      toast.error("Logout failed: " + (error as Error).message)
    }
  },

  updateProfile: async (data: UpdateProfileData) => {
    set({ isUpdatingProfile: true })
    try {
      const res = await axiosInstance.put<RawUserData>("/auth/update-profile", data)
      const parsedUser = parseUserData(res.data);
      set({ authUser: parsedUser })
      if(parsedUser) {
        toast.success("Profile updated successfully")
      } else {
        toast.error("Profile update completed but failed to process user data.");
      }
    } catch (error) {
      console.log("Error in update profile:", error)
      toast.error("Profile update failed: " + (error as Error).message)
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
