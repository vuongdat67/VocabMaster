import { db } from '@/db'
import type { WordPack } from '@/types/word'
import { expandWordList } from './compact-format'
import { ieltsData } from './ielts-words'
import { toeicData } from './toeic-words'
import { sgk10Data } from './sgk10-words'
import { sgk11Data } from './sgk11-words'
import { sgk12Data } from './sgk12-words'

const wordPacks: WordPack[] = [
  // Beginner packs
  {
    id: 'common-2000',
    name: '2000 Từ thông dụng',
    description: 'Các từ tiếng Anh thông dụng nhất, phù hợp mọi trình độ',
    wordCount: 30,
    difficulty: 'beginner',
    tags: ['common', 'beginner'],
  },
  // IELTS packs
  {
    id: 'ielts-academic',
    name: 'IELTS Academic',
    description: 'Từ vựng IELTS học thuật thiết yếu - band 5.0-7.0',
    wordCount: ieltsData.length,
    difficulty: 'intermediate',
    tags: ['ielts', 'academic'],
  },
  {
    id: 'ielts-advanced',
    name: 'IELTS Advanced',
    description: 'Từ vựng IELTS nâng cao dành cho band 7.0+',
    wordCount: ieltsData.filter(w => w.diff >= 4).length,
    difficulty: 'advanced',
    tags: ['ielts', 'advanced'],
  },
  // TOEIC packs
  {
    id: 'toeic-basic',
    name: 'TOEIC Cơ bản',
    description: 'Từ vựng TOEIC cho người mới bắt đầu',
    wordCount: toeicData.length,
    difficulty: 'beginner',
    tags: ['toeic', 'business'],
  },
  {
    id: 'toeic-advanced',
    name: 'TOEIC Nâng cao',
    description: 'Từ vựng TOEIC chuyên sâu về tài chính, thương mại',
    wordCount: toeicData.filter(w => w.diff >= 3).length,
    difficulty: 'advanced',
    tags: ['toeic', 'advanced'],
  },
  // SGK 10 packs
  {
    id: 'sgk10-family',
    name: 'SGK 10 - Family & Body',
    description: 'Từ vựng Unit 1-2: Family Life, Your Body',
    wordCount: sgk10Data.filter(w => w.tags.includes('family') || w.tags.includes('body')).length,
    difficulty: 'beginner',
    tags: ['sgk10', 'family', 'body'],
  },
  {
    id: 'sgk10-music',
    name: 'SGK 10 - Music & Community',
    description: 'Từ vựng Unit 3-4: Music, For a Better Community',
    wordCount: sgk10Data.filter(w => w.tags.includes('music') || w.tags.includes('community')).length,
    difficulty: 'beginner',
    tags: ['sgk10', 'music', 'community'],
  },
  {
    id: 'sgk10-inventions',
    name: 'SGK 10 - Inventions & Equality',
    description: 'Từ vựng Unit 5-6: Inventions, Gender Equality',
    wordCount: sgk10Data.filter(w => w.tags.includes('inventions') || w.tags.includes('gender')).length,
    difficulty: 'intermediate',
    tags: ['sgk10', 'inventions', 'gender'],
  },
  {
    id: 'sgk10-culture',
    name: 'SGK 10 - Culture & Environment',
    description: 'Từ vựng Unit 7-10: Cultural Diversity, Learning, Environment, Eco-tourism',
    wordCount: sgk10Data.filter(w => !w.tags.includes('family') && !w.tags.includes('body') && !w.tags.includes('music') && !w.tags.includes('community') && !w.tags.includes('inventions') && !w.tags.includes('gender')).length,
    difficulty: 'intermediate',
    tags: ['sgk10', 'culture', 'environment', 'learning', 'tourism'],
  },
  // SGK 11 packs
  {
    id: 'sgk11-society',
    name: 'SGK 11 - Society & Relationships',
    description: 'Từ vựng Unit 1-2: Generation Gap, Relationships',
    wordCount: sgk11Data.filter(w => w.tags.includes('society') || w.tags.includes('relationships')).length,
    difficulty: 'intermediate',
    tags: ['sgk11', 'society', 'relationships'],
  },
  {
    id: 'sgk11-life-skills',
    name: 'SGK 11 - Life Skills & Community',
    description: 'Từ vựng Unit 3-4: Independence, Caring for Others',
    wordCount: sgk11Data.filter(w => w.tags.includes('life-skills') || w.tags.includes('community')).length,
    difficulty: 'intermediate',
    tags: ['sgk11', 'life-skills', 'community'],
  },
  {
    id: 'sgk11-global',
    name: 'SGK 11 - Global Issues',
    description: 'Từ vựng Unit 5-6: ASEAN, Global Warming',
    wordCount: sgk11Data.filter(w => w.tags.includes('asean') || w.tags.includes('environment')).length,
    difficulty: 'intermediate',
    tags: ['sgk11', 'asean', 'environment'],
  },
  {
    id: 'sgk11-advanced',
    name: 'SGK 11 - Education & Future',
    description: 'Từ vựng Unit 7-10: Education, Heritage, Cities, Health',
    wordCount: sgk11Data.filter(w => w.tags.includes('education') || w.tags.includes('culture') || w.tags.includes('future') || w.tags.includes('health')).length,
    difficulty: 'advanced',
    tags: ['sgk11', 'education', 'culture', 'future', 'health'],
  },
  // SGK 12 packs
  {
    id: 'sgk12-stories',
    name: 'SGK 12 - Stories & Urbanisation',
    description: 'Từ vựng Unit 1-2: Life Stories, Urbanisation',
    wordCount: sgk12Data.filter(w => w.tags.includes('stories') || w.tags.includes('urban')).length,
    difficulty: 'intermediate',
    tags: ['sgk12', 'stories', 'urban'],
  },
  {
    id: 'sgk12-environment',
    name: 'SGK 12 - Green Movement & Media',
    description: 'Từ vựng Unit 3-4: Green Movement, Mass Media',
    wordCount: sgk12Data.filter(w => w.tags.includes('green') || w.tags.includes('media')).length,
    difficulty: 'intermediate',
    tags: ['sgk12', 'green', 'media'],
  },
  {
    id: 'sgk12-culture-species',
    name: 'SGK 12 - Identity & Species',
    description: 'Từ vựng Unit 5-6: Cultural Identity, Endangered Species',
    wordCount: sgk12Data.filter(w => w.tags.includes('culture') || w.tags.includes('species')).length,
    difficulty: 'advanced',
    tags: ['sgk12', 'culture', 'species'],
  },
  {
    id: 'sgk12-career',
    name: 'SGK 12 - AI & Career',
    description: 'Từ vựng Unit 7-10: AI, Work, Career, Lifelong Learning',
    wordCount: sgk12Data.filter(w => w.tags.includes('ai') || w.tags.includes('work') || w.tags.includes('career') || w.tags.includes('learning')).length,
    difficulty: 'advanced',
    tags: ['sgk12', 'ai', 'work', 'career', 'learning'],
  },
  // Game-focused packs
  {
    id: 'synonym-challenge',
    name: 'Thử thách đồng nghĩa',
    description: 'Các từ thường gặp trong game nối đồng nghĩa',
    wordCount: 40,
    difficulty: 'intermediate',
    tags: ['synonym', 'game'],
  },
]

export async function seedWordPacks() {
  const count = await db.wordPacks.count()
  if (count > 0) return // Already seeded

  try {
    const allWordData = [...ieltsData, ...toeicData, ...sgk10Data, ...sgk11Data, ...sgk12Data]
    const allWords = expandWordList(allWordData).map(w => ({
      ...w,
      tags: [...new Set([...w.tags, 'common'])],
    }))

    await db.words.bulkAdd(allWords, { allKeys: true })
    await db.wordPacks.bulkAdd(wordPacks, { allKeys: true })

    console.log(
      `✅ Seeded ${allWords.length} words and ${wordPacks.length} word packs. ` +
      `(IELTS: ${ieltsData.length}, TOEIC: ${toeicData.length}, ` +
      `SGK10: ${sgk10Data.length}, SGK11: ${sgk11Data.length}, SGK12: ${sgk12Data.length})`
    )
  } catch (err) {
    console.error('Failed to seed data:', err)
  }
}
