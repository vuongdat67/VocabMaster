import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Volume2, Plus, X, Loader2, Check } from 'lucide-react'
import { ARTICLES, Article } from '@/data/articles'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { wordRepo } from '@/db/word-repo'
import { useAuthStore } from '@/stores/auth-store'
import { syncEngine } from '@/lib/sync-engine'

export function ReadingPage() {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)

  return (
    <div className="pb-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Góc Đọc Sách</h1>
          <p className="text-gray-500 text-sm mt-0.5">Luyện đọc và tra từ vựng trực tiếp trong ngữ cảnh</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!selectedArticle ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid gap-4 sm:grid-cols-2 md:grid-cols-3"
          >
            {ARTICLES.map((article) => (
              <Card 
                key={article.id} 
                className="p-5 cursor-pointer hover:shadow-[var(--shadow-card-hover)] transition-all group"
                onClick={() => setSelectedArticle(article)}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-full">
                    {article.level}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 transition-colors">
                  {article.title}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-3">
                  {article.content}
                </p>
              </Card>
            ))}
          </motion.div>
        ) : (
          <ArticleReader 
            key="reader" 
            article={selectedArticle} 
            onBack={() => setSelectedArticle(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function ArticleReader({ article, onBack }: { article: Article; onBack: () => void }) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [dictData, setDictData] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const { user } = useAuthStore()

  // Xử lý nội dung để tách từng từ
  const words = article.content.split(/(\s+)/)

  const handleWordClick = async (wordStr: string) => {
    // Loại bỏ dấu câu
    const cleanWord = wordStr.replace(/[^a-zA-Z]/g, '').toLowerCase()
    if (!cleanWord || cleanWord.length < 2) return

    setSelectedWord(cleanWord)
    setDictData(null)
    setSaved(false)
    setLoading(true)

    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord}`)
      if (res.ok) {
        const data = await res.json()
        setDictData(data[0])
      } else {
        setDictData({ error: 'Không tìm thấy từ này.' })
      }
    } catch (e) {
      setDictData({ error: 'Lỗi kết nối mạng.' })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveWord = async () => {
    if (!dictData || dictData.error) return
    try {
      // Gọi API Unsplash (tùy chọn, giả lập image)
      const resPhoto = await fetch(`https://api.unsplash.com/search/photos?page=1&query=${selectedWord}&client_id=q4t3wLhP_Vw2_6oH3q81EONyH1U1y-jI3rG5hZ_cT-Y&per_page=1`)
      const pData = await resPhoto.json()
      const imageUrl = pData.results?.[0]?.urls?.regular || ''

      const newWord: import('@/types/word').Word = {
        id: crypto.randomUUID(),
        word: dictData.word,
        ipa: dictData.phonetic || '',
        partOfSpeech: dictData.meanings[0]?.partOfSpeech || 'noun',
        definitions: [{
          meaning: dictData.meanings[0]?.definitions[0]?.definition || '',
          vietnamese: ''
        }],
        examples: dictData.meanings[0]?.definitions[0]?.example 
          ? [{ sentence: dictData.meanings[0]?.definitions[0]?.example, vietnamese: '' }]
          : [],
        synonyms: dictData.meanings[0]?.synonyms || [],
        antonyms: dictData.meanings[0]?.antonyms || [],
        audioUrl: dictData.phonetics?.find((p: any) => p.audio)?.audio || '',
        imageUrls: imageUrl ? [imageUrl] : [],
        tags: [article.level.toLowerCase(), 'reading'],
        difficulty: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      
      await wordRepo.add(newWord)
      if (user?.id) syncEngine.sync()
      setSaved(true)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col md:flex-row gap-6 items-start"
    >
      <Card className="flex-1 p-6 md:p-8">
        <button onClick={onBack} className="text-sm font-medium text-gray-500 hover:text-gray-900 mb-6 inline-flex items-center gap-2">
          &larr; Quay lại danh sách
        </button>
        <h2 className="text-3xl font-black text-gray-900 dark:text-gray-100 mb-6">{article.title}</h2>
        <div className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
          {words.map((w, i) => {
            const isClickable = /[a-zA-Z]/.test(w)
            if (!isClickable) return <span key={i}>{w}</span>
            return (
              <span 
                key={i} 
                onClick={() => handleWordClick(w)}
                className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:text-blue-700 dark:hover:text-blue-300 rounded transition-colors px-0.5"
              >
                {w}
              </span>
            )
          })}
        </div>
      </Card>

      <div className="w-full md:w-80 shrink-0 sticky top-4">
        <AnimatePresence mode="wait">
          {selectedWord && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="p-5 border-2 border-blue-500/20 shadow-xl shadow-blue-500/5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{selectedWord}</h3>
                    {dictData?.phonetic && <p className="text-sm text-gray-500">{dictData.phonetic}</p>}
                  </div>
                  <button onClick={() => setSelectedWord(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                {loading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  </div>
                ) : dictData?.error ? (
                  <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{dictData.error}</p>
                ) : dictData ? (
                  <div className="space-y-4">
                    {dictData.phonetics?.find((p: any) => p.audio) && (
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="w-full"
                        onClick={() => new Audio(dictData.phonetics.find((p: any) => p.audio).audio).play()}
                      >
                        <Volume2 className="w-4 h-4 mr-2" /> Nghe phát âm
                      </Button>
                    )}
                    <div className="text-sm space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                      {dictData.meanings.slice(0, 2).map((m: any, idx: number) => (
                        <div key={idx}>
                          <p className="font-semibold text-blue-600 dark:text-blue-400 text-xs italic">{m.partOfSpeech}</p>
                          <p className="text-gray-700 dark:text-gray-300 mt-1">{m.definitions[0].definition}</p>
                        </div>
                      ))}
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleSaveWord}
                      disabled={saved}
                      variant={saved ? "secondary" : "primary"}
                    >
                      {saved ? <><Check className="w-4 h-4 mr-2" /> Đã lưu</> : <><Plus className="w-4 h-4 mr-2" /> Lưu từ này</>}
                    </Button>
                  </div>
                ) : null}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
