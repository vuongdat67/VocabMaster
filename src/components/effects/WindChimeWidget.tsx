import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wind, X, Volume2, VolumeX, GripHorizontal } from 'lucide-react'
import { playWindChime, playCelebrationBells } from '@/lib/sound-manager'
import { useSettingsStore } from '@/stores/settings-store'

type PositionKey = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
type SizeVariant = 'small' | 'medium' | 'large'

interface Position {
 top?: string
 bottom?: string
 left?: string
 right?: string
}

const PRESET_POSITIONS: Record<PositionKey, Position> = {
 'bottom-right': { bottom: '80px', right: '16px' },
 'bottom-left': { bottom: '80px', left: '16px' },
 'top-right': { top: '72px', right: '16px' },
 'top-left': { top: '72px', left: '16px' },
}

export function WindChimeWidget() {
 const [isOpen, setIsOpen] = useState(false)
 const [hovered, setHovered] = useState(false)
 const [customPos, setCustomPos] = useState<{ x: number; y: number } | null>(null)
 const [size, setSize] = useState<SizeVariant>('medium')
 const [isDragging, setIsDragging] = useState(false)
 const [soundEnabled, setSoundEnabledLocal] = useState(true)
 const [volume, setVolumeLocal] = useState(0.7)
 const widgetRef = useRef<HTMLDivElement>(null)
 const dragStart = useRef({ x: 0, y: 0 })
 const { settings, updateSettings } = useSettingsStore()

 const isSoundOn = settings.soundEnabled && soundEnabled

 // Random wind chime when idle
 useEffect(() => {
 if (!isSoundOn || !isOpen) return
 const interval = setInterval(() => {
 if (Math.random() > 0.6) playWindChime(0.15 + Math.random() * 0.25)
 }, 7000)
 return () => clearInterval(interval)
 }, [isSoundOn, isOpen])

 const handleToggle = useCallback(() => {
 const next = !isSoundOn
 setSoundEnabledLocal(next)
 if (next) {
 playWindChime(0.5)
 updateSettings({ soundEnabled: true })
 } else {
 updateSettings({ soundEnabled: false })
 }
 }, [isSoundOn, updateSettings])

 const handleChimeClick = useCallback(() => {
 playWindChime(0.7)
 setIsOpen(!isOpen)
 }, [isOpen])

 const handleDragStart = useCallback((e: React.PointerEvent) => {
 setIsDragging(true)
 dragStart.current = { x: e.clientX, y: e.clientY }
 const el = widgetRef.current
 if (el) {
 el.setPointerCapture(e.pointerId)
 }
 }, [])

 const handleDragMove = useCallback((e: React.PointerEvent) => {
 if (!isDragging) return
 const dx = e.clientX - dragStart.current.x
 const dy = e.clientY - dragStart.current.y
 setCustomPos((prev) => ({
 x: (prev?.x ?? 0) + dx,
 y: (prev?.y ?? 0) + dy,
 }))
 dragStart.current = { x: e.clientX, y: e.clientY }
 }, [isDragging])

 const handleDragEnd = useCallback(() => {
 setIsDragging(false)
 }, [])

 const posKey = 'bottom-right'
 const presetPos = PRESET_POSITIONS[posKey]
 const pos: Position = customPos
 ? { bottom: `${-customPos.y + 80}px`, right: `${-customPos.x + 16}px` }
 : presetPos

 const sizeMap: Record<SizeVariant, string> = {
 small: 'w-10 h-10',
 medium: 'w-12 h-12',
 large: 'w-14 h-14',
 }

 const iconMap: Record<SizeVariant, string> = {
 small: 'w-5 h-5',
 medium: 'w-6 h-6',
 large: 'w-7 h-7',
 }

 return (
 <div
 ref={widgetRef}
 className="fixed z-[60]"
 style={pos}
 onPointerMove={handleDragMove}
 onPointerUp={handleDragEnd}
 onPointerCancel={handleDragEnd}
 >
 {/* Main chime icon */}
 <motion.div
 className={`relative ${sizeMap[size]} rounded-full flex items-center justify-center cursor-pointer select-none`}
 style={{
 background: isSoundOn
 ? 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))'
 : 'rgba(156,163,175,0.1)',
 border: `1.5px solid ${isSoundOn ? 'rgba(99,102,241,0.3)' : 'rgba(156,163,175,0.2)'}`,
 backdropFilter: 'blur(12px)',
 WebkitBackdropFilter: 'blur(12px)',
 }}
 animate={
 hovered
 ? {
 rotate: [0, -8, 8, -5, 5, 0],
 scale: 1.1,
 }
 : isDragging
 ? { scale: 1.15 }
 : {
 rotate: [0, 2, -1, 1, 0],
 }
 }
 transition={{
 rotate: hovered
 ? { duration: 0.4, ease: 'easeInOut' }
 : { duration: 3, repeat: Infinity, ease: 'easeInOut' },
 scale: { type: 'spring', stiffness: 300, damping: 15 },
 }}
 onMouseEnter={() => {
 setHovered(true)
 if (isSoundOn) playWindChime(0.3)
 }}
 onMouseLeave={() => setHovered(false)}
 onClick={handleChimeClick}
 onPointerDown={handleDragStart}
 >
 {isSoundOn ? (
 <Wind className={`${iconMap[size]} text-indigo-400/80`} />
 ) : (
 <VolumeX className={`${iconMap[size]} text-gray-400/60`} />
 )}

 {/* Ripple effect */}
 {hovered && isSoundOn && (
 <motion.span
 className="absolute inset-0 rounded-full"
 initial={{ opacity: 0.4, scale: 1 }}
 animate={{ opacity: 0, scale: 1.5 }}
 transition={{ duration: 0.6, ease: 'easeOut' }}
 style={{
 border: '1.5px solid rgba(99,102,241,0.2)',
 }}
 />
 )}
 </motion.div>

 {/* Expand panel */}
 <AnimatePresence>
 {isOpen && (
 <motion.div
 initial={{ opacity: 0, y: -8, scale: 0.96 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: -8, scale: 0.96 }}
 className="absolute bottom-full right-0 mb-3 w-56 bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/60 shadow-xl overflow-hidden"
 >
 <div className="p-3 space-y-3">
 <div className="flex items-center justify-between">
 <span className="text-xs font-semibold text-gray-600 ">
 🎐 Gió
 </span>
 <button
 onClick={(e) => { e.stopPropagation(); setIsOpen(false) }}
 className="p-0.5 rounded hover:bg-gray-100 :bg-gray-800 text-gray-400"
 >
 <X className="w-3 h-3" />
 </button>
 </div>

 {/* Sound toggle */}
 <div className="flex items-center justify-between">
 <span className="text-xs text-gray-500 ">Âm thanh</span>
 <button
 onClick={(e) => { e.stopPropagation(); handleToggle() }}
 className={`relative w-9 h-5 rounded-full transition-colors ${
 isSoundOn
 ? 'bg-indigo-500'
 : 'bg-gray-300 '
 }`}
 >
 <motion.div
 className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
 animate={{ x: isSoundOn ? 16 : 0 }}
 transition={{ type: 'spring', stiffness: 500, damping: 30 }}
 />
 </button>
 </div>

 {/* Volume slider */}
 {isSoundOn && (
 <div>
 <div className="flex items-center justify-between">
 <span className="text-xs text-gray-500 ">Âm lượng</span>
 <span className="text-[10px] text-gray-400">{Math.round(volume * 100)}%</span>
 </div>
 <input
 type="range"
 min="0"
 max="100"
 value={volume * 100}
 onChange={(e) => setVolumeLocal(parseInt(e.target.value) / 100)}
 className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[var(--accent-500)]"
 style={{
 background: `linear-gradient(to right, var(--accent-500) ${volume * 100}%, #e5e7eb ${volume * 100}%)`,
 }}
 />
 </div>
 )}

 {/* Size picker */}
 <div>
 <span className="text-xs text-gray-500 block mb-1">Kích thước</span>
 <div className="flex gap-1">
 {(['small', 'medium', 'large'] as SizeVariant[]).map((s) => (
 <button
 key={s}
 onClick={(e) => { e.stopPropagation(); setSize(s) }}
 className={`flex-1 py-1 text-xs rounded-lg transition-colors ${
 size === s
 ? 'bg-indigo-100 text-indigo-700 '
 : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
 }`}
 >
 {s === 'small' ? 'Nhỏ' : s === 'medium' ? 'Vừa' : 'Lớn'}
 </button>
 ))}
 </div>
 </div>

 {/* Random chime button */}
 {isSoundOn && (
 <button
 onClick={(e) => {
 e.stopPropagation()
 playCelebrationBells()
 }}
 className="w-full py-1.5 text-xs rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 hover:from-indigo-100 hover:to-purple-100 transition-colors border border-indigo-200/50 "
 >
 🎵 Thử chuông gió
 </button>
 )}

 <p className="text-[10px] text-gray-400 text-center">
 Kéo icon để di chuyển
 </p>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 )
}
