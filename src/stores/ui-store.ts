import { create } from 'zustand'

interface UIStore {
  sidebarOpen: boolean
  isMobile: boolean
  activeModal: string | null
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setMobile: (mobile: boolean) => void
  openModal: (modalId: string) => void
  closeModal: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  isMobile: false,
  activeModal: null,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setMobile: (mobile) => set({ isMobile: mobile, sidebarOpen: !mobile }),
  openModal: (modalId) => set({ activeModal: modalId }),
  closeModal: () => set({ activeModal: null }),
}))
