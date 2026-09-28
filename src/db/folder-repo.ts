import { db } from './database'
import type { Folder } from '@/types/folder'

export const folderRepo = {
  async getAll(): Promise<Folder[]> {
    return await db.folders.orderBy('createdAt').reverse().toArray()
  },

  async add(folder: Folder): Promise<void> {
    await db.folders.add(folder)
  },

  async update(id: string, updates: Partial<Folder>): Promise<void> {
    await db.folders.update(id, { ...updates, updatedAt: Date.now() })
  },

  async delete(id: string): Promise<void> {
    const all = await this.getAll()
    const idsToDelete = new Set<string>([id])
    
    // Find all children recursively
    let changed = true
    while (changed) {
      changed = false
      for (const f of all) {
        if (f.parentId && idsToDelete.has(f.parentId) && !idsToDelete.has(f.id)) {
          idsToDelete.add(f.id)
          changed = true
        }
      }
    }
    
    await db.folders.bulkDelete(Array.from(idsToDelete))
  },

  async bulkAdd(folders: Folder[]): Promise<void> {
    await db.folders.bulkAdd(folders)
  }
}
