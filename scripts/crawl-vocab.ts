import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

/**
 * Script crawl từ vựng từ Free Dictionary API
 * Usage: npx tsx scripts/crawl-vocab.ts "word1, word2, word3"
 */

const DICTIONARY_API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en/'

interface CrawledWord {
  id: string
  word: string
  ipa: string
  partOfSpeech: string
  definitions: { meaning: string; vietnamese: string }[]
  examples: { sentence: string; vietnamese: string }[]
  synonyms: string[]
  antonyms: string[]
  tags: string[]
  difficulty: number
  imageUrls: string[]
}

async function crawlWord(word: string): Promise<CrawledWord | null> {
  try {
    console.log(`Fetching: ${word}...`)
    const res = await fetch(`${DICTIONARY_API_URL}${encodeURIComponent(word)}`)
    if (!res.ok) {
      console.error(`❌ Không tìm thấy từ: ${word}`)
      return null
    }

    const data = await res.json()
    const entry = data[0]

    // Lấy IPA (ưu tiên US)
    let ipa = ''
    if (entry.phonetics && entry.phonetics.length > 0) {
      const ph = entry.phonetics.find((p: any) => p.text)
      if (ph) ipa = ph.text
    }

    // Lấy nghĩa đầu tiên
    let partOfSpeech = 'noun'
    let meaning = ''
    let example = ''
    const synonyms: string[] = []

    if (entry.meanings && entry.meanings.length > 0) {
      const m = entry.meanings[0]
      partOfSpeech = m.partOfSpeech

      if (m.synonyms) synonyms.push(...m.synonyms.slice(0, 3))
      
      if (m.definitions && m.definitions.length > 0) {
        meaning = m.definitions[0].definition
        example = m.definitions[0].example || ''
      }
    }

    // Tạo đối tượng từ vựng
    const crawled: CrawledWord = {
      id: uuidv4(),
      word: entry.word,
      ipa: ipa,
      partOfSpeech: partOfSpeech,
      definitions: [
        {
          meaning: meaning,
          // Để trống nghĩa tiếng Việt cho user tự điền hoặc có thể tích hợp API dịch sau
          vietnamese: '[Cần dịch] ' + meaning.split(' ').slice(0, 3).join(' ') + '...',
        },
      ],
      examples: example ? [
        {
          sentence: example,
          vietnamese: '[Cần dịch]',
        }
      ] : [],
      synonyms: synonyms,
      antonyms: [],
      tags: ['crawled'],
      difficulty: 3,
      imageUrls: [],
    }

    console.log(`✅ Thành công: ${word}`)
    return crawled
  } catch (error) {
    console.error(`❌ Lỗi khi tải từ ${word}:`, error)
    return null
  }
}

async function main() {
  const args = process.argv.slice(2)
  if (args.length === 0) {
    console.log(`
Hướng dẫn sử dụng:
  npx tsx scripts/crawl-vocab.ts "apple, banana, cat, dog"
  
Kết quả sẽ được lưu vào file crawled-words.json
Bạn có thể import file này vào app qua trang Import.
    `)
    return
  }

  const inputWords = args.join(' ').split(',').map(w => w.trim()).filter(Boolean)
  const results: CrawledWord[] = []

  for (const word of inputWords) {
    const data = await crawlWord(word)
    if (data) results.push(data)
    // Nghỉ 1 chút để tránh rate limit
    await new Promise(r => setTimeout(r, 500))
  }

  if (results.length > 0) {
    const outPath = path.join(process.cwd(), 'crawled-words.json')
    await fs.writeFile(outPath, JSON.stringify(results, null, 2), 'utf-8')
    console.log(`\n🎉 Đã lưu ${results.length} từ vào: ${outPath}`)
    console.log('Bạn có thể mở app, vào trang Import và upload file JSON này.')
  }
}

main()
