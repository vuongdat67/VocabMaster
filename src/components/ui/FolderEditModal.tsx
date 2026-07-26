import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Folder as FolderIcon } from 'lucide-react'
import { Button } from './Button'
import type { Folder } from '@/types/folder'

interface FolderEditModalProps {
  isOpen: boolean
  onClose: () => void
  folder: Folder | null
  onSave: (folder: Partial<Folder>) => void
}

const COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500',
  'bg-purple-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-teal-500',
  'bg-orange-500', 'bg-pink-500'
]

const ICONS = ['📁', '📚', '🌟', '🚀', '🧠', '💡', '🔥', '🏆', '🎯', '🌈', '🌍', '🎸']

export function FolderEditModal({ isOpen, onClose, folder, onSave }: FolderEditModalProps) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('📁')
  const [color, setColor] = useState('bg-blue-500')

  useEffect(() => {
    if (folder) {
      setName(folder.name)
      setIcon(folder.icon || '📁')
      setColor(folder.color || 'bg-blue-500')
    } else {
      setName('')
      setIcon('📁')
      setColor('bg-blue-500')
    }
  }, [folder, isOpen])

  const handleSave = () => {
    if (!name.trim()) return
    onSave({ name, icon, color })
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl w-full max-w-md overflow-hidden border-4 border-gray-100 dark:border-gray-700"
        >
          <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FolderIcon className="w-5 h-5" />
              {folder ? 'Sửa thư mục' : 'Tạo thư mục mới'}
            </h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tên thư mục</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ví dụ: Toeic, IELTS, Môi trường..."
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Biểu tượng</label>
              <div className="flex flex-wrap gap-2">
                {ICONS.map(i => (
                  <button
                    key={i}
                    onClick={() => setIcon(i)}
                    className={`w-12 h-12 flex items-center justify-center text-2xl rounded-2xl transition-all ${icon === i ? 'bg-blue-100 dark:bg-blue-900 shadow-inner' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Màu sắc</label>
              <div className="flex flex-wrap gap-3">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-10 h-10 rounded-full ${c} ${color === c ? 'ring-4 ring-offset-2 ring-gray-300 dark:ring-gray-600' : ''}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose}>Hủy</Button>
            <Button variant="primary" onClick={handleSave} icon={<Save className="w-4 h-4"/>}>
              {folder ? 'Lưu thay đổi' : 'Tạo thư mục'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
