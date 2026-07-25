import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AvatarStore {
  avatarUrl: string
  setAvatar: (url: string) => void
  removeAvatar: () => void
}

export const useAvatarStore = create<AvatarStore>()(
  persist(
    (set) => ({
      avatarUrl: '',
      setAvatar: (url) => set({ avatarUrl: url }),
      removeAvatar: () => set({ avatarUrl: '' }),
    }),
    {
      name: 'vocab-app-dashboard-avatar',
    },
  ),
)

/** Convert a File (image/GIF/video) to a base64 data URL so it survives page reloads. */
export function fileToBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}
