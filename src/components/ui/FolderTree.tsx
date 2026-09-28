import { useState, DragEvent } from 'react'
import { Folder as FolderIcon, FolderOpen, ChevronRight, ChevronDown, Trash2, Edit2, Plus } from 'lucide-react'
import type { Folder } from '@/types/folder'
import { motion, AnimatePresence } from 'framer-motion'

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}

interface FolderTreeProps {
  folders: Folder[]
  selectedFolderId?: string | null
  onSelectFolder: (id: string | null) => void
  onAddFolder: (parentId?: string | null) => void
  onEditFolder: (folder: Folder) => void
  onDeleteFolder: (id: string) => void
  onMoveFolder: (folderId: string, newParentId: string | null) => void
  onDropWords?: (wordIds: string[], targetFolderId: string) => void
}

export function FolderTree({
  folders,
  selectedFolderId,
  onSelectFolder,
  onAddFolder,
  onEditFolder,
  onDeleteFolder,
  onMoveFolder,
  onDropWords,
}: FolderTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = new Set(expanded)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpanded(next)
  }

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: DragEvent, folder: Folder) => {
    e.stopPropagation()
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'folder', id: folder.id }))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: DragEvent, folderId: string | null) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverId !== folderId) {
      setDragOverId(folderId)
    }
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverId(null)
  }

  const handleDrop = (e: DragEvent, targetId: string | null) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverId(null)
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'))
      if (data.type === 'folder') {
        if (data.id === targetId) return // Cannot drop into itself
        onMoveFolder(data.id, targetId)
      } else if (data.type === 'words') {
        if (targetId) {
          onDropWords?.(data.wordIds, targetId)
        }
      }
    } catch (err) {
      // ignore
    }
  }

  // Build tree structure
  const buildTree = (parentId?: string): Folder[] => {
    return folders.filter((f) => (parentId ? f.parentId === parentId : !f.parentId))
  }

  const renderNode = (folder: Folder, depth = 0) => {
    const children = buildTree(folder.id)
    const hasChildren = children.length > 0
    const isExpanded = expanded.has(folder.id)
    const isSelected = selectedFolderId === folder.id
    const isDragOver = dragOverId === folder.id

    return (
      <div key={folder.id}>
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, folder)}
          onDragOver={(e) => handleDragOver(e, folder.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, folder.id)}
          onClick={() => onSelectFolder(folder.id)}
          className={cn(
            "group flex items-center justify-between py-1.5 px-2 rounded-lg cursor-pointer transition-colors relative",
            isSelected ? "bg-accent-50 text-accent-700 font-medium" : "hover:bg-gray-100 text-gray-700",
            isDragOver ? "ring-2 ring-accent-400 bg-accent-50/50" : ""
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <button
              onClick={(e) => toggleExpand(folder.id, e)}
              className={cn("p-0.5 rounded hover:bg-gray-200 shrink-0", !hasChildren && "opacity-0 cursor-default")}
              disabled={!hasChildren}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            
            <div style={{ color: folder.color }} className="shrink-0">
              {isExpanded ? <FolderOpen className="w-5 h-5 fill-current opacity-20" /> : <FolderIcon className="w-5 h-5 fill-current opacity-20" />}
            </div>
            
            <span className="truncate text-sm">{folder.name}</span>
          </div>

          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onAddFolder(folder.id) }}
              className="p-1 text-gray-400 hover:text-accent-600 rounded hover:bg-white shrink-0"
              title="Thêm thư mục con"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onEditFolder(folder) }}
              className="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-white shrink-0"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id) }}
              className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-white shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && hasChildren && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              {children.map(child => renderNode(child, depth + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  const rootNodes = buildTree()

  return (
    <div 
      className={cn("flex flex-col gap-1 select-none h-full", dragOverId === null && "pb-8")}
      onDragOver={(e) => handleDragOver(e, null)}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e, null)}
    >
      <div 
        onClick={() => onSelectFolder(null)}
        className={cn(
          "flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-colors mb-2",
          selectedFolderId === null ? "bg-accent-50 text-accent-700 font-bold" : "hover:bg-gray-100 text-gray-700 font-medium",
          dragOverId === null ? "ring-2 ring-accent-400 bg-accent-50/50" : ""
        )}
      >
        <FolderIcon className="w-5 h-5 text-gray-400" />
        <span className="text-sm">Tất cả từ vựng</span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        {rootNodes.map(folder => renderNode(folder, 0))}
        
        {folders.length === 0 && (
          <div className="text-center p-4 text-sm text-gray-400 italic">
            Chưa có thư mục nào
          </div>
        )}
      </div>
    </div>
  )
}
