import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { progressRepo } from '@/db/progress-repo'
import { useSettingsStore } from '@/stores/settings-store'
import { playWindChime } from '@/lib/sound-manager'

export function ReviewReminder() {
 const [dueCount, setDueCount] = useState(0)
 const [show, setShow] = useState(false)
 const [dismissed, setDismissed] = useState(false)
 const { settings } = useSettingsStore()
 const navigate = useNavigate()

 const checkDueWords = useCallback(async () => {
 try {
 const count = await progressRepo.getDueCount()
 setDueCount(count)
 if (count > 0 && !dismissed) {
 setShow(true)
 playWindChime(0.6)
 }
 } catch {
 // ignore
 }
 }, [dismissed])

 useEffect(() => {
 // Check immediately
 checkDueWords()

 // Then check every 30 minutes
 const interval = setInterval(checkDueWords, 30 * 60 * 1000)
 return () => clearInterval(interval)
 }, [checkDueWords])

 // Also check when user returns to tab
 useEffect(() => {
 const handleVisibility = () => {
 if (document.visibilityState === 'visible') {
 checkDueWords()
 }
 }
 document.addEventListener('visibilitychange', handleVisibility)
 return () => document.removeEventListener('visibilitychange', handleVisibility)
 }, [checkDueWords])

 if (dueCount === 0 || !show || dismissed) return null

 return (
 <AnimatePresence>
 <motion.div
 initial={{ x: 100, opacity: 0 }}
 animate={{ x: 0, opacity: 1 }}
 exit={{ x: 100, opacity: 0 }}
 className="fixed top-20 right-4 z-50 max-w-sm"
 >
 <div className="bg-white rounded-2xl shadow-2xl border border-indigo-100 p-4">
 <div className="flex items-start gap-3">
 <div className="p-2 bg-indigo-100 rounded-full">
 <Bell className="w-5 h-5 text-indigo-600" />
 </div>
 <div className="flex-1">
 <h4 className="font-semibold text-gray-900 text-sm">
 ⏰ Đến giờ ôn tập!
 </h4>
 <p className="text-xs text-gray-500 mt-1">
 Bạn có <strong className="text-indigo-600">{dueCount}</strong> từ cần ôn lại
 </p>
 <div className="flex gap-2 mt-3">
 <button
 onClick={() => {
 setDismissed(true)
 setShow(false)
 }}
 className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
 >
 Để sau
 </button>
 <button
 onClick={() => {
 setShow(false)
 navigate('/review')
 }}
 className="text-xs flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
 >
 Ôn ngay <ArrowRight className="w-3 h-3" />
 </button>
 </div>
 </div>
 <button
 onClick={() => { setShow(false); setDismissed(true) }}
 className="text-gray-300 hover:text-gray-500"
 >
 <X className="w-4 h-4" />
 </button>
 </div>
 </div>
 </motion.div>
 </AnimatePresence>
 )
}
