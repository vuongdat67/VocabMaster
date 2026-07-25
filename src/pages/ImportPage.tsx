import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileText, Plus, Check, AlertCircle, Image } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { wordRepo } from '@/db/word-repo'
import { getImageForWord, isUnsplashConfigured } from '@/lib/image-search'
import type { Word, PartOfSpeech } from '@/types/word'

export function ImportPage() {
 const [mode, setMode] = useState<'upload' | 'manual' | null>(null)
 const [importing, setImporting] = useState(false)
 const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null)
 const [autoImage, setAutoImage] = useState(isUnsplashConfigured())
 const fileRef = useRef<HTMLInputElement>(null)

 // Manual mode
 const [manualWord, setManualWord] = useState({
 word: '',
 ipa: '',
 partOfSpeech: 'noun' as PartOfSpeech,
 vietnamese: '',
 meaning: '',
 example: '',
 exampleVi: '',
 tags: '',
 })

 const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0]
 if (!file) return

 setImporting(true)
 setResult(null)

 try {
 const text = await file.text()
 let words: Partial<Word>[] = []

 if (file.name.endsWith('.csv')) {
 words = parseCSV(text)
 } else if (file.name.endsWith('.json')) {
 words = JSON.parse(text)
 }

 const imported: Word[] = words
 .filter((w: Record<string, unknown>) => w.word)
 .map((w: Record<string, unknown>) => ({
 id: crypto.randomUUID(),
 word: String(w.word ?? '').trim().toLowerCase(),
 ipa: String(w.ipa ?? ''),
 partOfSpeech: (w.partOfSpeech as Word['partOfSpeech']) ?? 'noun',
 definitions: (w.definitions as Word['definitions']) ?? [{ meaning: String(w.meaning ?? ''), vietnamese: String(w.vietnamese ?? '') }],
 examples: (w.examples as Word['examples']) ?? (w.example ? [{ sentence: String(w.example), vietnamese: String(w.exampleVi ?? '') }] : []),
 synonyms: (w.synonyms as string[]) ?? [],
 antonyms: (w.antonyms as string[]) ?? [],
 imageUrls: (w.imageUrls as string[]) ?? [],
 audioUrl: w.audioUrl as string | undefined,
 tags: (w.tags as string[]) ?? [],
 difficulty: (w.difficulty as Word['difficulty']) ?? 3,
 createdAt: Date.now(),
 updatedAt: Date.now(),
 } as Word))

 // Auto-fetch images if enabled
 if (autoImage && isUnsplashConfigured()) {
 for (const wrd of imported) {
 try {
 const img = await getImageForWord(wrd.word)
 if (img) wrd.imageUrls = [img]
 } catch { /* skip */ }
 }
 }

 const keys = await wordRepo.bulkAdd(imported)
 setResult({
 success: Array.isArray(keys) ? keys.filter(Boolean).length : (keys ? 1 : 0),
 errors: [],
 })
 } catch (err) {
 setResult({ success: 0, errors: [(err as Error).message] })
 } finally {
 setImporting(false)
 }
 }

 const handleManualAdd = async () => {
 if (!manualWord.word.trim()) return

 setImporting(true)
 try {
 const word: Word = {
 id: crypto.randomUUID(),
 word: manualWord.word.trim().toLowerCase(),
 ipa: manualWord.ipa,
 partOfSpeech: manualWord.partOfSpeech,
 definitions: [{ meaning: manualWord.meaning, vietnamese: manualWord.vietnamese }],
 examples: manualWord.example ? [{ sentence: manualWord.example, vietnamese: manualWord.exampleVi }] : [],
 synonyms: [],
 antonyms: [],
 imageUrls: [],
 tags: manualWord.tags ? manualWord.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
 difficulty: 3,
 createdAt: Date.now(),
 updatedAt: Date.now(),
 }
 await wordRepo.add(word)
 setResult({ success: 1, errors: [] })
 setManualWord({
 word: '', ipa: '', partOfSpeech: 'noun',
 vietnamese: '', meaning: '',
 example: '', exampleVi: '', tags: '',
 })
 } catch (err) {
 setResult({ success: 0, errors: [(err as Error).message] })
 } finally {
 setImporting(false)
 }
 }

 return (
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
 <h2 className="text-2xl font-bold text-gray-900">Import từ vựng</h2>

 {!mode && (
 <div className="grid grid-cols-2 gap-4">
 <button
 onClick={() => setMode('upload')}
 className="p-8 rounded-2xl border-2 border-dashed border-gray-300 hover:border-indigo-400 transition-colors text-center"
 >
 <Upload className="w-10 h-10 mx-auto mb-3 text-indigo-600" />
 <h3 className="font-semibold text-gray-900">Tải file lên</h3>
 <p className="text-sm text-gray-500 mt-1">CSV hoặc JSON</p>
 </button>
 <button
 onClick={() => setMode('manual')}
 className="p-8 rounded-2xl border-2 border-dashed border-gray-300 hover:border-indigo-400 transition-colors text-center"
 >
 <Plus className="w-10 h-10 mx-auto mb-3 text-indigo-600" />
 <h3 className="font-semibold text-gray-900">Nhập thủ công</h3>
 <p className="text-sm text-gray-500 mt-1">Thêm từng từ một</p>
 </button>
 </div>
 )}

 {mode === 'upload' && (
 <Card className="p-6">
 <div className="text-center">
 <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
 <h3 className="font-semibold text-gray-900 mb-2">Upload file từ vựng</h3>
 <p className="text-sm text-gray-500 mb-4">
 Hỗ trợ CSV (word, ipa, vietnamese, meaning, tags) và JSON
 </p>

 {/* Auto image toggle */}
 <div className="flex items-center justify-center gap-2 mb-4">
 <label className="relative inline-flex items-center cursor-pointer">
 <input
 type="checkbox"
 checked={autoImage}
 onChange={(e) => setAutoImage(e.target.checked)}
 className="sr-only peer"
 />
 <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
 </label>
 <span className="text-xs text-gray-500 flex items-center gap-1">
 <Image className="w-3 h-3" />
 Tự động tìm ảnh (Unsplash)
 </span>
 </div>

 <input
 ref={fileRef}
 type="file"
 accept=".csv,.json"
 onChange={handleFileUpload}
 className="hidden"
 />
 <Button onClick={() => fileRef.current?.click()} isLoading={importing}>
 Chọn file
 </Button>
 </div>
 </Card>
 )}

 {mode === 'manual' && (
 <Card className="p-6 space-y-4">
 <h3 className="font-semibold text-gray-900">Thêm từ mới</h3>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm text-gray-600 mb-1">Từ (EN)</label>
 <input
 type="text"
 value={manualWord.word}
 onChange={(e) => setManualWord({ ...manualWord, word: e.target.value })}
 className="w-full p-2.5 rounded-lg border border-gray-200 bg-white"
 placeholder="hello"
 />
 </div>
 <div>
 <label className="block text-sm text-gray-600 mb-1">IPA</label>
 <input
 type="text"
 value={manualWord.ipa}
 onChange={(e) => setManualWord({ ...manualWord, ipa: e.target.value })}
 className="w-full p-2.5 rounded-lg border border-gray-200 bg-white"
 placeholder="/həˈloʊ/"
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm text-gray-600 mb-1">Nghĩa Tiếng Việt</label>
 <input
 type="text"
 value={manualWord.vietnamese}
 onChange={(e) => setManualWord({ ...manualWord, vietnamese: e.target.value })}
 className="w-full p-2.5 rounded-lg border border-gray-200 bg-white"
 placeholder="xin chào"
 />
 </div>
 <div>
 <label className="block text-sm text-gray-600 mb-1">Định nghĩa (EN)</label>
 <input
 type="text"
 value={manualWord.meaning}
 onChange={(e) => setManualWord({ ...manualWord, meaning: e.target.value })}
 className="w-full p-2.5 rounded-lg border border-gray-200 bg-white"
 placeholder="a greeting"
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm text-gray-600 mb-1">Câu ví dụ (EN)</label>
 <input
 type="text"
 value={manualWord.example}
 onChange={(e) => setManualWord({ ...manualWord, example: e.target.value })}
 className="w-full p-2.5 rounded-lg border border-gray-200 bg-white"
 placeholder="Hello, how are you?"
 />
 </div>
 <div>
 <label className="block text-sm text-gray-600 mb-1">Dịch ví dụ</label>
 <input
 type="text"
 value={manualWord.exampleVi}
 onChange={(e) => setManualWord({ ...manualWord, exampleVi: e.target.value })}
 className="w-full p-2.5 rounded-lg border border-gray-200 bg-white"
 placeholder="Xin chào, bạn khỏe không?"
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm text-gray-600 mb-1">Từ loại</label>
 <select
 value={manualWord.partOfSpeech}
 onChange={(e) => setManualWord({ ...manualWord, partOfSpeech: e.target.value as PartOfSpeech })}
 className="w-full p-2.5 rounded-lg border border-gray-200 bg-white"
 >
 <option value="noun">Noun</option>
 <option value="verb">Verb</option>
 <option value="adjective">Adjective</option>
 <option value="adverb">Adverb</option>
 <option value="preposition">Preposition</option>
 <option value="conjunction">Conjunction</option>
 <option value="pronoun">Pronoun</option>
 <option value="phrase">Phrase</option>
 </select>
 </div>
 <div>
 <label className="block text-sm text-gray-600 mb-1">Tags (phân cách bằng dấu phẩy)</label>
 <input
 type="text"
 value={manualWord.tags}
 onChange={(e) => setManualWord({ ...manualWord, tags: e.target.value })}
 className="w-full p-2.5 rounded-lg border border-gray-200 bg-white"
 placeholder="IELTS, Academic"
 />
 </div>
 </div>

 <Button onClick={handleManualAdd} isLoading={importing} className="w-full">
 <Plus className="w-4 h-4" /> Thêm từ
 </Button>
 </Card>
 )}

 {/* Result */}
 {result && (
 <Card className={`p-4 ${result.success > 0 ? 'bg-green-50 border-green-200 ' : 'bg-red-50 border-red-200 '}`}>
 <div className="flex items-center gap-2">
 {result.success > 0 ? (
 <Check className="w-5 h-5 text-green-600" />
 ) : (
 <AlertCircle className="w-5 h-5 text-red-600" />
 )}
 <span className="text-sm font-medium">
 {result.success > 0
 ? `Import thành công ${result.success} từ!`
 : 'Import thất bại'}
 </span>
 </div>
 {result.errors.length > 0 && (
 <p className="text-xs text-red-500 mt-1">{result.errors[0]}</p>
 )}
 <Button
 variant="ghost"
 size="sm"
 className="mt-2"
 onClick={() => { setMode(null); setResult(null) }}
 >
 Tiếp tục
 </Button>
 </Card>
 )}

  {!mode && !result && (
  <Card className="p-4"
    style={{ backgroundColor: 'color-mix(in srgb, var(--accent-500) 6%, var(--surface-card))' }}>
  <h4 className="text-sm font-medium text-gray-700 mb-2">Hướng dẫn format CSV:</h4>
  <code className="text-xs text-gray-500 block whitespace-pre-wrap">
  word,ipa,vietnamese,meaning,tags,example,exampleVi{'\n'}
  hello,/həˈloʊ/,xin chào,a greeting,IELTS,"Hello world","Xin chào thế giới"
  </code>
  <a
  href="/sample-vocab.csv"
  download
  className="inline-flex items-center gap-1 text-xs font-medium mt-3 hover:underline"
  style={{ color: 'var(--accent-500)' }}
  >
  <FileText className="w-3 h-3" />
  Tải file mẫu (15 từ)
  </a>
  </Card>
  )}
 </motion.div>
 )
}

