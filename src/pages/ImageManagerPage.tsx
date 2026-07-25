import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Image, Search, Check, Loader2, X, RefreshCw, Trash2 } from 'lucide-react'
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
	const colors: [string, string][] = [
		['#6366f1', '#4f46e5'],
		['#8b5cf6', '#7c3aed'],
		['#ec4899', '#db2777'],
		['#f59e0b', '#d97706'],
		['#10b981', '#059669'],
		['#06b6d4', '#0891b2'],
		['#f43f5e', '#e11d48'],
		['#14b8a6', '#0d9488'],
		['#0ea5e9', '#0284c7'],
		['#f97316', '#ea580c'],
	]
	const idx = word.length % colors.length
	const [from, to] = colors[idx]!

	return (
		<div
			className={`flex items-center justify-center text-white font-bold rounded-xl ${
				size === 'small' ? 'w-12 h-12 text-lg' : 'w-full h-full min-h-[120px] text-4xl'
			}`}
			style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
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
		if (filter === 'has-image') return w.imageUrls[0] && !w.imageUrls[0].includes('dicebear.com')
		if (filter === 'no-image') return !w.imageUrls[0] || w.imageUrls[0].includes('dicebear.com')
		return true
	})

	const wordsWithImages = words.filter((w) => w.imageUrls[0] && !w.imageUrls[0].includes('dicebear.com'))
	const wordsWithoutImages = words.filter((w) => !w.imageUrls[0] || w.imageUrls[0].includes('dicebear.com'))

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

		setStatus(`Hoàn thành! Đã tìm ảnh cho ${total} từ.`)
		setProcessing(false)
	}, [wordsWithoutImages])

	const handleSingleFetch = useCallback(async (word: Word) => {
		setStatus(`Đang tìm ảnh cho "${word.word}"...`)
		const imgUrl = await getImageForWord(word.word)
		if (imgUrl) {
			await wordRepo.update(word.id, { imageUrls: [imgUrl] })
			setWords((prev) =>
				prev.map((pw) =>
					pw.id === word.id ? { ...pw, imageUrls: [imgUrl] } : pw
				)
			)
			setStatus(`Đã cập nhật ảnh cho "${word.word}"`)
		}
	}, [])

	const handleDeleteImage = useCallback(async (word: Word) => {
		if (!window.confirm(`Xóa ảnh của từ "${word.word}"?`)) return
		await wordRepo.update(word.id, { imageUrls: [] })
		setWords((prev) =>
			prev.map((pw) =>
				pw.id === word.id ? { ...pw, imageUrls: [] } : pw
			)
		)
		setStatus(`Đã xóa ảnh của "${word.word}"`)
	}, [])

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin w-8 h-8 border-4 rounded-full" style={{ borderColor: 'var(--accent-500)', borderTopColor: 'transparent' }} />
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
								{hasUnsplash ? 'Unsplash API đã kết nối' : 'Chưa cấu hình Unsplash API'}
							</p>
							<p className="text-xs text-gray-400 mt-0.5">
								{hasUnsplash
									? 'Đã tìm thấy Access Key. Ảnh sẽ được tải từ Unsplash.'
									: 'Tạo file .env với VITE_UNSPLASH_ACCESS_KEY=your_key. Hiện dùng placeholder.'}
							</p>
						</div>
					</div>
				</div>
			</Card>

			{/* ── Stats ── */}
			<div className="grid grid-cols-3 gap-4">
				<Card className="p-4 text-center" style={{ background: 'linear-gradient(to bottom, color-mix(in srgb, var(--accent-500) 6%, var(--surface-card)), color-mix(in srgb, var(--accent-500) 12%, var(--surface-card)))', borderColor: 'color-mix(in srgb, var(--accent-500) 30%, var(--border-default))' }}>
					<p className="text-2xl font-bold" style={{ color: 'var(--accent-600)' }}>{wordsWithImages.length}</p>
					<p className="text-xs text-gray-500 mt-1">Đã có ảnh</p>
				</Card>
				<Card className="p-4 text-center bg-gradient-to-b from-white to-amber-50 border-amber-100">
					<p className="text-2xl font-bold text-amber-600">{wordsWithoutImages.length}</p>
					<p className="text-xs text-gray-500 mt-1">Cần thêm ảnh</p>
				</Card>
				<Card className="p-4 text-center bg-gradient-to-b from-white to-emerald-50 border-emerald-100">
					<p className="text-2xl font-bold text-emerald-600">{words.length}</p>
					<p className="text-xs text-gray-500 mt-1">Tổng số từ</p>
				</Card>
			</div>

			{/* ── Batch actions ── */}
			{wordsWithoutImages.length > 0 && (
				<Card className="p-6">
					<h3 className="font-semibold text-gray-900 mb-2">Tìm ảnh hàng loạt</h3>
					<p className="text-sm text-gray-500 mb-4">
						Tự động tìm ảnh cho {wordsWithoutImages.length} từ chưa có ảnh
					</p>

					{processing && (
						<div className="mb-4 space-y-2">
							<div className="flex items-center gap-2 text-sm" style={{ color: 'var(--accent-600)' }}>
								<Loader2 className="w-4 h-4 animate-spin" />
								{status}
							</div>
							<div className="w-full bg-gray-200 rounded-full h-2">
								<motion.div
									className="h-full rounded-full" style={{ backgroundColor: 'var(--accent-500)' }}
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
							Tìm ảnh cho tất cả ({wordsWithoutImages.length} từ)
						</Button>
					)}

					{status && !processing && (status.startsWith('Đã') || status.startsWith('Hoàn')) && (
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
							? 'bg-accent-light text-accent-dark'
							: 'bg-gray-50 text-gray-500 hover:bg-gray-100'
					}`}
				>
					Tất cả ({words.length})
				</button>
				<button
					onClick={() => setFilter('has-image')}
					className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
						filter === 'has-image'
							? 'bg-accent-light text-accent-dark'
							: 'bg-gray-50 text-gray-500 hover:bg-gray-100'
					}`}
				>
					Có ảnh ({wordsWithImages.length})
				</button>
				<button
					onClick={() => setFilter('no-image')}
					className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
						filter === 'no-image'
							? 'bg-accent-light text-accent-dark'
							: 'bg-gray-50 text-gray-500 hover:bg-gray-100'
					}`}
				>
					Chưa có ảnh ({wordsWithoutImages.length})
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
								{w.imageUrls[0] && w.imageUrls[0].includes('/') ? (
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
											className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/90 rounded-lg text-blue-600 hover:bg-white shadow"
											title="Tìm ảnh cho từ này"
										>
											<Search className="w-5 h-5" />
										</button>
									</div>
								)}

								{/* Overlay actions for words WITH images */}
								{w.imageUrls[0] && !processing && (
									<div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
										<button
											onClick={(e) => { e.stopPropagation(); handleSingleFetch(w); }}
											className="p-2 bg-white/90 rounded-lg text-blue-600 hover:bg-white shadow transition-transform hover:scale-110"
											title="Đổi ảnh khác"
										>
											<RefreshCw className="w-4 h-4" />
										</button>
										<button
											onClick={(e) => { e.stopPropagation(); handleDeleteImage(w); }}
											className="p-2 bg-white/90 rounded-lg text-red-600 hover:bg-white shadow transition-transform hover:scale-110"
											title="Xóa ảnh"
										>
											<Trash2 className="w-4 h-4" />
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
					<h3 className="font-semibold text-gray-700 mb-1">Không có từ nào</h3>
					<p className="text-sm text-gray-400">
						{filter === 'has-image'
							? 'Chưa có từ nào có ảnh. Hãy thêm ảnh cho từ vựng!'
							: filter === 'no-image'
							? 'Tất cả từ đã có ảnh rồi!'
							: 'Chưa có từ vựng nào. Hãy thêm từ vựng trước!'}
					</p>
				</Card>
			)}

			{/* ── Setup instructions ── */}
			{!hasUnsplash && (
				<Card className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
					<h3 className="font-semibold text-gray-900 mb-2">
						Hướng dẫn cấu hình Unsplash API
					</h3>
					<ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
						<li>Truy cập <a href="https://unsplash.com/developers" target="_blank" className="underline" style={{ color: 'var(--accent-500)' }}>unsplash.com/developers</a></li>
						<li>Đăng ký / Đăng nhập &rarr; "New Application"</li>
						<li>Sao chép <strong>Access Key</strong></li>
						<li>Tạo file <code className="bg-gray-100 px-1 rounded">.env</code> trong thư mục <code className="bg-gray-100 px-1 rounded">vocab-app/</code>:</li>
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
