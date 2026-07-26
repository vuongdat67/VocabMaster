import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Search, Volume2, BookOpen, Play, X, Upload, Trash2, Image as ImageIcon, Plus, Star, Edit, Folder as FolderIcon, LibraryBig } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { wordRepo } from '@/db/word-repo'
import { progressRepo } from '@/db/progress-repo'
import { folderRepo } from '@/db/folder-repo'
import { useAudio } from '@/hooks/useAudio'
import { useLearningSession } from '@/hooks/useLearningSession'
import { WordEditModal } from '@/components/ui/WordEditModal'
import { FolderEditModal } from '@/components/ui/FolderEditModal'
import { v4 as uuidv4 } from 'uuid'
import { getImageForWord } from '@/lib/image-search'
import type { Word, PartOfSpeech } from '@/types/word'
import type { Folder } from '@/types/folder'

const PARTS_OF_SPEECH: PartOfSpeech[] = [
	'noun', 'verb', 'adjective', 'adverb', 'preposition',
	'conjunction', 'pronoun', 'interjection', 'phrase',
]

const PLACEHOLDER_COLORS = [
	'bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-yellow-400',
	'bg-purple-400', 'bg-pink-400', 'bg-indigo-400', 'bg-teal-400',
	'bg-orange-400', 'bg-cyan-400',
]

function getPlaceholderColor(char: string): string {
	const code = char.toLowerCase().charCodeAt(0) || 0
	return PLACEHOLDER_COLORS[code % PLACEHOLDER_COLORS.length] ?? 'bg-gray-400'
}

const VIETNAMESE_MAP: Record<string, string> = {
	'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a',
	'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a',
	'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
	'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e',
	'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
	'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
	'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o',
	'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o',
	'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
	'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u',
	'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
	'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
	'đ': 'd',
}

function normalizeVietnamese(text: string): string {
	return text
		.toLowerCase()
		.replace(
			/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g,
			(c) => VIETNAMESE_MAP[c] || c
		)
}

function getFirstLetters(text: string): string {
	return text
		.toLowerCase()
		.split(/\s+/)
		.map((s) => s[0] || '')
		.join('')
}

