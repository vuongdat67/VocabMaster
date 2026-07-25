import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Volume2, Pencil, Trash2, Check, X, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { wordRepo } from '@/db/word-repo'
import { useAudio } from '@/hooks/useAudio'
import { getImageForWord } from '@/lib/image-search'
import type { Word, PartOfSpeech } from '@/types/word'

export function WordDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { speak } = useAudio()
  const [word, setWord] = useState<Word | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editWord, setEditWord] = useState<Word | null>(null)
  const [isRefetchingImage, setIsRefetchingImage] = useState(false)

  const handleRefetchImage = async () => {
    if (!word) return
    setIsRefetchingImage(true)
    try {
      const imgUrl = await getImageForWord(word.word)
      if (imgUrl) {
        await wordRepo.update(word.id, { imageUrls: [imgUrl] })
        setWord({ ...word, imageUrls: [imgUrl] })
      }
    } finally {
      setIsRefetchingImage(false)
    }
  }

  useEffect(() => {
    if (!id) return
    wordRepo
      .getById(id)
      .then((w) => setWord(w ?? null))
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    if (!word || !window.confirm(`Xóa từ "${word.word}"?`)) return
    await wordRepo.delete(word.id)
    navigate('/words')
  }

  const handleSave = async () => {
    if (!editWord) return
    await wordRepo.update(editWord.id, {
      word: editWord.word,
      ipa: editWord.ipa,
      partOfSpeech: editWord.partOfSpeech,
      definitions: editWord.definitions,
      examples: editWord.examples,
      tags: editWord.tags,
    })
    setWord(editWord)
    setEditing(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 rounded-full"
          style={{ borderColor: 'var(--accent-500)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  if (!word) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p>Không tìm thấy từ này</p>
        <button onClick={() => navigate('/words')} className="mt-2 hover:underline"
          style={{ color: 'var(--accent-500)' }}>
          Quay lại danh sách
        </button>
      </div>
    )
  }

  if (editing && editWord) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setEditing(false)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-4 h-4" /> Huỷ
          </button>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={handleSave} icon={<Check className="w-4 h-4" />}>
              Lưu
            </Button>
          </div>
        </div>

        <Card className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Từ (EN)</label>
              <input value={editWord.word} onChange={(e) => setEditWord({ ...editWord, word: e.target.value })}
                className="w-full p-2 rounded-lg border text-sm"
                style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--surface-card)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">IPA</label>
              <input value={editWord.ipa} onChange={(e) => setEditWord({ ...editWord, ipa: e.target.value })}
                className="w-full p-2 rounded-lg border text-sm"
                style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--surface-card)', color: 'var(--text-primary)' }} />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Nghĩa (VN)</label>
            <input value={editWord.definitions[0]?.vietnamese ?? ''}
              onChange={(e) => setEditWord({ ...editWord, definitions: [{ ...editWord.definitions[0]!, vietnamese: e.target.value }] })}
              className="w-full p-2 rounded-lg border text-sm"
              style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--surface-card)', color: 'var(--text-primary)' }} />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Định nghĩa (EN)</label>
            <input value={editWord.definitions[0]?.meaning ?? ''}
              onChange={(e) => setEditWord({ ...editWord, definitions: [{ ...editWord.definitions[0]!, meaning: e.target.value }] })}
              className="w-full p-2 rounded-lg border text-sm"
              style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--surface-card)', color: 'var(--text-primary)' }} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tags</label>
              <input value={editWord.tags.join(', ')}
                onChange={(e) => setEditWord({ ...editWord, tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })}
                className="w-full p-2 rounded-lg border text-sm"
                style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--surface-card)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Từ loại</label>
              <select value={editWord.partOfSpeech}
                onChange={(e) => setEditWord({ ...editWord, partOfSpeech: e.target.value as PartOfSpeech })}
                className="w-full p-2 rounded-lg border text-sm"
                style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--surface-card)', color: 'var(--text-primary)' }}>
                {(['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'pronoun', 'phrase'] as PartOfSpeech[]).map((pos) => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/words')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => { setEditWord({ ...word }); setEditing(true); }}
            icon={<Pencil className="w-4 h-4" />}>
            Sửa
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDelete} icon={<Trash2 className="w-4 h-4" />}>
            Xoá
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="relative group shrink-0">
            {word.imageUrls[0] && word.imageUrls[0].includes('/') ? (
              <img src={word.imageUrls[0]} alt={word.word} className="w-24 h-24 object-cover rounded-xl"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            ) : (
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 text-xs text-center p-2">
                Chưa có ảnh
              </div>
            )}
            <button
              onClick={handleRefetchImage}
              disabled={isRefetchingImage}
              title="Đổi ảnh khác"
              className="absolute -top-2 -right-2 p-1.5 bg-white dark:bg-gray-700 shadow-md rounded-full text-gray-500 hover:text-blue-500 transition-opacity opacity-0 group-hover:opacity-100 disabled:opacity-50 z-10"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetchingImage ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-gray-900">{word.word}</h2>
              <button onClick={() => speak(word.word)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                style={{ color: 'var(--accent-500)' }}>
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-500 text-lg mt-1">{word.ipa}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="info">{word.partOfSpeech}</Badge>
              {word.tags.map((t) => (<Badge key={t}>{t}</Badge>))}
              <Badge variant={word.difficulty <= 2 ? 'success' : word.difficulty <= 3 ? 'warning' : 'danger'}>
                Level {word.difficulty}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Định nghĩa</h3>
        <div className="space-y-3">
          {word.definitions.map((def, i) => (
            <div key={i} className="p-3 rounded-lg"
              style={{ backgroundColor: 'color-mix(in srgb, var(--accent-500) 6%, var(--surface-card))' }}>
              <p className="text-gray-900 font-medium">{def.vietnamese}</p>
              <p className="text-sm text-gray-500 mt-1">{def.meaning}</p>
            </div>
          ))}
        </div>
      </Card>

      {word.examples.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Ví dụ</h3>
          <div className="space-y-2">
            {word.examples.map((ex, i) => (
              <div key={i} className="text-sm">
                <p className="text-gray-700 dark:text-gray-300 italic">&ldquo;{ex.sentence}&rdquo;</p>
                <p className="text-gray-500 mt-0.5">{ex.vietnamese}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {word.synonyms.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Từ đồng nghĩa</h3>
          <div className="flex flex-wrap gap-2">
            {word.synonyms.map((syn) => (
              <span key={syn} className="px-3 py-1 rounded-lg text-sm"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent-500) 12%, var(--surface-card))',
                  color: 'var(--accent-600)',
                }}>
                {syn}
              </span>
            ))}
          </div>
        </Card>
      )}
    </motion.div>
  )
}
