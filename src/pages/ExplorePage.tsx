import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Compass, Download, Check, LibraryBig, Search as SearchIcon, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TOPIC_PACKS, WordPack } from '@/data/word-packs'
import { wordRepo } from '@/db/word-repo'
import { useAuthStore } from '@/stores/auth-store'
import { syncEngine } from '@/lib/sync-engine'
import { generateTopicWords } from '@/lib/topic-generator'
import { v4 as uuidv4 } from 'uuid'

export function ExplorePage() {
  const [selectedPack, setSelectedPack] = useState<WordPack | null>(null)
  const [importing, setImporting] = useState(false)
  const [importedPacks, setImportedPacks] = useState<Set<string>>(new Set())
  const [searchTopic, setSearchTopic] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const { user } = useAuthStore()

  const handleImport = async (pack: WordPack) => {
    setImporting(true)
    try {
      const wordsToImport = pack.words.map(w => ({
        ...w,
        id: crypto.randomUUID(),
        userId: user?.id,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }))
      
      await Promise.all(wordsToImport.map(w => wordRepo.add(w as any)))
      if (user?.id) syncEngine.sync()
      
      setImportedPacks(prev => new Set(prev).add(pack.id))
      setTimeout(() => setSelectedPack(null), 1500)
    } catch (e) {
      console.error('Import failed', e)
    } finally {
      setImporting(false)
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchTopic.trim()) return
    setIsGenerating(true)
    const words = await generateTopicWords(searchTopic.trim())
    if (words.length > 0) {
      const newPack: WordPack = {
        id: uuidv4(),
        title: searchTopic.trim(),
        description: `Danh sách từ vựng tự động tạo cho chủ đề "${searchTopic}"`,
        icon: '✨',
        color: 'bg-purple-100 text-purple-600',
        words: words as any
      }
      setSelectedPack(newPack)
    } else {
      alert('Không tìm thấy từ vựng nào cho chủ đề này.')
    }
    setIsGenerating(false)
  }

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <Compass className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Khám Phá Chủ Đề</h1>
            <p className="text-gray-500 text-sm mt-0.5">Tìm và tải các gói từ vựng theo chủ đề bạn yêu thích</p>
          </div>
        </div>

        {!selectedPack && (
          <form onSubmit={handleGenerate} className="relative w-full md:w-96">
            <input
              type="text"
              value={searchTopic}
              onChange={e => setSearchTopic(e.target.value)}
              placeholder="Nhập chủ đề (vd: space, technology...)"
              className="w-full py-3 pl-4 pr-12 rounded-2xl border-2 border-gray-100 focus:border-orange-400 bg-white dark:bg-gray-800 text-sm outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={isGenerating || !searchTopic.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white rounded-xl transition-colors"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <SearchIcon className="w-4 h-4" />}
            </button>
          </form>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!selectedPack ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid gap-6 sm:grid-cols-2 md:grid-cols-3"
          >
            {TOPIC_PACKS.map(pack => (
              <Card 
                key={pack.id} 
                className="p-6 cursor-pointer hover:scale-[1.02] transition-transform group flex flex-col justify-between"
                onClick={() => setSelectedPack(pack)}
              >
                <div>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4 ${pack.color}`}>
                    {pack.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-orange-600 transition-colors">
                    {pack.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                    {pack.description}
                  </p>
                </div>
                <div className="flex items-center justify-between text-sm font-medium border-t border-gray-100 dark:border-gray-800 pt-4">
                  <span className="text-gray-400 flex items-center gap-1">
                    <LibraryBig className="w-4 h-4" /> {pack.words.length} từ
                  </span>
                  {importedPacks.has(pack.id) ? (
                    <span className="text-emerald-500 flex items-center gap-1"><Check className="w-4 h-4"/> Đã tải</span>
                  ) : (
                    <span className="text-orange-500 group-hover:underline">Xem chi tiết &rarr;</span>
                  )}
                </div>
              </Card>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="detail"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <button onClick={() => setSelectedPack(null)} className="text-sm font-medium text-gray-500 hover:text-gray-900 mb-6 inline-flex items-center gap-2">
              &larr; Quay lại
            </button>
            <Card className="p-8">
              <div className="flex flex-col md:flex-row gap-8 items-start justify-between mb-8">
                <div className="flex gap-6 items-start">
                  <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-5xl shrink-0 ${selectedPack.color}`}>
                    {selectedPack.icon}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-gray-100 mb-2">{selectedPack.title}</h2>
                    <p className="text-gray-500 text-lg">{selectedPack.description}</p>
                    <p className="text-sm font-medium text-gray-400 mt-2">{selectedPack.words.length} từ vựng</p>
                  </div>
                </div>
                <Button 
                  variant="primary" 
                  size="lg" 
                  className={`shrink-0 h-14 px-8 ${importedPacks.has(selectedPack.id) ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-orange-500 hover:bg-orange-600'}`}
                  onClick={() => !importedPacks.has(selectedPack.id) && handleImport(selectedPack)}
                  isLoading={importing}
                  disabled={importedPacks.has(selectedPack.id)}
                  icon={importedPacks.has(selectedPack.id) ? <Check className="w-5 h-5"/> : <Download className="w-5 h-5"/>}
                >
                  {importedPacks.has(selectedPack.id) ? 'Đã thêm vào kho' : 'Tải gói từ này'}
                </Button>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <LibraryBig className="w-5 h-5 text-gray-400" /> Danh sách từ vựng
                </h3>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedPack.words.map((w, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                      <div className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-1">{w.word}</div>
                      <div className="text-sm text-gray-500 mb-2">{w.ipa} • <span className="italic">{w.partOfSpeech}</span></div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{w.definitions[0]?.vietnamese}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