export function WordListPage() {
	const navigate = useNavigate()
	const [words, setWords] = useState<Word[]>([])
	const [filtered, setFiltered] = useState<Word[]>([])
	const [searchQuery, setSearchQuery] = useState('')
	const [tags, setTags] = useState<string[]>([])
	const [folders, setFolders] = useState<Folder[]>([])
	const [selectedTag, setSelectedTag] = useState<string | null>(null)
	const [loading, setLoading] = useState(true)
	const [studiedIds, setStudiedIds] = useState<Set<string>>(new Set())
	const [selectedWord, setSelectedWord] = useState<Word | null>(null)
	const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
	
	// CRUD states
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [editWord, setEditWord] = useState<Word | null>(null)
	const [isFolderModalOpen, setIsFolderModalOpen] = useState(false)
	const [editFolder, setEditFolder] = useState<Folder | null>(null)

	// Dropdown filter states
	const [statusFilter, setStatusFilter] = useState<'all' | 'studied' | 'unstudied'>('all')
	const [posFilter, setPosFilter] = useState<PartOfSpeech | ''>('')
	const [difficultyFilter, setDifficultyFilter] = useState<number>(0)

	const { speak } = useAudio()
	const session = useLearningSession()
	const imageInputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		async function load() {
			try {
				const allWords = await wordRepo.getAll()
				const allTags = await wordRepo.getAllTags()
				const allFolders = await folderRepo.getAll()
				const srsEntries = await progressRepo.bulkGetSRS(allWords.map((w) => w.id))
				const studied = new Set(srsEntries.map((s) => s.wordId))
				setWords(allWords)
				setFiltered(allWords)
				setTags(allTags)
				setFolders(allFolders)
				setStudiedIds(studied)
			} catch (err) {
				console.error('Failed to load words:', err)
			} finally {
				setLoading(false)
			}
		}
		load()
	}, [])

	// Unified filter: re-run whenever any filter/search state changes
	useEffect(() => {
		let result = words

		// Search: match English word, Vietnamese definition, or English meaning
		if (searchQuery) {
			const lower = searchQuery.toLowerCase()
			const normalizedQuery = normalizeVietnamese(lower)
			const queryFirstLetters = getFirstLetters(lower)

			result = result.filter((w) => {
				// Direct match in English word
				if (w.word.toLowerCase().includes(lower)) return true

				for (const d of w.definitions) {
					// Direct match in Vietnamese or English definition
					if (d.vietnamese.toLowerCase().includes(lower)) return true
					if (d.meaning.toLowerCase().includes(lower)) return true

					// Vietnamese diacritic-insensitive match
					if (normalizeVietnamese(d.vietnamese).includes(normalizedQuery)) return true

					// First-letter syllable match (for Vietnamese shorthand, e.g. "xc" matches "xin chào")
					if (queryFirstLetters.length >= 2) {
						const defFirstLetters = getFirstLetters(d.vietnamese)
						if (defFirstLetters.includes(queryFirstLetters)) return true
					}
				}

				return false
			})
		}

		// Tag filter
		if (selectedTag) {
			result = result.filter((w) => w.tags.includes(selectedTag))
		}

		// Status filter (based on SRS data existence)
		if (statusFilter === 'studied') {
			result = result.filter((w) => studiedIds.has(w.id))
		} else if (statusFilter === 'unstudied') {
			result = result.filter((w) => !studiedIds.has(w.id))
		}

		// Part of speech filter
		if (posFilter) {
			result = result.filter((w) => w.partOfSpeech === posFilter)
		}

		// Difficulty filter
		if (difficultyFilter > 0) {
			result = result.filter((w) => w.difficulty === (difficultyFilter as 1 | 2 | 3 | 4 | 5))
		}

		setFiltered(result)
	}, [words, searchQuery, selectedTag, statusFilter, posFilter, difficultyFilter, studiedIds])

	const isFiltered = !!(
		searchQuery || selectedTag || statusFilter !== 'all' || posFilter !== '' || difficultyFilter > 0
	)

	const handleTagFilter = (tag: string | null) => {
		setSelectedTag((prev) => (prev === tag ? null : tag))
	}

	const handleLearnSelected = async () => {
		const ids = filtered.map((w) => w.id)
		if (ids.length === 0) return
		await session.startSession(ids)
		navigate('/learn')
	}

	const handleImageError = useCallback((wordId: string) => {
		setImageErrors((prev) => new Set(prev).add(wordId))
	}, [])

	const handleImageUpload = useCallback(async (word: Word) => {
		// Try fetching from Unsplash first
		const imgUrl = await getImageForWord(word.word)
		if (imgUrl) {
			await wordRepo.update(word.id, { imageUrls: [imgUrl] })
			setWords((prev) =>
				prev.map((pw) =>
					pw.id === word.id ? { ...pw, imageUrls: [imgUrl] } : pw
				)
			)
			return
		}
	}, [])

	const handleImageFile = useCallback((e: React.ChangeEvent<HTMLInputElement>, word: Word) => {
		const file = e.target.files?.[0]
		if (!file) return
		const url = URL.createObjectURL(file)
		wordRepo.update(word.id, { imageUrls: [url] }).then(() => {
			setWords((prev) =>
				prev.map((pw) =>
					pw.id === word.id ? { ...pw, imageUrls: [url] } : pw
				)
			)
		})
	}, [])

	const handleToggleMyList = async (word: Word, e: React.MouseEvent) => {
		e.stopPropagation()
		const isMyList = word.tags.includes('my-list')
		const newTags = isMyList ? word.tags.filter(t => t !== 'my-list') : [...word.tags, 'my-list']
		await wordRepo.update(word.id, { tags: newTags })
		setWords(prev => prev.map(w => w.id === word.id ? { ...w, tags: newTags } : w))
		// Update tags list
		if (!isMyList && !tags.includes('my-list')) setTags(prev => [...prev, 'my-list'])
	}

	const handleDeleteWord = async (word: Word) => {
		if (!window.confirm(`Xóa từ "${word.word}"?`)) return
		await wordRepo.delete(word.id)
		setWords(prev => prev.filter(w => w.id !== word.id))
		setSelectedWord(null)
	}

	const handleSaveWord = async (wordData: Partial<Word>) => {
		if (editWord) {
			// Update
			await wordRepo.update(editWord.id, wordData)
			setWords(prev => prev.map(w => w.id === editWord.id ? { ...w, ...wordData } as Word : w))
		} else {
			// Add new
			const newWord: Word = {
				id: uuidv4(),
				word: wordData.word!,
				ipa: wordData.ipa || '',
				partOfSpeech: wordData.partOfSpeech || 'noun',
				definitions: wordData.definitions || [],
				examples: wordData.examples || [],
				synonyms: [],
				antonyms: [],
				imageUrls: [],
				tags: wordData.tags || [],
				difficulty: wordData.difficulty || 1,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			}
			await wordRepo.add(newWord)
			setWords(prev => [newWord, ...prev])
		}
		
		// Refresh tags
		const allTags = await wordRepo.getAllTags()
		setTags(allTags)
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin w-8 h-8 border-4 rounded-full" style={{ borderColor: 'var(--accent-500)', borderTopColor: 'transparent' }} />
			</div>
		)
	}

	return (
		<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
			{/* Heading row with inline filter dropdowns */}
			<div className="flex flex-wrap items-start gap-3">
				<div className="min-w-0 flex items-center gap-4">
					<div>
						<h2 className="text-2xl font-bold text-gray-900 tracking-tight">Từ vựng</h2>
						<p className="text-sm text-gray-500">{filtered.length} từ</p>
					</div>
					<Button 
						size="sm" 
						icon={<Plus className="w-4 h-4" />}
						onClick={() => { setEditWord(null); setIsModalOpen(true); }}
					>
						Thêm từ mới
					</Button>
				</div>

				<div className="flex flex-wrap items-center gap-2 ml-auto">
					<select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value as 'all' | 'studied' | 'unstudied')}
						className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none"
						style={{ '--tw-ring-color': 'var(--accent-400)' } as React.CSSProperties}
					>
						<option value="all">Tất cả</option>
						<option value="studied">Đã học</option>
						<option value="unstudied">Chưa học</option>
					</select>

					<select
						value={posFilter}
						onChange={(e) => setPosFilter(e.target.value as PartOfSpeech | '')}
						className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none"
						style={{ '--tw-ring-color': 'var(--accent-400)' } as React.CSSProperties}
					>
						<option value="">Tất cả từ loại</option>
						{PARTS_OF_SPEECH.map((pos) => (
							<option key={pos} value={pos}>
								{pos.charAt(0).toUpperCase() + pos.slice(1)}
							</option>
						))}
					</select>

					<select
						value={difficultyFilter}
						onChange={(e) => setDifficultyFilter(Number(e.target.value))}
						className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none"
						style={{ '--tw-ring-color': 'var(--accent-400)' } as React.CSSProperties}
					>
						<option value={0}>Tất cả độ khó</option>
						{[1, 2, 3, 4, 5].map((d) => (
							<option key={d} value={d}>
								{d} {'★'.repeat(d)}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* Tag filter pills / Folders */}
			{(tags.length > 0 || folders.length > 0) && (
				<div className="flex flex-wrap gap-2 mb-4 bg-gray-50/50 p-3 rounded-xl border border-gray-100 dark:bg-gray-800/30 dark:border-gray-700 items-center">
					<div className="w-full flex justify-between items-center mb-1">
						<span className="text-sm font-semibold text-gray-500">Thư mục & Chủ đề</span>
						<Button size="sm" variant="ghost" className="text-gray-400 hover:text-gray-700" onClick={() => { setEditFolder(null); setIsFolderModalOpen(true); }}>
							<Plus className="w-4 h-4 mr-1" /> Tạo thư mục
						</Button>
					</div>
					<button
						onClick={() => handleTagFilter(null)}
						className={`px-4 py-1.5 rounded-xl text-sm transition-all flex items-center gap-1.5 ${
							selectedTag === null
								? 'text-white shadow-md'
								: 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700'
						}`}
						style={selectedTag === null ? { backgroundColor: 'var(--accent-500)' } : undefined}
					>
						<LibraryBig className="w-4 h-4" /> Tất cả
					</button>
					
					{/* Map over unique tags/folders */}
					{Array.from(new Set([...tags, ...folders.map(f => f.id)])).map((tagOrFolderId) => {
						const folder = folders.find(f => f.id === tagOrFolderId)
						const displayName = folder ? folder.name : tagOrFolderId.replace('-', ' ')
						const icon = folder ? folder.icon : '📁'
						const bgClass = selectedTag === tagOrFolderId 
							? (folder ? folder.color : 'bg-blue-500') 
							: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'

						return (
							<div key={tagOrFolderId} className="group relative flex items-center">
								<button
									onClick={() => handleTagFilter(tagOrFolderId)}
									className={`px-4 py-1.5 rounded-xl text-sm transition-all flex items-center gap-1.5 capitalize ${
										selectedTag === tagOrFolderId ? 'text-white shadow-md ' + bgClass : bgClass
									}`}
									style={selectedTag === tagOrFolderId && !folder ? { backgroundColor: 'var(--accent-500)' } : undefined}
								>
									<span>{icon}</span> {displayName}
								</button>
								{folder && (
									<button 
										onClick={(e) => { e.stopPropagation(); setEditFolder(folder); setIsFolderModalOpen(true); }}
										className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full p-1 text-gray-400 hover:text-blue-500 transition-opacity shadow-sm"
									>
										<Edit className="w-3 h-3" />
									</button>
								)}
							</div>
						)
					})}
				</div>
			)}

			<FolderEditModal 
				isOpen={isFolderModalOpen}
				onClose={() => setIsFolderModalOpen(false)}
				folder={editFolder}
				onSave={async (fData) => {
					if (editFolder) {
						await folderRepo.update(editFolder.id, fData)
						setFolders(prev => prev.map(f => f.id === editFolder.id ? { ...f, ...fData } as Folder : f))
					} else {
						const newId = fData.name?.toLowerCase().replace(/\s+/g, '-') || uuidv4()
						const newFolder: Folder = {
							id: newId,
							name: fData.name!,
							icon: fData.icon!,
							color: fData.color!,
							createdAt: Date.now(),
							updatedAt: Date.now()
						}
						await folderRepo.add(newFolder)
						setFolders(prev => [...prev, newFolder])
					}
				}}
			/>

			{/* Search bar + Learn selected button */}
			<div className="flex gap-3">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Tìm từ, nghĩa tiếng Việt..."
						className="w-full py-3 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none transition-shadow"
						style={{ '--tw-ring-color': 'var(--accent-400)' } as React.CSSProperties}
						onFocus={(e) => { e.target.style.boxShadow = `0 0 0 2px var(--accent-400)`; e.target.style.borderColor = 'var(--accent-300)' }}
						onBlur={(e) => { e.target.style.boxShadow = ''; e.target.style.borderColor = '' }}
					/>
				</div>
				{isFiltered && filtered.length > 0 && (
					<Button onClick={handleLearnSelected} icon={<Play className="w-4 h-4" />}>
						Học từ đã chọn
					</Button>
				)}
			</div>

			{/* Word list - uniform cards with fixed height */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
				{filtered.map((w) => {
					const hasImage = w.imageUrls.length > 0 && !imageErrors.has(w.id)
					return (
						<motion.div
							key={w.id}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							layout
						>
							<Card
								className="h-28 p-3 overflow-hidden"
								onClick={() => setSelectedWord(w)}
								hover
							>
								<div className="flex items-start gap-3">
									{/* Image / first-letter placeholder */}
									<div className="w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden">
										{hasImage ? (
											<img
												src={w.imageUrls[0]}
												alt=""
												className="w-full h-full object-cover"
												onError={() => handleImageError(w.id)}
											/>
										) : (
											<div
												className={`w-full h-full ${getPlaceholderColor(
													w.word[0] ?? ''
												)} flex items-center justify-center text-white font-bold text-lg`}
											>
												{(w.word[0] ?? '').toUpperCase()}
											</div>
										)}
									</div>

									{/* Word info */}
									<div className="flex-1 min-w-0">
										<div className="flex items-start justify-between gap-1">
											<h3 className="font-semibold text-gray-900 text-sm leading-5 truncate">
												{w.word}
											</h3>
											<div className="flex items-center">
												<button
													onClick={(e) => handleToggleMyList(w, e)}
													className={`p-1 rounded hover:bg-gray-100 flex-shrink-0 ${w.tags.includes('my-list') ? 'text-yellow-400' : 'text-gray-300'}`}
													title="Thêm vào Từ vựng của tôi"
												>
													<Star className="w-3.5 h-3.5" fill={w.tags.includes('my-list') ? 'currentColor' : 'none'} />
												</button>
												<button
													onClick={(e) => {
														e.stopPropagation()
														speak(w.word)
													}}
													className="p-1 rounded hover:bg-gray-100 text-gray-400 flex-shrink-0"
												>
													<Volume2 className="w-3.5 h-3.5" />
												</button>
											</div>
										</div>
										{w.ipa && (
											<p className="text-xs text-gray-400 truncate leading-4">{w.ipa}</p>
										)}
										<p className="text-sm text-gray-500 truncate leading-5">
											{w.definitions[0]?.vietnamese ?? '...'}
										</p>
										<div className="flex flex-wrap gap-1 mt-1">
											<Badge variant="info" className="text-[10px] px-1.5 py-0.5">
												{w.partOfSpeech}
											</Badge>
											{w.tags.slice(0, 2).map((t) => (
												<Badge key={t} className="text-[10px] px-1.5 py-0.5">
													{t}
												</Badge>
											))}
										</div>
									</div>
								</div>
							</Card>
						</motion.div>
					)
				})}
			</div>

			{filtered.length === 0 && (
				<div className="text-center py-16 text-gray-400">
					<BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
					<p>Không tìm thấy từ nào</p>
					<p className="text-sm mt-1">Thử thay đổi từ khóa hoặc bộ lọc</p>
				</div>
			)}

			{/* Selected word overlay */}
			<AnimatePresence>
				{selectedWord && (
					<motion.div
						key={selectedWord.id}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
						onClick={() => setSelectedWord(null)}
					>
						<motion.div
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.95 }}
							className="bg-white rounded-2xl shadow-[var(--shadow-elevated)] max-w-sm w-full relative overflow-hidden"
							onClick={(e) => e.stopPropagation()}
						>
							<button
								onClick={() => setSelectedWord(null)}
								className="absolute top-3 right-3 z-10 p-1 rounded-lg bg-white/80 hover:bg-white text-gray-500 transition-colors"
							>
								<X className="w-5 h-5" />
							</button>

							<div className="h-24 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent-400), var(--accent-600))' }}>
								{selectedWord.imageUrls.length > 0 && !imageErrors.has(selectedWord.id) ? (
									<img
										src={selectedWord.imageUrls[0]}
										alt=""
										className="w-full h-full object-cover"
										onError={() => handleImageError(selectedWord.id)}
									/>
								) : (
									<span className="text-4xl font-bold text-white/90">
										{selectedWord.word.charAt(0).toUpperCase()}
									</span>
								)}
							</div>

							<div className="p-5">
								<div className="flex items-start justify-between mb-3">
									<div>
										<h3 className="text-lg font-bold text-gray-900">{selectedWord.word}</h3>
										{selectedWord.ipa && (
											<p className="text-xs text-gray-400">{selectedWord.ipa}</p>
										)}
									</div>
									<button
										onClick={(e) => {
											e.stopPropagation()
											speak(selectedWord.word)
										}}
										className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
									>
										<Volume2 className="w-4 h-4" />
									</button>
								</div>

								<div className="space-y-2 mb-3">
									{selectedWord.definitions.map((def, i) => (
										<div key={i}>
											<p className="font-medium text-gray-900 text-sm">{def.vietnamese}</p>
											<p className="text-xs text-gray-500">{def.meaning}</p>
										</div>
									))}
								</div>

								{selectedWord.examples.length > 0 && (
									<div className="mb-3 space-y-1">
										<p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
											Ví dụ
										</p>
										{selectedWord.examples.slice(0, 2).map((ex, i) => (
											<div key={i} className="text-sm">
												<p className="text-gray-700 italic leading-5">&ldquo;{ex.sentence}&rdquo;</p>
												<p className="text-gray-500 text-xs">{ex.vietnamese}</p>
											</div>
										))}
									</div>
								)}

								<div className="flex flex-wrap gap-1 mb-4">
									<Badge variant="info">{selectedWord.partOfSpeech}</Badge>
									{selectedWord.tags.slice(0, 3).map((t) => (
										<Badge key={t}>{t}</Badge>
									))}
								</div>

								{/* Image actions */}
								<div className="flex gap-2 mb-3">
									<Button
										variant="secondary"
										size="sm"
										className="flex-1"
										icon={<ImageIcon className="w-3.5 h-3.5" />}
										onClick={async () => {
											await handleImageUpload(selectedWord)
											setSelectedWord({ ...selectedWord })
										}}
									>
										Tìm ảnh
									</Button>
									<Button
										variant="secondary"
										size="sm"
										className="flex-1"
										icon={<Upload className="w-3.5 h-3.5" />}
										onClick={() => imageInputRef.current?.click()}
									>
										Tải ảnh lên
									</Button>
									<input
										ref={imageInputRef}
										type="file"
										accept="image/*"
										className="hidden"
										onChange={(e) => {
											handleImageFile(e, selectedWord)
											setSelectedWord({ ...selectedWord })
										}}
									/>
								</div>

								<div className="flex gap-2">
									<Button
										variant="secondary"
										className="flex-1"
										onClick={async () => {
											await session.startSession([selectedWord.id])
											navigate('/learn')
										}}
										icon={<Play className="w-4 h-4" />}
									>
										Học từ này
									</Button>
									
									<Button
										variant="ghost"
										onClick={() => { setEditWord(selectedWord); setIsModalOpen(true); }}
										icon={<Edit className="w-4 h-4" />}
										title="Sửa từ"
									/>
									<Button
										variant="ghost"
										className="text-red-500 hover:text-red-600 hover:bg-red-50"
										onClick={() => handleDeleteWord(selectedWord)}
										icon={<Trash2 className="w-4 h-4" />}
										title="Xóa từ"
									/>
								</div>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
			
			<WordEditModal 
				isOpen={isModalOpen}
				initialData={editWord}
				onClose={() => setIsModalOpen(false)}
				onSave={handleSaveWord}
			/>
		</motion.div>
	)
}