function parseCSV(text: string): Record<string, unknown>[] {
 const lines = text.trim().split('\n')
 if (lines.length < 2) return []

 const headers = lines[0]!.split(',').map((h) => h.trim().toLowerCase())
 const words: Record<string, unknown>[] = []

 for (let i = 1; i < lines.length; i++) {
 const values = parseCSVLine(lines[i]!)
 const entry: Record<string, string> = {}
 headers.forEach((h, idx) => {
 entry[h] = values[idx] ?? ''
 })

 words.push({
 word: entry.word,
 ipa: entry.ipa,
 definitions: entry.meaning ? [{ meaning: entry.meaning, vietnamese: entry.vietnamese ?? '' }] : [],
 examples: entry.example ? [{ sentence: entry.example, vietnamese: entry.examplevi ?? '' }] : [],
 tags: entry.tags ? entry.tags.split(';').map((t: string) => t.trim()).filter(Boolean) : [],
 })
 }

 return words
}

function parseCSVLine(line: string): string[] {
 const result: string[] = []
 let current = ''
 let inQuotes = false

 for (const char of line) {
 if (char === '"') {
 inQuotes = !inQuotes
 } else if (char === ',' && !inQuotes) {
 result.push(current.trim())
 current = ''
 } else {
 current += char
 }
 }
 result.push(current.trim())
 return result
}
