import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check } from 'lucide-react'
import { Card } from './Card'
import { Button } from './Button'
import type { Word, PartOfSpeech } from '@/types/word'

interface WordEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (word: Partial<Word>) => Promise<void>
  initialData?: Word | null
}

const PARTS_OF_SPEECH: PartOfSpeech[] = [
  'noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'pronoun', 'interjection', 'phrase'
]

export function WordEditModal({ isOpen, onClose, onSave, initialData }: WordEditModalProps) {
  const [formData, setFormData] = useState<Partial<Word>>({
    word: '',
    ipa: '',
    partOfSpeech: 'noun',
    definitions: [{ vietnamese: '', meaning: '' }],
    examples: [],
    tags: [],
    difficulty: 1,
  })

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({ ...initialData })
      } else {
        setFormData({
          word: '',
          ipa: '',
          partOfSpeech: 'noun',
          definitions: [{ vietnamese: '', meaning: '' }],
          examples: [],
          tags: [],
          difficulty: 1,
        })
      }
    }
  }, [isOpen, initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave(formData)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-base-100 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col relative"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-base-300">
            <h2 className="text-lg font-bold text-base-content">
              {initialData ? 'Sửa từ vựng' : 'Thêm từ vựng mới'}
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-base-200 rounded-lg text-base-content/70">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 overflow-y-auto flex-1 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-base-content/70 mb-1">Từ vựng (EN)</label>
                <input
                  required
                  value={formData.word}
                  onChange={(e) => setFormData({ ...formData, word: e.target.value })}
                  className="input input-bordered w-full input-sm text-base-content bg-base-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-base-content/70 mb-1">Phiên âm (IPA)</label>
                <input
                  value={formData.ipa}
                  onChange={(e) => setFormData({ ...formData, ipa: e.target.value })}
                  className="input input-bordered w-full input-sm text-base-content bg-base-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-base-content/70 mb-1">Nghĩa tiếng Việt</label>
                <input
                  required
                  value={formData.definitions?.[0]?.vietnamese || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    definitions: [{ ...formData.definitions![0], vietnamese: e.target.value, meaning: formData.definitions![0]?.meaning || '' }]
                  })}
                  className="input input-bordered w-full input-sm text-base-content bg-base-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-base-content/70 mb-1">Giải nghĩa tiếng Anh</label>
                <input
                  value={formData.definitions?.[0]?.meaning || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    definitions: [{ ...formData.definitions![0], meaning: e.target.value, vietnamese: formData.definitions![0]?.vietnamese || '' }]
                  })}
                  className="input input-bordered w-full input-sm text-base-content bg-base-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-base-content/70 mb-1">Từ loại</label>
                <select
                  value={formData.partOfSpeech}
                  onChange={(e) => setFormData({ ...formData, partOfSpeech: e.target.value as PartOfSpeech })}
                  className="select select-bordered w-full select-sm text-base-content bg-base-100"
                >
                  {PARTS_OF_SPEECH.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-base-content/70 mb-1">Tags (cách nhau dấu phẩy)</label>
                <input
                  value={formData.tags?.join(', ')}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                  className="input input-bordered w-full input-sm text-base-content bg-base-100"
                  placeholder="toeic, ielts, my-list"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-base-content/70 mb-1">Độ khó (1-5)</label>
              <input
                type="range" min="1" max="5" 
                value={formData.difficulty} 
                onChange={e => setFormData({...formData, difficulty: Number(e.target.value) as 1|2|3|4|5})}
                className="range range-xs range-primary" 
              />
              <div className="w-full flex justify-between text-xs px-2 mt-1 opacity-50">
                <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
              </div>
            </div>
          </form>

          <div className="p-4 border-t border-base-300 flex justify-end gap-2 bg-base-200/50 rounded-b-2xl">
            <Button variant="ghost" onClick={onClose} disabled={loading}>Hủy</Button>
            <Button variant="primary" onClick={handleSubmit} isLoading={loading} icon={<Check className="w-4 h-4"/>}>
              Lưu từ vựng
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
