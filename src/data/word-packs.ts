import { Word } from '@/types/word'

export interface WordPack {
  id: string
  title: string
  description: string
  icon: string
  color: string
  words: Omit<Word, 'id' | 'createdAt' | 'updatedAt' | 'userId'>[]
}

export const TOPIC_PACKS: WordPack[] = [
  {
    id: 'environment',
    title: 'Môi trường (Environment)',
    description: 'Bộ từ vựng thiết yếu về môi trường, biến đổi khí hậu và bảo vệ tự nhiên.',
    icon: '🌱',
    color: 'bg-emerald-100 text-emerald-700',
    words: [
      {
        word: 'ecosystem',
        ipa: '/ˈiːkəʊˌsɪstəm/',
        partOfSpeech: 'noun',
        definitions: [{ meaning: 'A biological community of interacting organisms and their physical environment.', vietnamese: 'Hệ sinh thái' }],
        examples: [{ sentence: 'Pollution can have disastrous effects on the delicately balanced ecosystem.', vietnamese: 'Ô nhiễm có thể gây ra những hậu quả thảm khốc cho hệ sinh thái.' }],
        synonyms: ['environment', 'nature'],
        antonyms: [],
        tags: ['environment', 'nature', 'science'],
        imageUrls: [],
        difficulty: 2
      },
      {
        word: 'sustainable',
        ipa: '/səˈsteɪnəb(ə)l/',
        partOfSpeech: 'adjective',
        definitions: [{ meaning: 'Able to be maintained at a certain rate or level.', vietnamese: 'Bền vững' }],
        examples: [{ sentence: 'We need to find more sustainable sources of energy.', vietnamese: 'Chúng ta cần tìm kiếm các nguồn năng lượng bền vững hơn.' }],
        synonyms: ['renewable', 'green'],
        antonyms: ['unsustainable', 'temporary'],
        tags: ['environment', 'nature'],
        imageUrls: [],
        difficulty: 2
      }
    ]
  },
  {
    id: 'sports',
    title: 'Thể thao (Sports)',
    description: 'Tất tần tật các từ vựng về thể dục thể thao và thi đấu.',
    icon: '🏃‍♂️',
    color: 'bg-blue-100 text-blue-700',
    words: [
      {
        word: 'tournament',
        ipa: '/ˈtʊənəmənt/',
        partOfSpeech: 'noun',
        definitions: [{ meaning: 'A series of contests between a number of competitors.', vietnamese: 'Giải đấu' }],
        examples: [{ sentence: 'He is playing in a golf tournament.', vietnamese: 'Anh ấy đang thi đấu trong một giải gôn.' }],
        synonyms: ['competition', 'championship'],
        antonyms: [],
        tags: ['sports', 'competition'],
        imageUrls: [],
        difficulty: 1
      },
      {
        word: 'athlete',
        ipa: '/ˈæθliːt/',
        partOfSpeech: 'noun',
        definitions: [{ meaning: 'A person who is proficient in sports and other forms of physical exercise.', vietnamese: 'Vận động viên' }],
        examples: [{ sentence: 'He became a professional athlete at the age of 16.', vietnamese: 'Anh ấy trở thành vận động viên chuyên nghiệp ở tuổi 16.' }],
        synonyms: ['sportsman', 'player'],
        antonyms: [],
        tags: ['sports', 'people'],
        imageUrls: [],
        difficulty: 1
      }
    ]
  }
]
