import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Image, Search, Check, Loader2, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { wordRepo } from '@/db/word-repo'
import { getImageForWord, isUnsplashConfigured } from '@/lib/image-search'
import type { Word } from '@/types/word'

type FilterMode = 'all' | 'has-image' | 'no-image'

/* ------------------------------------------------------------------ */
/* Lightbox modal for viewing full-size image */
/* ------------------------------------------------------------------ */
function Lightbox({ imageUrl, word, onClose }: { imageUrl: string; word: string; onClose: () => void }) {
 useEffect(() => {
 const handleKey = (e: KeyboardEvent) => {
 if (e.key === 'Escape') onClose()
 }
 document.addEventListener('keydown', handleKey)
 document.body.style.overflow = 'hidden'
 return () => {
 document.removeEventListener('keydown', handleKey)
 document.body.style.overflow = ''
 }
 }, [onClose])

 return (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
 onClick={onClose}
 >
 <motion.div
 initial={{ scale: 0.85, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 exit={{ scale: 0.85, opacity: 0 }}
 className="relative max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
 onClick={(e) => e.stopPropagation()}
 >
 {/* Header */}
 <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
 <h3 className="font-semibold text-gray-900 text-lg">{word}</h3>
 <button
 onClick={onClose}
 className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>
 {/* Image */}
 <div className="p-4 flex items-center justify-center bg-gray-50">
 <img
 src={imageUrl}
 alt={word}
 className="max-h-[70vh] w-auto object-contain rounded-lg"
 />
 </div>
 </motion.div>
 </motion.div>
 )
}

/* ------------------------------------------------------------------ */
/* ImagePlaceholder — colored box with first letter */
/* ------------------------------------------------------------------ */
function ImagePlaceholder({ word, size = 'normal' }: { word: string; size?: 'normal' | 'small' }) {
 const colors = [
 'from-indigo-400 to-indigo-500',
 'from-purple-400 to-purple-500',
 'from-pink-400 to-pink-500',
 'from-amber-400 to-amber-500',
 'from-emerald-400 to-emerald-500',
 'from-cyan-400 to-cyan-500',
 'from-rose-400 to-rose-500',
 'from-teal-400 to-teal-500',
 'from-sky-400 to-sky-500',
 'from-orange-400 to-orange-500',
 ]
 const idx = word.length % colors.length
 const gradient = colors[idx]!

 return (
 <div
 className={`bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold rounded-xl ${
 size === 'small' ? 'w-12 h-12 text-lg' : 'w-full h-full min-h-[120px] text-4xl'
 }`}
 >
 {word[0]?.toUpperCase() ?? '?'}
 </div>
 )
}

/* ------------------------------------------------------------------ */
/* Main ImageManagerPage */
/* ------------------------------------------------------------------ */
export function ImageManagerPage() {
 const [words, setWords] = useState<Word[]>([])
 const [loading, setLoading] = useState(true)
 const [processing, setProcessing] = useState(false)
 const [progress, setProgress] = useState(0)
 const [status, setStatus] = useState<string>('')
 const [hasUnsplash, setHasUnsplash] = useState(false)
 const [filter, setFilter] = useState<FilterMode>('all')
 const [lightbox, setLightbox] = useState<{ url: string; word: string } | null>(null)

 useEffect(() => {
 setHasUnsplash(isUnsplashConfigured())
 wordRepo.getAll().then((all) => {
 setWords(all)
 setLoading(false)
 })
 }, [])

 /* Filtered words */
 const filteredWords = words.filter((w) => {
 if (filter === 'has-image') return !!w.imageUrls[0]
 if (filter === 'no-image') return !w.imageUrls[0]
 return true
 })

 const wordsWithImages = words.filter((w) => w.imageUrls[0])
 const wordsWithoutImages = words.filter((w) => !w.imageUrls[0])

 const handleFetchAll = useCallback(async () => {
 const target = wordsWithoutImages
 setProcessing(true)
 setProgress(0)
 const total = target.length

 for (let i = 0; i < total; i++) {
 const w = target[i]!
 setStatus(`Đang tìm ảnh cho "${w.word}"... (${i + 1}/${total})`)

 const imgUrl = await getImageForWord(w.word)
 if (imgUrl) {
 await wordRepo.update(w.id, { imageUrls: [imgUrl] })
 setWords((prev) =>
 prev.map((pw) =>
 pw.id === w.id ? { ...pw, imageUrls: [imgUrl] } : pw
 )
 )
 }

 setProgress(i + 1)
 }

 setStatus(`Hoàn thanh! Da tim anh cho ${total} tu.`)
 setProcessing(false)
 }, [wordsWithoutImages])

 const handleSingleFetch = useCallback(async (word: Word) => {
 setStatus(`Dang tim anh cho "${word.word}"...`)
 const imgUrl = await getImageForWord(word.word)
 if (imgUrl) {
 await wordRepo.update(word.id, { imageUrls: [imgUrl] })
 setWords((prev) =>
 prev.map((pw) =>
 pw.id === word.id ? { ...pw, imageUrls: [imgUrl] } : pw
 )
 )
 setStatus(`Da them anh cho "${word.word}"`)
 }
 }, [])

 if (loading) {
 return (
 <div className="flex items-center justify-center h-64">
 <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
 </div>
 )
 }

 return (
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
 {/* ── Header ── */}
 <div className="flex items-center justify-between">
 <div>
 <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
 <Image className="w-6 h-6" />
 Quản lý hình ảnh
 </h2>
 <p className="text-sm text-gray-500">
 Xem và quản lý ảnh minh họa cho từ vựng
 </p>
 </div>
 </div>

 {/* ── API Status ── */}
 <Card className="p-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className={`w-3 h-3 rounded-full ${hasUnsplash ? 'bg-green-500' : 'bg-yellow-500'}`} />
 <div>
 <p className="font-medium text-gray-900">
 {hasUnsplash ? 'Unsplash API da ket noi' : 'Chua cau hinh Unsplash API'}
 </p>
 <p className="text-xs text-gray-400 mt-0.5">
 {hasUnsplash
 ? 'Da tim thay Access Key. Anh se duoc tai tu Unsplash.'
 : 'Tao file .env voi VITE_UNSPLASH_ACCESS_KEY=your_key. Hien dung placeholder.'}
 </p>
 </div>
 </div>
 </div>
 </Card>

 {/* ── Stats ── */}
 <div className="grid grid-cols-3 gap-4">
 <Card className="p-4 text-center bg-gradient-to-b from-white to-indigo-50 border-indigo-100">
 <p className="text-2xl font-bold text-indigo-600">{wordsWithImages.length}</p>
 <p className="text-xs text-gray-500 mt-1">Da co anh</p>
 </Card>
 <Card className="p-4 text-center bg-gradient-to-b from-white to-amber-50 border-amber-100">
 <p className="text-2xl font-bold text-amber-600">{wordsWithoutImages.length}</p>
 <p className="text-xs text-gray-500 mt-1">Can them anh</p>
 </Card>
 <Card className="p-4 text-center bg-gradient-to-b from-white to-emerald-50 border-emerald-100">
 <p className="text-2xl font-bold text-emerald-600">{words.length}</p>
 <p className="text-xs text-gray-500 mt-1">Tong so tu</p>
 </Card>
 </div>

 {/* ── Batch actions ── */}
 {wordsWithoutImages.length > 0 && (
 <Card className="p-6">
 <h3 className="font-semibold text-gray-900 mb-2">Tim anh hang loat</h3>
 <p className="text-sm text-gray-500 mb-4">
 Tu dong tim anh cho {wordsWithoutImages.length} tu chua co anh
 </p>

 {processing && (
 <div className="mb-4 space-y-2">
 <div className="flex items-center gap-2 text-sm text-indigo-600">
 <Loader2 className="w-4 h-4 animate-spin" />
 {status}
 </div>
 <div className="w-full bg-gray-200 rounded-full h-2">
 <motion.div
 className="h-full bg-indigo-500 rounded-full"
 initial={{ width: 0 }}
 animate={{ width: `${(progress / wordsWithoutImages.length) * 100}%` }}
 />
 </div>
 </div>
 )}

 {!processing && (
 <Button
 onClick={handleFetchAll}
 icon={<Search className="w-4 h-4" />}
 disabled={processing}
 >
 Tim anh cho tat ca ({wordsWithoutImages.length} tu)
 </Button>
 )}

 {status && !processing && status.startsWith('Da') && (
 <div className="mt-3 text-sm text-green-600">{status}</div>
 )}
 </Card>
 )}

 {/* ── Filter tabs ── */}
 <div className="flex items-center gap-2">
 <button
 onClick={() => setFilter('all')}
 className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
 filter === 'all'
 ? 'bg-indigo-100 text-indigo-700'
 : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
 }`}
 >
 Tat ca ({words.length})
 </button>
 <button
 onClick={() => setFilter('has-image')}
 className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
 filter === 'has-image'
 ? 'bg-indigo-100 text-indigo-700'
 : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
 }`}
 >
 Co anh ({wordsWithImages.length})
 </button>
 <button
 onClick={() => setFilter('no-image')}
 className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
 filter === 'no-image'
 ? 'bg-indigo-100 text-indigo-700'
 : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
 }`}
 >
 Chua co anh ({wordsWithoutImages.length})
 </button>
 </div>

 {/* ── Image grid ── */}
 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
 {filteredWords.map((w, i) => (
 <motion.div
 key={w.id}
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: i * 0.02 }}
 >
 <Card className="p-0 overflow-hidden hover:shadow-lg transition-shadow group">
 {/* Image area */}
 <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
 {w.imageUrls[0] ? (
 <img
 src={w.imageUrls[0]}
 alt={w.word}
 className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
 onClick={() => w.imageUrls[0] && setLightbox({ url: w.imageUrls[0], word: w.word })}
 onError={(e) => {
 // Hide broken image, show placeholder instead
 (e.target as HTMLImageElement).style.display = 'none'
 const parent = (e.target as HTMLImageElement).parentElement
 if (parent) {
 const placeholder = document.createElement('div')
 placeholder.className = 'w-full h-full'
 placeholder.innerHTML = `<div class="bg-gradient-to-br from-gray-300 to-gray-400 w-full h-full flex items-center justify-center text-white font-bold text-4xl">${w.word[0]?.toUpperCase() ?? '?'}</div>`
 parent.appendChild(placeholder)
 }
 }}
 />
 ) : (
 <div className="w-full h-full">
 <ImagePlaceholder word={w.word} />
 </div>
 )}

 {/* Overlay action for words without images */}
 {!w.imageUrls[0] && !processing && (
 <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
 <button
 onClick={() => handleSingleFetch(w)}
 className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/90 rounded-lg text-indigo-600 hover:bg-white shadow"
 title="Tim anh cho tu nay"
 >
 <Search className="w-4 h-4" />
 </button>
 </div>
 )}
 </div>

 {/* Word info */}
 <div className="p-3">
 <div className="flex items-start justify-between gap-1">
 <div className="min-w-0 flex-1">
 <p className="text-sm font-semibold text-gray-900 truncate">{w.word}</p>
 <p className="text-xs text-gray-400 truncate mt-0.5">
 {w.definitions[0]?.vietnamese}
 </p>
 </div>
 {w.imageUrls[0] && (
 <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
 )}
 </div>
 </div>
 </Card>
 </motion.div>
 ))}
 </div>

 {/* ── Empty state ── */}
 {filteredWords.length === 0 && (
 <Card className="p-12 text-center">
 <Image className="w-12 h-12 mx-auto mb-3 text-gray-300" />
 <h3 className="font-semibold text-gray-700 mb-1">Khong co tu nao</h3>
 <p className="text-sm text-gray-400">
 {filter === 'has-image'
 ? 'Chua co tu nao co anh. Hay them anh cho tu vung!'
 : filter === 'no-image'
 ? 'Tat ca tu da co anh roi!'
 : 'Chua co tu vung nao. Hay them tu vung truoc!'}
 </p>
 </Card>
 )}

 {/* ── Setup instructions ── */}
 {!hasUnsplash && (
 <Card className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
 <h3 className="font-semibold text-gray-900 mb-2">
 Huong dan cau hinh Unsplash API
 </h3>
 <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
 <li>Truy cap <a href="https://unsplash.com/developers" target="_blank" className="text-indigo-600 underline">unsplash.com/developers</a></li>
 <li>Dang ky / Dang nhap &rarr; "New Application"</li>
 <li>Sao chep <strong>Access Key</strong></li>
 <li>Tao file <code className="bg-gray-100 px-1 rounded">.env</code> trong thu muc <code className="bg-gray-100 px-1 rounded">vocab-app/</code>:</li>
 </ol>
 <pre className="mt-3 p-3 bg-gray-900 text-green-400 rounded-lg text-sm">
VITE_UNSPLASH_ACCESS_KEY=your_access_key_here
 </pre>
 </Card>
 )}

 {/* ── Lightbox ── */}
 <AnimatePresence>
 {lightbox && (
 <Lightbox
 imageUrl={lightbox.url}
 word={lightbox.word}
 onClose={() => setLightbox(null)}
 />
 )}
 </AnimatePresence>
 </motion.div>
 )
}
