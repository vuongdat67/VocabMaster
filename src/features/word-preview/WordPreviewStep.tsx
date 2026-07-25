import { motion } from 'framer-motion'
import { Volume2, Play, BookOpen } from 'lucide-react'
import type { Word } from '@/types/word'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAudio } from '@/hooks/useAudio'

interface Props {
  words: Word[]
  batchIndex: number
  totalBatches: number
  onStart: () => void
}

export function WordPreviewStep({ words, batchIndex, totalBatches, onStart }: Props) {
  const { speak } = useAudio()

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  }

  const getPosColor = (pos: string) => {
    switch (pos) {
      case 'noun':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'verb':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'adjective':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'adverb':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="inline-flex items-center justify-center p-3 mb-4 rounded-full"
          style={{ 
            backgroundColor: 'color-mix(in srgb, var(--accent-500) 15%, transparent)',
            color: 'var(--accent-600)'
          }}
        >
          <BookOpen className="w-8 h-8" />
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl font-bold text-gray-900 mb-2"
        >
          Batch {batchIndex + 1}/{totalBatches}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-500 text-lg"
        >
          {words.length} từ mới
        </motion.p>
      </div>

      {/* Grid of Words */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
      >
        {words.map((word) => (
          <motion.div key={word.id} variants={item} className="h-full">
            <Card 
              className="h-full flex flex-col items-center text-center p-6 border-transparent transition-colors hover:border-[var(--accent-300)]" 
              hover
            >
              {word.imageUrls[0] && word.imageUrls[0].includes('/') ? (
                <img
                  src={word.imageUrls[0]}
                  alt={word.word}
                  className="w-20 h-20 object-cover rounded-2xl shadow-sm mb-4"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              ) : (
                <div className="w-20 h-20 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                  <span className="text-3xl text-gray-300 font-bold">
                    {word.word.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 mb-1 justify-center w-full">
                <h3 className="text-xl font-bold text-gray-900">{word.word}</h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    speak(word.word)
                  }}
                  className="p-1.5 rounded-full text-gray-400 hover:text-[var(--accent-600)] hover:bg-gray-100 transition-colors"
                  title="Nghe phát âm"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              {word.ipa && (
                <p className="text-sm text-gray-500 mb-3 font-mono">{word.ipa}</p>
              )}

              <div
                className={`text-[11px] font-medium uppercase tracking-wider px-2.5 py-1 rounded-md border mb-4 ${getPosColor(
                  word.partOfSpeech
                )}`}
              >
                {word.partOfSpeech}
              </div>

              <div className="mt-auto pt-4 border-t border-gray-100 w-full">
                <p className="text-base text-gray-800 font-medium line-clamp-2">
                  {word.definitions[0]?.vietnamese}
                </p>
                {word.definitions[0]?.meaning && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                    {word.definitions[0].meaning}
                  </p>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Footer Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex justify-center"
      >
        <Button
          size="lg"
          icon={<Play className="w-5 h-5 fill-current" />}
          onClick={onStart}
          className="min-w-[200px]"
        >
          Bắt đầu học
        </Button>
      </motion.div>
    </div>
  )
}
