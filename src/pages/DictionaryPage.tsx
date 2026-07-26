import { useState, useRef, useEffect } from 'react'
import { Search, Plus, Volume2, Loader2, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { db } from '@/db'
import type { Word, PartOfSpeech } from '@/types/word'

interface DictResult {
  word: string
  phonetics: { text?: string; audio?: string }[]
  meanings: {
    partOfSpeech: string
    definitions: {
      definition: string
      example?: string
      synonyms: string[]
      antonyms: string[]
    }[]
  }[]
}

export function DictionaryPage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<DictResult | null>(null)
  const [translatedMeanings, setTranslatedMeanings] = useState<Record<string, string>>({})
  const [translatedExamples, setTranslatedExamples] = useState<Record<string, string>>({})
  const [isTranslating, setIsTranslating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const translateText = async (text: string): Promise<string> => {
    try {
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(text)}`)
      const data = await res.json()
      return data[0].map((item: any) => item[0]).join('')
    } catch {
      return text
    }
  }

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)
    setTranslatedMeanings({})
    setTranslatedExamples({})
    setSaveSuccess(false)

    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(query.trim())}`)
      if (!res.ok) {
        if (res.status === 404) throw new Error(`Không tìm thấy từ "${query}" trong từ điển.`)
        throw new Error('Có lỗi xảy ra khi tra từ.')
      }
      const data: DictResult[] = await res.json()
      if (!data || data.length === 0) throw new Error('Không tìm thấy từ này.')
      
      const firstResult = data[0]
      if (!firstResult) throw new Error('Không tìm thấy từ này.')
      
      setResult(firstResult)
      
      setIsTranslating(true)
      const tMeanings: Record<string, string> = {}
      const tExamples: Record<string, string> = {}
      
      const promises: Promise<void>[] = []
      
      firstResult.meanings?.forEach((m, mIdx) => {
        m.definitions.forEach((d, dIdx) => {
          if (d.definition) {
            promises.push(translateText(d.definition).then(vi => { tMeanings[`${mIdx}-${dIdx}`] = vi }))
          }
          if (d.example) {
            promises.push(translateText(d.example).then(vi => { tExamples[`${mIdx}-${dIdx}`] = vi }))
          }
        })
      })
      
      await Promise.all(promises)
      setTranslatedMeanings(tMeanings)
      setTranslatedExamples(tExamples)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
      setIsTranslating(false)
    }
  }

  const playAudio = (url?: string) => {
    if (!url) return
    new Audio(url).play().catch(console.error)
  }

  const handleSave = async () => {
    if (!result) return
    setSaving(true)
    
    try {
      const phonetic = (result.phonetics || []).find(p => p.text)?.text || `/${result.word}/`
      const audioUrl = (result.phonetics || []).find(p => p.audio && p.audio.length > 0)?.audio || undefined
      
      let primaryPos: PartOfSpeech = 'noun'
      const posMap: Record<string, PartOfSpeech> = {
        noun: 'noun', verb: 'verb', adjective: 'adjective', adverb: 'adverb',
        preposition: 'preposition', conjunction: 'conjunction', pronoun: 'pronoun', interjection: 'interjection'
      }
      if (result.meanings && result.meanings.length > 0) {
        const p = result.meanings[0]?.partOfSpeech?.toLowerCase()
        if (p && posMap[p]) primaryPos = posMap[p]
      }

      const definitions: { meaning: string; vietnamese: string }[] = []
      const examples: { sentence: string; vietnamese: string }[] = []
      const synonyms = new Set<string>()
      const antonyms = new Set<string>()

      ;(result.meanings || []).forEach((m, mIdx) => {
        ;(m.definitions || []).forEach((d, dIdx) => {
          if (d.definition) {
            definitions.push({ meaning: d.definition, vietnamese: translatedMeanings[`${mIdx}-${dIdx}`] || '' })
          }
          if (d.example) {
            examples.push({ sentence: d.example, vietnamese: translatedExamples[`${mIdx}-${dIdx}`] || '' })
          }
          d.synonyms.forEach(s => synonyms.add(s))
          d.antonyms.forEach(a => antonyms.add(a))
        })
      })

      const newWord: Word = {
        id: crypto.randomUUID(),
        word: result.word,
        ipa: phonetic,
        partOfSpeech: primaryPos,
        definitions: definitions.slice(0, 3), // Limit to 3 best meanings
        examples: examples.slice(0, 3),
        synonyms: Array.from(synonyms).slice(0, 5),
        antonyms: Array.from(antonyms).slice(0, 5),
        imageUrls: [],
        audioUrl,
        tags: ['dictionary', 'saved'],
        difficulty: 3,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      await db.words.add(newWord)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error(err)
      alert('Có lỗi khi lưu từ vựng!')
    } finally {
      setSaving(false)
    }
  }

  const bestAudio = (result?.phonetics || []).find(p => p.audio && p.audio.length > 0)?.audio
  const phoneticText = (result?.phonetics || []).find(p => p.text)?.text

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Từ Điển Trực Tuyến</h1>
        <p className="text-gray-500">Tra cứu định nghĩa, phát âm và thêm trực tiếp vào kho từ vựng.</p>
      </div>

      <form onSubmit={handleSearch} className="relative mb-12 max-w-2xl mx-auto group">
        <input 
          ref={inputRef}
          type="text" 
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Nhập từ vựng cần tra..."
          className="w-full bg-white text-lg px-6 py-4 rounded-2xl shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all pl-14 group-hover:shadow-md"
        />
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-accent-500 transition-colors" />
        <button 
          type="submit"
          disabled={loading || !query.trim()}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-accent-500 hover:bg-accent-600 text-white px-6 py-2 rounded-xl font-medium transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Tra cứu'}
        </button>
      </form>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-center p-8 bg-red-50 text-red-600 rounded-2xl max-w-2xl mx-auto">
            <p className="font-medium text-lg">{error}</p>
          </motion.div>
        )}

        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
              <div>
                <h2 className="text-5xl font-extrabold text-gray-900 tracking-tight capitalize mb-2">{result.word}</h2>
                <div className="flex items-center gap-4 text-gray-500">
                  {phoneticText && <span className="text-xl font-medium">{phoneticText}</span>}
                  {bestAudio && (
                    <button onClick={() => playAudio(bestAudio)} className="p-2 hover:bg-accent-50 hover:text-accent-600 rounded-full transition-colors" title="Nghe phát âm">
                      <Volume2 className="w-6 h-6" />
                    </button>
                  )}
                </div>
              </div>
              
              <button
                onClick={handleSave}
                disabled={saving || saveSuccess}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                  saveSuccess 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-gray-900 text-white hover:bg-accent-600 hover:shadow-lg hover:-translate-y-0.5'
                }`}
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                 saveSuccess ? <><Check className="w-5 h-5" /> Đã lưu</> : 
                 <><Plus className="w-5 h-5" /> Thêm vào kho</>}
              </button>
            </div>

            <div className="space-y-8">
              {result.meanings.map((meaning, mIdx) => (
                <div key={mIdx} className="relative">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 inline-block px-3 py-1 bg-gray-100 rounded-lg italic">
                    {meaning.partOfSpeech}
                  </h3>
                  
                  <div className="space-y-6">
                    {meaning.definitions.slice(0, 3).map((def, dIdx) => (
                      <div key={dIdx} className="pl-4 border-l-4 border-accent-200">
                        <p className="text-lg text-gray-800 mb-1">{def.definition}</p>
                        {isTranslating ? (
                          <div className="h-5 w-48 bg-gray-100 animate-pulse rounded mb-2"></div>
                        ) : (
                          <p className="text-accent-600 font-medium mb-2">{translatedMeanings[`${mIdx}-${dIdx}`]}</p>
                        )}
                        
                        {def.example && (
                          <div className="bg-gray-50 p-4 rounded-xl mt-3">
                            <p className="text-gray-600 italic">"{def.example}"</p>
                            {!isTranslating && translatedExamples[`${mIdx}-${dIdx}`] && (
                              <p className="text-gray-500 mt-1">"{translatedExamples[`${mIdx}-${dIdx}`]}"</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
