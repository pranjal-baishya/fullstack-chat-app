import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const NOTIFICATION_STORAGE_KEY = 'syncup-notifications-enabled';

// Function to safely get value from localStorage
const getInitialNotificationSetting = (): boolean => {
  try {
    const storedValue = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    // Default to true if nothing is stored or if parsing fails
    return storedValue === null ? true : JSON.parse(storedValue);
  } catch (error) {
    console.error("Error reading notification setting from localStorage:", error);
    return true; // Default to enabled on error
  }
};

interface UISettingsState {
  theme: string;
  setTheme: (theme: string) => void;
  isNotificationsEnabled: boolean;
  toggleNotifications: () => void;
  mutedUserIds: string[];
  toggleMuteUser: (userId: string) => void;
  pinnedUserIds: string[];
  togglePinUser: (userId: string) => void;
}

export const useUISettingsStore = create<UISettingsState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      isNotificationsEnabled: getInitialNotificationSetting(),
      toggleNotifications: () =>
        set((state) => ({ isNotificationsEnabled: !state.isNotificationsEnabled })),

      // Muted users state and action
      mutedUserIds: [],
      toggleMuteUser: (userId: string) => {
        const currentMuted = get().mutedUserIds;
        const isMuted = currentMuted.includes(userId);
        set({
          mutedUserIds: isMuted
            ? currentMuted.filter((id) => id !== userId)
            : [...currentMuted, userId],
        });
        console.log("Updated mutedUserIds:", get().mutedUserIds);
      },

      // Pinned users state and action
      pinnedUserIds: [],
      togglePinUser: (userId: string) => {
          const currentPinned = get().pinnedUserIds;
          const isPinned = currentPinned.includes(userId);
          set({ 
              pinnedUserIds: isPinned
                ? currentPinned.filter((id) => id !== userId)
                : [...currentPinned, userId],
           });
           console.log("Updated pinnedUserIds:", get().pinnedUserIds);
      }
    }),
    {
      name: 'ui-settings-storage', // LocalStorage key
      // Only persist theme, notifications, muted and pinned settings
      partialize: (state) => ({
        theme: state.theme,
        isNotificationsEnabled: state.isNotificationsEnabled,
        mutedUserIds: state.mutedUserIds,
        pinnedUserIds: state.pinnedUserIds,
      }),
    }
  )
); 