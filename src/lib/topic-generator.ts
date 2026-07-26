import type { Word } from '@/types/word'
import { getImageForWord } from './image-search'
import { v4 as uuidv4 } from 'uuid'

export async function generateTopicWords(topic: string, count: number = 10): Promise<Partial<Word>[]> {
  try {
    // 1. Fetch related words from Datamuse
    const dmRes = await fetch(`https://api.datamuse.com/words?ml=${encodeURIComponent(topic)}&max=${count}`)
    const dmWords = await dmRes.json()
    
    if (!dmWords || dmWords.length === 0) return []

    const wordsToFetch = dmWords.map((w: any) => w.word)
    const results: Partial<Word>[] = []

    // 2. Fetch definitions from Free Dictionary API
    for (const w of wordsToFetch) {
      try {
        const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(w)}`)
        if (!dictRes.ok) continue
        const dictData = await dictRes.json()
        
        if (dictData && dictData.length > 0) {
          const entry = dictData[0]
          const meaning = entry.meanings[0]?.definitions[0]?.definition || ''
          const pos = entry.meanings[0]?.partOfSpeech || 'noun'
          let ipa = ''
          if (entry.phonetics) {
            const phonetic = entry.phonetics.find((p: any) => p.text)
            if (phonetic) ipa = phonetic.text
          }

          const imageUrl = await getImageForWord(w)

          results.push({
            id: uuidv4(),
            word: w,
            ipa,
            partOfSpeech: pos,
            definitions: [{
              meaning,
              vietnamese: '(Đang dịch...)' // Placeholder, as free dict doesn't provide VN
            }],
            examples: [],
            synonyms: [],
            antonyms: [],
            tags: [topic.toLowerCase().replace(/\s+/g, '-')],
            imageUrls: imageUrl ? [imageUrl] : [],
            difficulty: 2
          })
        }
      } catch (e) {
        console.warn(`Failed to fetch dict for ${w}`, e)
      }
    }
    
    return results
  } catch (error) {
    console.error('Topic generation failed', error)
    return []
  }
}
