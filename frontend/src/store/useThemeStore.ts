import { create } from "zustand"
import { THEMES } from "../lib/constants"

interface ThemeStore {
  theme: typeof THEMES[number]
  setTheme: (theme: string) => void
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: localStorage.getItem("chat-theme") ?? "coffee",
  setTheme: (theme: string) => {
    localStorage.setItem("chat-theme", theme)
    set({ theme })
  },
}))
