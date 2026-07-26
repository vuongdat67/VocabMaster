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
    await db.folders.delete(id)
  },

  async bulkAdd(folders: Folder[]): Promise<void> {
    await db.folders.bulkAdd(folders)
  }
}
