import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { MascotWidget } from '@/components/mascot/MascotWidget'
import { WindChimeWidget } from '@/components/effects/WindChimeWidget'
import { FloatingParticles } from '@/components/effects/FloatingParticles'
import { ReviewReminder } from '@/components/effects/ReviewReminder'
import { startWindAmbient, stopWindAmbient } from '@/lib/sound-manager'
import { useUIStore } from '@/stores/ui-store'
import { useSettingsStore } from '@/stores/settings-store'
import { useAuthStore } from '@/stores/auth-store'

export function AppShell() {
 const { setMobile } = useUIStore()
 const { settings } = useSettingsStore()
 const initializeAuth = useAuthStore(state => state.initialize)

 useEffect(() => {
   initializeAuth()
 }, [initializeAuth])

 useEffect(() => {
 const checkMobile = () => setMobile(window.innerWidth < 768)
 checkMobile()
 window.addEventListener('resize', checkMobile)
 return () => window.removeEventListener('resize', checkMobile)
 }, [setMobile])

 // Gentle wind ambient sound
 useEffect(() => {
 if (settings.bgmEnabled) {
 startWindAmbient(0.12)
 }
 return () => stopWindAmbient()
 }, [settings.bgmEnabled])

 return (
 <div className="flex h-screen bg-gray-50">
 <Sidebar />
 <div className="flex-1 flex flex-col overflow-hidden">
 <Header />
 <main className="flex-1 overflow-y-auto p-4 lg:p-6 relative">
 <Outlet />
 </main>
 </div>
 <MascotWidget />
 <WindChimeWidget />
 <FloatingParticles />
 <ReviewReminder />
 </div>
 )
}
